#!/usr/bin/env node
import {existsSync, readFileSync, rmSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {pathToFileURL} from 'node:url';

const HELP = `usage: node scripts/smoke.mjs [options]   (from the project directory)

  --gpu auto|hardware|software   auto (default): hardware GL, fall back to SwiftShader if none
  --stills <s,s,...>             also save full-size PNG stills at these times (seconds) to output/still/
  --lenient                      only fail on page errors, a missing Render button or no WebGL
                                 (default also fails on console errors, e.g. a font that did not load, or,
                                 offline, the editor's own stylesheets from unpkg.com and Google Fonts)
  --allow-no-webgl               pass without a WebGL context (2D-only projects)
  --fresh                        delete node_modules/.vite first
  --port <n>                     dev server port (default: the project's, usually 9000)`;

const GL_FLAGS = {
  hardware: process.platform === 'darwin' ? ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] : ['--ignore-gpu-blocklist'],
  software: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
};
const SOFTWARE_GL = /swiftshader|llvmpipe|software|basic render/i;

const t0 = Date.now();
const log = msg => console.log(`[smoke ${((Date.now() - t0) / 1000).toFixed(1)}s] ${msg}`);
const fail = msg => {
  console.error(`[smoke] ${msg}`);
  process.exit(1);
};

const args = parseArgs(process.argv.slice(2));
const ROOT = process.cwd();
if (!existsSync(join(ROOT, 'package.json'))) fail('run this from the project directory (no package.json here)');
const req = createRequire(join(ROOT, 'package.json'));
const {chromium} = await load('playwright');
const {createServer} = await load('vite');

let browser = null;
let server = null;
const cleanup = async () => {
  await browser?.close().catch(() => {});
  await server?.close().catch(() => {});
};
process.on('SIGINT', () => cleanup().then(() => process.exit(130)));

let exitCode = 1;
try {
  if (args.fresh) rmSync(join(ROOT, 'node_modules', '.vite'), {recursive: true, force: true});
  server = await createServer({root: ROOT, logLevel: 'warn', server: args.port ? {port: args.port} : {}});
  await server.listen();
  const url = server.resolvedUrls?.local?.[0] ?? `http://localhost:${server.config.server.port}/`;
  log(`dev server ${url}`);

  const launched = await launchWithGpu(args.gpu);
  browser = launched.browser;
  const page = await browser.newPage({viewport: {width: 1600, height: 900}});
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', e => {
    pageErrors.push(e.message);
    console.log(`[pageerror] ${e.message}`);
  });
  page.on('console', m => {
    if (m.type() === 'error') {
      consoleErrors.push(m.text());
      console.log(`[page:error] ${m.text()}`);
    } else if (m.type() === 'warning') console.log(`[page:warning] ${m.text()}`);
  });

  const booted = await bootEditor(page, url, () => {
    pageErrors.length = 0;
    consoleErrors.length = 0;
  });
  // Recalculation runs every frame, so errors in later beats surface here.
  await page.waitForFunction(() => window.commons?.playback.duration > 0, null, {timeout: 120_000}).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);

  const gl = await readGl(page);
  const hasRender = !!(await page.$('#render'));
  const info = booted
    ? await page.evaluate(() => {
        const c = window.commons;
        const s = c.meta.getFullRenderingSettings();
        return {
          project: c.project.name,
          durationSec: +(c.playback.duration / c.playback.fps).toFixed(3),
          renderFps: s.fps,
          size: `${s.size.x}x${s.size.y}`,
          exporter: s.exporter?.name,
          exporters: c.meta.rendering.exporter.exporters.map(e => e.id),
          fonts: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))],
        };
      })
    : null;

  const stills = [];
  if (booted && args.stills.length) {
    const dir = join(ROOT, 'output', 'still', info.project);
    const still = t =>
      page.evaluate(async t => {
        const c = window.commons;
        await c.renderer.renderFrame({...c.meta.getFullRenderingSettings(), name: c.project.name}, t);
      }, t);
    // renderFrame converts seconds with the previous call's fps (30 when fresh), so prime it.
    await still(0);
    await page.waitForTimeout(500);
    for (const t of args.stills) {
      const frame = Math.ceil(t * info.renderFps);
      const file = join(dir, `${String(frame).padStart(6, '0')}.png`);
      rmSync(file, {force: true});
      await still(t);
      for (let i = 0; i < 40 && !existsSync(file); i++) await page.waitForTimeout(250);
      stills.push(existsSync(file) ? `${t}s -> ${file}` : `MISSING ${file}`);
    }
  }

  const checks = {
    editorBooted: booted,
    renderButton: hasRender,
    webgl: gl.ok || args.allowNoWebgl,
    pageErrors: pageErrors.length === 0,
    consoleErrors: args.lenient || consoleErrors.length === 0,
    stills: stills.every(s => !s.startsWith('MISSING')),
  };
  console.log('--- SMOKE RESULT ---');
  console.log(`gpu:          ${launched.mode} | ${gl.ok ? `${gl.version} | ${gl.renderer}` : `NO WEBGL CONTEXT${args.allowNoWebgl ? ' (allowed: --allow-no-webgl)' : ''}`}`);
  console.log(`#render:      ${hasRender}`);
  console.log(`pageerrors:   ${pageErrors.length}`);
  console.log(`console errs: ${consoleErrors.length}${args.lenient ? ' (lenient: not failing)' : ''}`);
  if (info) console.log(`project:      ${JSON.stringify(info)}`);
  for (const s of stills) console.log(`still:        ${s}`);
  const ok = Object.values(checks).every(Boolean);
  console.log(`SMOKE ${ok ? 'PASS' : 'FAIL'} ${JSON.stringify(checks)}`);
  exitCode = ok ? 0 : 1;
} catch (e) {
  console.error(`[smoke] ${e?.stack ?? e}`);
}
await cleanup();
process.exit(exitCode);

function parseArgs(argv) {
  const o = {gpu: 'auto', stills: [], lenient: false, fresh: false, allowNoWebgl: false};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      console.log(HELP);
      process.exit(0);
    }
    if (a === '--lenient' || a === '--fresh') {
      o[a.slice(2)] = true;
      continue;
    }
    if (a === '--allow-no-webgl') {
      o.allowNoWebgl = true;
      continue;
    }
    const m = a.match(/^--([a-z]+)(?:=(.*))?$/);
    if (!m || !['gpu', 'stills', 'port'].includes(m[1])) fail(`unknown argument ${a}\n\n${HELP}`);
    const v = m[2] ?? argv[++i];
    if (v === undefined) fail(`missing value for --${m[1]}`);
    if (m[1] === 'stills') o.stills = v.split(',').map(Number).filter(Number.isFinite);
    else o[m[1]] = m[1] === 'port' ? Number(v) : v;
  }
  if (!['auto', 'hardware', 'software'].includes(o.gpu)) fail('--gpu must be auto, hardware or software');
  return o;
}

async function load(name) {
  let pkgJson;
  try {
    pkgJson = req.resolve(`${name}/package.json`);
  } catch {
    fail(`${name} is not installed in this project: add it to devDependencies and run npm install`);
  }
  const pkg = JSON.parse(readFileSync(pkgJson, 'utf8'));
  const pick = e => (typeof e === 'string' ? e : e && (pick(e.import) ?? pick(e.node) ?? pick(e.default)));
  const entry = pick(pkg.exports?.['.'] ?? pkg.exports) ?? pkg.module ?? pkg.main ?? 'index.js';
  return import(pathToFileURL(join(dirname(pkgJson), entry)).href);
}

async function readGl(page) {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return {ok: false};
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return {ok: true, version: gl.getParameter(gl.VERSION), renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)};
  });
}

async function launch(mode) {
  let b;
  try {
    b = await chromium.launch({channel: 'chrome', headless: true, args: GL_FLAGS[mode]});
  } catch (e) {
    throw new Error(`could not start Google Chrome (channel "chrome"). Install Chrome, or run: npx playwright install chrome\n${e.message}`);
  }
  const p = await b.newPage();
  const gl = await readGl(p);
  await p.close();
  return {browser: b, gl, mode};
}

async function launchWithGpu(choice) {
  if (choice !== 'auto') return launch(choice);
  const hw = await launch('hardware');
  if (hw.gl.ok && !SOFTWARE_GL.test(hw.gl.renderer)) return hw;
  log(`no hardware GL (${hw.gl.ok ? hw.gl.renderer : 'no context'}); falling back to SwiftShader`);
  await hw.browser.close();
  return launch('software');
}

async function bootEditor(page, url, onAttempt = () => {}) {
  const origin = new URL(url).origin;
  for (let attempt = 1; attempt <= 4; attempt++) {
    onAttempt();
    const failed = [];
    const onResponse = r => r.status() >= 500 && r.url().startsWith(origin) && failed.push(`${r.status()} ${r.url()}`);
    page.on('response', onResponse);
    try {
      if (attempt === 1) await page.goto(url, {waitUntil: 'domcontentloaded'});
      else await page.reload({waitUntil: 'domcontentloaded'});
    } catch (e) {
      failed.push(e.message);
    }
    let ready = false;
    for (const end = Date.now() + 45_000; Date.now() < end && !failed.length; ) {
      ready = await page.evaluate(() => !!(window.commons && document.querySelector('#render'))).catch(() => false);
      if (ready) break;
      await page.waitForTimeout(500);
    }
    // Vite may re-optimise deps and force a full reload right after boot.
    let stable = false;
    if (ready) {
      const t = await page.evaluate(() => performance.timeOrigin).catch(() => 0);
      await page.waitForTimeout(1500);
      stable = await page.evaluate(o => performance.timeOrigin === o && !!window.commons, t).catch(() => false);
    }
    page.off('response', onResponse);
    if (stable && failed.length === 0) return true;
    log(`editor not ready (attempt ${attempt}${failed.length ? `: ${failed[0]}` : ''}); waiting, then reloading`);
    await page.waitForTimeout(3000);
  }
  return false;
}

// Idea adapted from HyperFrames (Apache-2.0): probe hardware GL first, fall back to SwiftShader.
