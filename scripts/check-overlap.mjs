#!/usr/bin/env node
// Reports prose shared verbatim (runs of N+ words) between skills/ and a reference corpus.
// Usage: node scripts/check-overlap.mjs --against <dir> [--words 6] [skills/<name> ...]
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, resolve, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const against = flag('--against');
const N = Number(flag('--words', '6'));
if (!against) {
  console.error('usage: check-overlap.mjs --against <dir> [--words 6] [skills/<name> ...]');
  process.exit(2);
}

const SKIP = new Set(['node_modules', '.git', 'dist', 'output', '.vite']);
const TEXT = /\.(md|mdx|ts|tsx|js|mjs|html|txt)$/i;
const walk = (dir, out = []) => {
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e)) continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (TEXT.test(p) && s.size < 2_000_000) out.push(p);
  }
  return out;
};

// Prose only: fenced code blocks are dropped from markdown, code files are skipped entirely.
const prose = text => text.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
const words = text =>
  prose(text).toLowerCase().replace(/[^a-z0-9'\s-]/g, ' ').split(/\s+/).filter(w => w && !/^-+$/.test(w));

const corpus = new Set();
for (const f of walk(resolve(against))) {
  if (!/\.(md|mdx|txt)$/i.test(f)) continue;
  const w = words(readFileSync(f, 'utf8'));
  for (let i = 0; i + N <= w.length; i++) corpus.add(w.slice(i, i + N).join(' '));
}

const targets = args.length ? args.map(a => resolve(a)) : [join(ROOT, 'skills')];
let flagged = 0;
for (const t of targets) {
  for (const f of walk(t).filter(p => p.endsWith('.md'))) {
    const w = words(readFileSync(f, 'utf8'));
    const hit = new Array(w.length).fill(false);
    for (let i = 0; i + N <= w.length; i++) {
      if (corpus.has(w.slice(i, i + N).join(' '))) for (let k = i; k < i + N; k++) hit[k] = true;
    }
    const spans = [];
    for (let i = 0; i < w.length; i++) {
      if (!hit[i]) continue;
      let j = i;
      while (j < w.length && hit[j]) j++;
      spans.push(w.slice(i, j).join(' '));
      i = j;
    }
    if (!spans.length) continue;
    flagged++;
    const pct = ((hit.filter(Boolean).length / w.length) * 100).toFixed(1);
    console.log(`${relative(ROOT, f)}  ${pct}% in shared runs`);
    for (const s of spans) console.log(`    "${s}"`);
  }
}
console.log(`${flagged} file(s) share ${N}+ word runs with ${against}`);
process.exit(flagged ? 1 : 0);
