#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const HELP = `usage: node scripts/render.mjs [options]   (from the project directory)

  --gpu auto|hardware|software   auto (default): hardware GL, fall back to SwiftShader if none
  --exporter image|webcodecs|project
                                 image (default): PNG frames, then system ffmpeg makes the MP4
                                 webcodecs: the WebCodecs exporter writes the MP4 (its plugin must be in vite.config)
                                 project: press the editor's Render button with the exporter saved in project.meta
  --out <file.mp4>               MP4 destination (default output/<project>.mp4)
  --sheet-at <s,s,...>           contact sheet frames at these times in seconds (default: 12 evenly spaced);
                                 written next to the MP4 as <name>-sheet.jpg
  --fps <n>                      override the project's render frame rate
  --crf <n>                      x264 quality for the PNG stitch, lower is better (default 17)
  --lenient                      do not fail on console errors (e.g. offline: the editor's unpkg and Google Fonts stylesheets)
  --allow-no-webgl               render even without a WebGL context (2D-only projects)
  --fresh                        delete node_modules/.vite first (cure for silently short renders)
  --settle <ms>                  pause after fonts load, before frame 0 (default 1500)
  --timeout <min>                give up after this many minutes (default 30)
  --port <n>                     dev server port (default: the project's, usually 9000)`;

const EXPORTERS = {
  image: {name: '@canvas-commons/core/image-sequence', options: {fileType: 'image/png', quality: 100, groupByScene: false}},
  webcodecs: {name: '@canvas-commons/webcodecs', options: {videoCodec: 'avc', videoQuality: 'veryHigh', keyframeInterval: 2, realtime: false, fastStart: true, includeAudio: true, audioSampleRate: 48000}},
};
const UNSUPPORTED = {
  '@canvas-commons/ffmpeg': 'is deprecated in 0.4.0 and writes one frame short (-t (to-from)/fps); use image or webcodecs',
};
const GL_FLAGS = {
  hardware: process.platform === 'darwin' ? ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] : ['--ignore-gpu-blocklist'],
  software: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
};
const SOFTWARE_GL = /swiftshader|llvmpipe|software|basic render/i;

const t0 = Date.now();
const log = msg => console.log(`[render ${((Date.now() - t0) / 1000).toFixed(1)}s] ${msg}`);
const fail = (msg, code = 1) => {
  console.error(`[render] ${msg}`);
  process.exit(code);
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
const deadline = setTimeout(() => {
  console.error(`[render] timed out after ${args.timeout} min`);
  cleanup().then(() => process.exit(1));
}, args.timeout * 60_000);

try {
  if (args.fresh) {
    rmSync(join(ROOT, 'node_modules', '.vite'), {recursive: true, force: true});
    log('cleared node_modules/.vite');
  }
  server = await createServer({root: ROOT, logLevel: 'warn', server: args.port ? {port: args.port} : {}});
  await server.listen();
  const url = server.resolvedUrls?.local?.[0] ?? `http://localhost:${server.config.server.port}/`;
  log(`dev server ${url}`);

  const launched = await launchWithGpu(args.gpu);
  browser = launched.browser;
  log(`gpu ${launched.mode}: ${launched.gl.ok ? launched.gl.renderer : 'NO WEBGL CONTEXT'}`);
  if (!launched.gl.ok && !args.allowNoWebgl) {
    throw new Error('no WebGL context in either GPU mode, so any 3D layer would render blank. For a 2D-only project pass --allow-no-webgl.');
  }

  const page = await browser.newPage({viewport: {width: 1600, height: 900}});
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', e => {
    pageErrors.push(e.message);
    console.log(`[pageerror] ${e.message}`);
  });
  page.on('console', m => {
    if (m.type() === 'error') consoleErrors.push(m.text());
    if (m.type() === 'error' || m.type() === 'warning') console.log(`[page:${m.type()}] ${m.text()}`);
  });
  page.on('crash', () => {
    console.error('[render] the page crashed (often GPU memory); retry with --gpu software');
    cleanup().then(() => process.exit(1));
  });

  await bootEditor(page, url, () => {
    pageErrors.length = 0;
    consoleErrors.length = 0;
  });
  const fonts = await page.evaluate(async () => {
    await Promise.all([...document.fonts].map(f => f.load().catch(() => null)));
    await document.fonts.ready;
    return [...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.family} ${f.weight}`);
  });
  log(`fonts loaded: ${fonts.length ? [...new Set(fonts)].join(', ') : 'none declared (system fonts only)'}`);
  await page.waitForTimeout(args.settle);
  await page.waitForFunction(() => window.commons.playback.duration > 0, null, {timeout: 120_000}).catch(() => {});

  const info = await page.evaluate(() => {
    const c = window.commons;
    const s = c.meta.getFullRenderingSettings();
    return {
      name: c.project.name,
      exporters: c.meta.rendering.exporter.exporters.map(e => e.id),
      saved: s.exporter?.name,
      fps: s.fps,
      range: [s.range[0], Number.isFinite(s.range[1]) ? s.range[1] : null],
      size: [s.size.x, s.size.y],
      durationSec: c.playback.duration / c.playback.fps,
    };
  });
  const exporter = args.exporter === 'project' ? null : EXPORTERS[args.exporter];
  const exporterId = exporter?.name ?? info.saved;
  if (UNSUPPORTED[exporterId]) throw new Error(`exporter ${exporterId} ${UNSUPPORTED[exporterId]}`);
  if (!info.exporters.includes(exporterId)) {
    throw new Error(`exporter ${exporterId} is not registered. Available: ${info.exporters.join(', ')}. Add its plugin to vite.config.ts.`);
  }
  const isImage = exporterId === EXPORTERS.image.name;
  const fps = args.exporter === 'project' ? info.fps : (args.fps ?? info.fps);
  const outDir = resolve(ROOT, 'output');
  const frameDir = join(outDir, info.name);
  const mp4 = resolve(ROOT, args.out ?? join('output', `${info.name}.mp4`));
  const exporterMp4 = join(outDir, `${info.name}.mp4`);
  if (isImage && existsSync(frameDir)) {
    for (const f of readdirSync(frameDir)) if (/^\d+\.png$/.test(f)) rmSync(join(frameDir, f));
  }
  if (!isImage) rmSync(exporterMp4, {force: true});

  const from = Math.ceil((info.range[0] ?? 0) * fps);
  const rangeTo = info.range[1] === null ? Infinity : Math.ceil(info.range[1] * fps);
  const estimate = Math.min(rangeTo, Math.round(info.durationSec * fps)) - from + 1;
  log(`project "${info.name}" ${info.size.join('x')} @ ${fps}fps, ${info.durationSec.toFixed(3)}s, exporter ${exporterId}`);

  const tRender = Date.now();
  await page.evaluate(
    ({exporter, fps, click}) => {
      const c = window.commons;
      const state = (window.__render = {last: -1, result: null, duration: null});
      c.renderer.onFrameChanged.subscribe(f => (state.last = Math.max(state.last, f)), false);
      c.renderer.onFinished.subscribe(r => {
        state.result = r;
        state.duration = c.renderer.playback?.duration ?? null;
      });
      if (click) {
        document.querySelector('#render').click();
        return;
      }
      const settings = {...c.meta.getFullRenderingSettings(), name: c.project.name, fps};
      if (exporter) settings.exporter = exporter;
      c.renderer.render(settings); // same call as the editor's Render button
    },
    {exporter, fps, click: args.exporter === 'project'},
  );

  let state = {last: -1, result: null, duration: null};
  let lastLog = 0;
  while (state.result === null) {
    await page.waitForTimeout(500);
    state = await page.evaluate(() => window.__render);
    if (Date.now() - lastLog > 5000) {
      lastLog = Date.now();
      const done = Math.max(0, state.last - from + 1);
      const rate = done / Math.max(0.001, (Date.now() - tRender) / 1000);
      log(`frame ${done}/${estimate} (${rate.toFixed(1)} fps)`);
    }
  }
  const renderSec = (Date.now() - tRender) / 1000;
  const RESULTS = ['success', 'error', 'aborted'];
  log(`renderer finished: ${RESULTS[state.result] ?? state.result} in ${renderSec.toFixed(1)}s`);
  if (state.result !== 0) throw new Error(`renderer reported ${RESULTS[state.result] ?? state.result}; see the [page:error] lines above`);

  const exported = Math.max(state.last, from) - from + 1;
  const engineKnown = Number.isFinite(state.duration);
  const expected = engineKnown ? Math.min(rangeTo, state.duration) - from + 1 : estimate;
  // WebCodecs encodes frames from..to-1 and skips the last exported frame by design.
  const expectedMp4 = isImage ? exported : exported - 1;

  let onDisk;
  let tStitch = 0;
  if (isImage) {
    const files = existsSync(frameDir) ? readdirSync(frameDir).filter(f => /^\d+\.png$/.test(f)).sort() : [];
    onDisk = files.length;
    if (!onDisk) throw new Error(`no PNG frames in ${frameDir}`);
    const t = Date.now();
    mkdirSync(dirname(mp4), {recursive: true});
    run('ffmpeg', [
      '-y', '-v', 'error', '-framerate', String(fps), '-start_number', String(Number(files[0].slice(0, -4))),
      '-i', join(frameDir, '%06d.png'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      '-c:v', 'libx264', '-crf', String(args.crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4,
    ]);
    tStitch = (Date.now() - t) / 1000;
  } else {
    for (let i = 0; i < 120 && !existsSync(exporterMp4); i++) await page.waitForTimeout(250);
    if (!existsSync(exporterMp4)) throw new Error(`exporter did not write ${exporterMp4}`);
    if (resolve(exporterMp4) !== mp4) {
      mkdirSync(dirname(mp4), {recursive: true});
      copyFileSync(exporterMp4, mp4);
    }
  }

  const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=nb_read_frames,width,height,r_frame_rate:format=duration', '-of', 'json', mp4]));
  const mp4Frames = Number(probe.streams?.[0]?.nb_read_frames);
  const sheet = mp4.replace(/\.mp4$/i, '') + '-sheet.jpg';
  const last = Math.max(0, mp4Frames - 1);
  const picks = args.sheetAt
    ? args.sheetAt.map(t => Math.min(last, Math.max(0, Math.round(t * fps) - from)))
    : Array.from({length: 12}, (_, i) => Math.round((i * last) / 11));
  const unique = [...new Set(picks)];
  const cols = Math.min(4, unique.length);
  run('ffmpeg', ['-y', '-v', 'error', '-i', mp4, '-vf', `select=${unique.map(f => `eq(n\\,${f})`).join('+')},scale=480:-2,tile=${cols}x${Math.ceil(unique.length / cols)}`, '-fps_mode', 'vfr', '-frames:v', '1', sheet]);

  const result = {
    ok: true,
    gpu: launched.mode,
    renderer: launched.gl.ok ? launched.gl.renderer : null,
    exporter: exporterId,
    fps,
    expectedFrames: expected,
    expectedFrom: engineKnown ? 'engine' : 'player estimate',
    exportedFrames: exported,
    pngFrames: onDisk ?? null,
    mp4Frames,
    expectedMp4Frames: expectedMp4,
    mp4Duration: Number(probe.format?.duration),
    size: `${probe.streams?.[0]?.width}x${probe.streams?.[0]?.height}`,
    renderSeconds: +renderSec.toFixed(1),
    stitchSeconds: +tStitch.toFixed(1),
    totalSeconds: +((Date.now() - t0) / 1000).toFixed(1),
    pageErrors: pageErrors.length,
    consoleErrors: consoleErrors.length,
    out: mp4,
    sheet,
    sheetFrames: unique,
  };
  const problems = [];
  if (engineKnown ? exported !== expected : Math.abs(exported - expected) > 1) {
    problems.push(`engine exported ${exported} frames, expected ${expected} ((to - from) + 1); try --fresh`);
  }
  if (onDisk !== undefined && onDisk !== exported) problems.push(`${onDisk} PNGs on disk but the engine exported ${exported}`);
  if (mp4Frames !== expectedMp4) problems.push(`MP4 has ${mp4Frames} frames, expected ${expectedMp4} for ${isImage ? 'a PNG stitch' : 'WebCodecs'}`);
  if (pageErrors.length) problems.push(`${pageErrors.length} page error(s)`);
  if (consoleErrors.length && !args.lenient) problems.push(`${consoleErrors.length} console error(s); --lenient accepts them`);
  if (!engineKnown) log('engine duration not readable; checked against the player estimate (+/- 1)');
  result.ok = problems.length === 0;
  for (const p of problems) console.log(`[render] CHECK FAILED: ${p}`);
  console.log(`RESULT ${JSON.stringify(result)}`);
  await cleanup();
  clearTimeout(deadline);
  process.exit(result.ok ? 0 : 2);
} catch (e) {
  console.error(`[render] ${e?.stack ?? e}`);
  await cleanup();
  clearTimeout(deadline);
  process.exit(1);
}

function parseArgs(argv) {
  const o = {gpu: 'auto', exporter: 'image', crf: 17, settle: 1500, timeout: 30, fresh: false, lenient: false, allowNoWebgl: false, sheetAt: null};
  const FLAGS = {'--fresh': 'fresh', '--lenient': 'lenient', '--allow-no-webgl': 'allowNoWebgl'};
  const VALUES = ['gpu', 'exporter', 'out', 'fps', 'crf', 'settle', 'timeout', 'port', 'sheet-at'];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      console.log(HELP);
      process.exit(0);
    }
    if (FLAGS[a]) {
      o[FLAGS[a]] = true;
      continue;
    }
    const m = a.match(/^--([a-z-]+)(?:=(.*))?$/);
    if (!m || !VALUES.includes(m[1])) fail(`unknown argument ${a}\n\n${HELP}`);
    const v = m[2] ?? argv[++i];
    if (v === undefined) fail(`missing value for --${m[1]}`);
    if (m[1] === 'sheet-at') {
      o.sheetAt = v.split(',').map(Number).filter(Number.isFinite);
      if (!o.sheetAt.length) fail('--sheet-at needs comma-separated seconds, e.g. 0.6,1.4,2.2');
    } else o[m[1]] = ['fps', 'crf', 'settle', 'timeout', 'port'].includes(m[1]) ? Number(v) : v;
  }
  if (!['auto', 'hardware', 'software'].includes(o.gpu)) fail('--gpu must be auto, hardware or software');
  if (!['image', 'webcodecs', 'project'].includes(o.exporter)) fail('--exporter must be image, webcodecs or project');
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
    if (stable && failed.length === 0) return;
    log(`editor not ready (attempt ${attempt}${failed.length ? `: ${failed[0]}` : ''}); waiting, then reloading`);
    await page.waitForTimeout(3000);
  }
  throw new Error('the editor never booted; run `npm run smoke` to see the errors');
}

function run(cmd, argv) {
  const r = spawnSync(cmd, argv, {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
  if (r.error) throw new Error(`${cmd} not found on PATH (${r.error.message})`);
  if (r.status !== 0) throw new Error(`${cmd} failed: ${r.stderr}`);
  return r.stdout;
}

// Idea adapted from HyperFrames (Apache-2.0): probe hardware GL first, fall back to SwiftShader.
