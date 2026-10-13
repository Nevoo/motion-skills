// API: references/assets.md. Times in seconds; speeds in whatever units camera.speed returns.

export interface SpeedSource {
  speed(t: number): number;
}

export interface Span {
  from: number;
  to: number;
}

export interface CopyBeat extends Span {
  name: string;
}

export interface Read {
  name: string;
  lastWordAt: number;
}

export interface Exempt extends Span {
  why: string;
}

export interface TimingAuditOptions {
  end: number;
  start?: number;
  camera: SpeedSource;
  copy: readonly CopyBeat[];
  reads?: readonly Read[];
  exempt?: readonly Exempt[];
  visibleSpeed?: number;
  visibleShare?: number;
  maxDead?: number;
  maxReadGap?: number;
  step?: number;
}

export interface DeadSpot extends Span {
  dur: number;
  cameraMedian: number;
}

export interface ReadGap {
  name: string;
  lastWordAt: number;
  moveAt: number | null;
  gap: number;
  ok: boolean;
  exempt?: string;
}

export interface TimingAudit {
  start: number;
  end: number;
  peakSpeed: number;
  visibleSpeed: number;
  visibleShare: number | null;
  maxDead: number;
  maxReadGap: number;
  copy: CopyBeat[];
  exempt: Exempt[];
  deadSpots: DeadSpot[];
  readGaps: ReadGap[];
  ok: boolean;
}

export const VISIBLE_SHARE = 0.15;
const EPS = 1e-9;

const inside = (spans: readonly Span[], t: number): Span | undefined =>
  spans.find(s => t >= s.from - EPS && t <= s.to + EPS);

// Boundary of a predicate that is false at a and true at b.
function edge(test: (t: number) => boolean, a: number, b: number): number {
  for (let i = 0; i < 30; i++) {
    const m = (a + b) / 2;
    if (test(m)) b = m;
    else a = m;
  }
  return b;
}

export function auditTiming(o: TimingAuditOptions): TimingAudit {
  const start = o.start ?? 0;
  const end = o.end;
  const step = o.step ?? 1 / 240;
  const maxDead = o.maxDead ?? 0.3;
  const maxReadGap = o.maxReadGap ?? 0.3;
  const copy = o.copy;
  const reads = o.reads ?? [];
  const exempt = [...(o.exempt ?? [])];
  if (!(end > start)) throw new Error('auditTiming: end must be after start');
  if (!(step > 0)) throw new Error('auditTiming: step must be positive');
  for (const s of [...copy, ...exempt]) {
    if (!(s.to >= s.from)) throw new Error(`auditTiming: span ${JSON.stringify(s)} ends before it starts`);
  }
  for (const r of reads) {
    if (!(r.lastWordAt >= start && r.lastWordAt <= end)) throw new Error(`auditTiming: read "${r.name}" lands outside ${start}-${end}s`);
  }

  const n = Math.max(1, Math.ceil((end - start) / step - EPS));
  const h = (end - start) / n;
  const ts = Array.from({length: n + 1}, (_, i) => (i === n ? end : start + i * h));
  const speeds = ts.map(t => o.camera.speed(t));
  const peakSpeed = Math.max(...speeds);
  const visibleShare = o.visibleSpeed === undefined ? (o.visibleShare ?? VISIBLE_SHARE) : null;
  const visibleSpeed = o.visibleSpeed ?? (visibleShare as number) * peakSpeed;

  const moving = (t: number) => o.camera.speed(t) >= visibleSpeed;
  const dead = (t: number) => !moving(t) && !inside(copy, t) && !inside(exempt, t);
  const deadSpots: DeadSpot[] = [];
  let runFrom = -1;
  for (let i = 0; i <= n + 1; i++) {
    const isDead = i <= n && dead(ts[i]);
    if (isDead && runFrom < 0) runFrom = i;
    if (isDead || runFrom < 0) continue;
    const a = runFrom;
    const b = i - 1;
    runFrom = -1;
    const from = a === 0 ? start : edge(dead, ts[a - 1], ts[a]);
    const to = b === n ? end : edge(t => !dead(t), ts[b], ts[b + 1]);
    if (to - from <= maxDead + EPS) continue;
    const run = speeds.slice(a, b + 1).sort((x, y) => x - y);
    deadSpots.push({from, to, dur: to - from, cameraMedian: run[run.length >> 1]});
  }

  const readGaps: ReadGap[] = reads.map(r => {
    let moveAt: number | null = null;
    if (moving(r.lastWordAt)) moveAt = r.lastWordAt;
    else {
      const i = ts.findIndex(t => t > r.lastWordAt && moving(t));
      if (i >= 0) moveAt = edge(moving, Math.max(r.lastWordAt, ts[i - 1]), ts[i]);
    }
    const gap = (moveAt ?? end) - r.lastWordAt;
    const why = gap > maxReadGap + EPS ? (inside(exempt, r.lastWordAt) as Exempt | undefined) : undefined;
    return {name: r.name, lastWordAt: r.lastWordAt, moveAt, gap, ok: gap <= maxReadGap + EPS || !!why, ...(why ? {exempt: why.why} : {})};
  });

  return {
    start, end, peakSpeed, visibleSpeed, visibleShare, maxDead, maxReadGap, copy: [...copy], exempt, deadSpots, readGaps,
    ok: deadSpots.length === 0 && readGaps.every(g => g.ok),
  };
}

export function formatTimingAudit(a: TimingAudit, unit = 'units/s'): string {
  const s = (v: number) => `${v.toFixed(2)}s`;
  const basis = a.visibleShare === null ? 'set by hand' : `${Math.round(a.visibleShare * 100)}% of its peak ${a.peakSpeed.toFixed(2)}`;
  const out = [`camera counts as moving at ${a.visibleSpeed.toFixed(2)} ${unit} or faster (${basis})`, 'copy animating:'];
  const cw = Math.max(0, ...a.copy.map(c => c.name.length));
  for (const c of [...a.copy].sort((x, y) => x.from - y.from)) out.push(`  ${c.name.padEnd(cw)}  ${s(c.from)}-${s(c.to)}`);
  for (const e of a.exempt) out.push(`exempt: ${s(e.from)}-${s(e.to)} ${e.why}`);
  out.push(`dead spots (over ${s(a.maxDead)} with no copy animating and the camera slower than that):`);
  if (!a.deadSpots.length) out.push('  none');
  for (const d of a.deadSpots) {
    out.push(`  ${s(d.from)}-${s(d.to)}  ${d.dur.toFixed(2)} s  camera median ${d.cameraMedian.toFixed(2)} ${unit}`);
  }
  out.push(`read gaps (last word landed, until the camera moves that fast; at most ${s(a.maxReadGap)}):`);
  if (!a.readGaps.length) out.push('  none');
  const w = Math.max(0, ...a.readGaps.map(g => g.name.length));
  for (const g of a.readGaps) {
    const verdict = g.exempt ? `exempt: ${g.exempt}` : g.ok ? 'ok' : 'TOO LONG';
    const move = g.moveAt === null ? 'never' : s(g.moveAt);
    out.push(`  ${g.name.padEnd(w)}  landed ${s(g.lastWordAt)}  moves ${move}  gap ${g.gap.toFixed(2)} s  ${verdict}`);
  }
  const long = a.readGaps.filter(g => !g.ok).length;
  out.push(
    a.ok
      ? 'TIMING PASS'
      : `TIMING FAIL: ${a.deadSpots.length} dead spot${a.deadSpots.length === 1 ? '' : 's'}, ${long} read gap${long === 1 ? '' : 's'} too long`,
  );
  return out.join('\n');
}
