export type RampWindow = {
  at: number;
  len: number;
  hang: readonly [from: number, to: number];
  slow: number;
  strength?: number;
  edge?: number;
};

export type SolvedRamp = RampWindow & {fast: number; slowRate: number};

export type TimeWarp = {
  tau: (t: number) => number;
  rate: (t: number) => number;
  ramps: readonly SolvedRamp[];
};

type Table = {ramp: SolvedRamp; h: number; rates: Float64Array; cum: Float64Array};

const smoothstep = (a: number, b: number, v: number): number => {
  const x = b > a ? Math.min(1, Math.max(0, (v - a) / (b - a))) : v < a ? 0 : 1;
  return x * x * (3 - 2 * x);
};

function buildTable(w: RampWindow, step: number): Table {
  const start = w.at, end = w.at + w.len;
  const e = Math.max(0, Math.min(w.edge ?? 0.1, w.len / 5));
  const h0 = Math.max(w.hang[0], start + 2 * e), h1 = Math.min(w.hang[1], end - 2 * e);
  const strength = Math.min(1, Math.max(0, w.strength ?? 1));
  const slowRate = 1 + (Math.min(1, Math.max(0.01, w.slow)) - 1) * strength;

  const inWindow = (t: number) => smoothstep(start, start + e, t) * (1 - smoothstep(end - e, end, t));
  const inHang = (t: number) =>
    h1 > h0 ? smoothstep(h0 - e, h0, t) * (1 - smoothstep(h1, h1 + e, t)) : 0;
  // r = base + fast * gain, linear in fast, so the time-neutral fast level is one division.
  const base = (t: number) => (1 - inWindow(t)) * (1 - inHang(t)) + slowRate * inHang(t);
  const gain = (t: number) => inWindow(t) * (1 - inHang(t));

  const n = Math.max(16, Math.ceil(w.len / step)), h = w.len / n;
  const ts = Array.from({length: n + 1}, (_, i) => (i === n ? end : start + i * h));
  const trapezoid = (f: (t: number) => number) =>
    ts.reduce((sum, t, i) => sum + (i === 0 || i === n ? 0.5 : 1) * f(t), 0) * h;
  const fast = (w.len - trapezoid(base)) / trapezoid(gain);

  const rates = Float64Array.from(ts, t => base(t) + fast * gain(t));
  const cum = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) cum[i + 1] = cum[i] + 0.5 * h * (rates[i] + rates[i + 1]);
  return {ramp: {...w, fast, slowRate}, h, rates, cum};
}

export function makeTimeWarp(windows: readonly RampWindow[], step = 1 / 1000): TimeWarp {
  const tables = windows
    .filter(w => w.len > 0)
    .map(w => buildTable(w, step))
    .sort((a, b) => a.ramp.at - b.ramp.at);
  for (let i = 1; i < tables.length; i++) {
    const prev = tables[i - 1].ramp;
    if (prev.at + prev.len > tables[i].ramp.at) throw new Error('time-warp: ramp windows overlap');
  }

  const locate = (t: number) => {
    const tb = tables.find(x => t > x.ramp.at && t < x.ramp.at + x.ramp.len);
    if (!tb) return null;
    const x = (t - tb.ramp.at) / tb.h;
    const i = Math.min(tb.rates.length - 2, Math.floor(x));
    return {tb, i, u: x - i};
  };

  const rate = (t: number): number => {
    const p = locate(t);
    if (!p) return 1;
    const {rates} = p.tb;
    return rates[p.i] + (rates[p.i + 1] - rates[p.i]) * p.u;
  };

  // Integrates the per-cell linear rate exactly, so tau stays strictly increasing.
  const tau = (t: number): number => {
    const p = locate(t);
    if (!p) return t;
    const {tb, i, u} = p;
    const r0 = tb.rates[i], r1 = tb.rates[i + 1];
    return tb.ramp.at + tb.cum[i] + tb.h * (r0 * u + 0.5 * (r1 - r0) * u * u);
  };

  return {tau, rate, ramps: tables.map(x => x.ramp)};
}
