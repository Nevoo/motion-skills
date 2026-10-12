#!/usr/bin/env node
// Lints skills/: frontmatter, sizes, links, rule indexes, Claude Code loader gotchas, private terms.
// Usage: node scripts/lint-skills.mjs [skills/<name> ...]   (default: every skill)
import {readFileSync, readdirSync, statSync, existsSync} from 'node:fs';
import {join, dirname, basename, resolve, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ALLOWED_KEYS = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata']);
// Names of real people and clients go in the gitignored .private-terms (one per line), never in this file.
const PRIVATE_TERMS = join(ROOT, '.private-terms');
const BLOCKLIST = [
  '/users/', '/home/', '~/developer',
  ...(existsSync(PRIVATE_TERMS)
    ? readFileSync(PRIVATE_TERMS, 'utf8').split('\n').map(s => s.trim().toLowerCase()).filter(s => s && !s.startsWith('#'))
    : []),
];
const SKIP_DIRS = new Set(['node_modules', '.vite', 'output', 'dist', '.git']);
const TEXT_EXT = /\.(md|ts|tsx|js|mjs|json|html|css|txt|meta)$/i;

const errors = [];
const warns = [];
const err = (f, m) => errors.push(`${relative(ROOT, f)}: ${m}`);
const warn = (f, m) => warns.push(`${relative(ROOT, f)}: ${m}`);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (SKIP_DIRS.has(e)) continue;
    const p = join(dir, e);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const fm = {};
  let key = null;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s?(.*)$/);
    if (kv) { key = kv[1]; fm[key] = kv[2]; }
    else if (key && /^\s/.test(line)) fm[key] += '\n' + line;
  }
  return {fm, body: text.slice(m[0].length)};
}

// Unquoted one-line YAML scalars break on ": " or " #" and can't start with an indicator character.
function yamlScalarErrors(file, fm) {
  for (const [k, raw] of Object.entries(fm)) {
    const v = raw.trim();
    if (!v || v.includes('\n') || /^["'|>[{]/.test(v)) continue;
    if (/:\s/.test(v)) err(file, `frontmatter "${k}" is unquoted and contains ": " (invalid YAML); reword or quote it`);
    if (/\s#/.test(v)) err(file, `frontmatter "${k}" is unquoted and contains " #" (YAML comment); reword or quote it`);
    if (/^[-?:,\]}&*!%@`]/.test(v)) err(file, `frontmatter "${k}" starts with a YAML indicator character; quote it`);
  }
}

function outsideFences(text) {
  const lines = text.split('\n');
  let fence = false;
  return lines.map((l, i) => {
    if (/^\s*(```|~~~)/.test(l)) { fence = !fence; return [i + 1, '']; }
    return [i + 1, fence ? '' : l];
  });
}

function lintMarkdown(file, text) {
  for (const [n, line] of outsideFences(text)) {
    for (const span of line.match(/`[^`]+`/g) ?? []) {
      if (span.includes('!')) err(file, `line ${n}: inline code with "!" can stop Claude Code loading the skill: ${span}`);
      if (/>\w/.test(span)) err(file, `line ${n}: inline code with ">" before a word character can stop Claude Code loading the skill: ${span}`);
    }
    for (const [, target] of line.matchAll(/\]\(([^)\s#]+)(#[^)]*)?\)/g)) {
      if (/^(https?:|mailto:)/.test(target)) continue;
      if (!existsSync(resolve(dirname(file), target))) err(file, `line ${n}: broken link -> ${target}`);
    }
  }
}

function lintSkill(dir) {
  const skillMd = join(dir, 'SKILL.md');
  if (!existsSync(skillMd)) return err(dir, 'missing SKILL.md');
  const parsed = frontmatter(readFileSync(skillMd, 'utf8'));
  if (!parsed) return err(skillMd, 'missing frontmatter');
  const {fm, body} = parsed;
  for (const k of Object.keys(fm)) if (!ALLOWED_KEYS.has(k)) err(skillMd, `frontmatter key not allowed: ${k}`);
  yamlScalarErrors(skillMd, fm);
  if (fm.name !== basename(dir)) err(skillMd, `name "${fm.name}" must match directory "${basename(dir)}"`);
  const desc = (fm.description ?? '').trim();
  if (!desc) err(skillMd, 'description missing');
  if (desc.length > 1024) err(skillMd, `description ${desc.length} chars > 1024`);
  else if (desc.length > 900) warn(skillMd, `description ${desc.length} chars (keep <= 900 for headroom)`);
  const bodyLines = body.split('\n').length;
  if (bodyLines > 200) err(skillMd, `body ${bodyLines} lines > 200`);
  else if (bodyLines > 160) warn(skillMd, `body ${bodyLines} lines (target <= 160)`);

  const rulesDir = join(dir, 'rules');
  if (existsSync(rulesDir)) {
    const index = existsSync(join(rulesDir, 'INDEX.md')) ? readFileSync(join(rulesDir, 'INDEX.md'), 'utf8') : null;
    if (!index) err(rulesDir, 'missing rules/INDEX.md');
    for (const f of readdirSync(rulesDir).filter(f => f.endsWith('.md') && f !== 'INDEX.md')) {
      const p = join(rulesDir, f);
      const rfm = frontmatter(readFileSync(p, 'utf8'));
      if (!rfm) { err(p, 'rule missing frontmatter'); continue; }
      yamlScalarErrors(p, rfm.fm);
      if (rfm.fm.name !== f.replace(/\.md$/, '')) err(p, `rule name "${rfm.fm.name}" must match filename`);
      if (!rfm.fm.description) err(p, 'rule missing description');
      if (index && !index.includes(`(${f})`)) err(p, 'rule not listed in rules/INDEX.md');
    }
  }

  for (const f of walk(dir)) {
    if (!TEXT_EXT.test(f)) continue;
    const text = readFileSync(f, 'utf8');
    const lower = text.toLowerCase();
    for (const term of BLOCKLIST) {
      const re = new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}([^a-z]|$)`, 'm');
      if (re.test(lower)) err(f, `private term "${term}"`);
    }
    if (f.endsWith('.md')) lintMarkdown(f, text);
  }
}

const targets = process.argv.slice(2).length
  ? process.argv.slice(2).map(p => resolve(p))
  : readdirSync(join(ROOT, 'skills')).map(d => join(ROOT, 'skills', d)).filter(p => statSync(p).isDirectory());
targets.forEach(lintSkill);

for (const w of warns) console.log(`warn  ${w}`);
for (const e of errors) console.log(`error ${e}`);
console.log(`${targets.length} skill(s), ${errors.length} error(s), ${warns.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
