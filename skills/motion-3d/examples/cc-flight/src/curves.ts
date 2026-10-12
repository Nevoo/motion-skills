export type Ease = (t: number, from?: number, to?: number) => number;
export type CurvePoints = readonly [x1: number, y1: number, x2: number, y2: number];
export type CurveName =
  | 'OUT' | 'IN_OUT' | 'DRAG' | 'BOUNCE'
  | 'RAMP' | 'RAMP_LONG' | 'ACCEL' | 'GLIDE';

export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Ease {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const xAt = (s: number) => ((ax * s + bx) * s + cx) * s;
  const yAt = (s: number) => ((ay * s + by) * s + cy) * s;
  const dxAt = (s: number) => (3 * ax * s + 2 * bx) * s + cx;

  const solve = (t: number): number => {
    let s = t;
    for (let i = 0; i < 8; i++) {
      const err = xAt(s) - t;
      if (Math.abs(err) < 1e-7) return s;
      const d = dxAt(s);
      if (Math.abs(d) < 1e-6) break;
      s -= err / d;
    }
    // Newton can stall on flat x; bisection is safe since x is monotone on [0, 1].
    let lo = 0, hi = 1;
    s = t;
    for (let i = 0; i < 40; i++) {
      if (xAt(s) < t) lo = s; else hi = s;
      s = (lo + hi) / 2;
    }
    return s;
  };

  return (t: number, from = 0, to = 1) => {
    const p = t <= 0 ? 0 : t >= 1 ? 1 : yAt(solve(t));
    return from + (to - from) * p;
  };
}

export const CURVE_POINTS: Readonly<Record<CurveName, CurvePoints>> = {
  OUT: [0.16, 1, 0.3, 1],
  IN_OUT: [0.65, 0, 0.35, 1],
  DRAG: [0.72, 0, 0.18, 1],
  BOUNCE: [0.34, 1.45, 0.5, 1],
  RAMP: [0.85, 0, 0.15, 1],
  RAMP_LONG: [0.9, 0, 0.16, 1],
  ACCEL: [0.55, 0.055, 0.675, 0.19],
  GLIDE: [0.25, 0.1, 0.2, 1],
};

const named = (n: CurveName): Ease => cubicBezier(...CURVE_POINTS[n]);

export const OUT = named('OUT');
export const IN_OUT = named('IN_OUT');
export const DRAG = named('DRAG');
export const BOUNCE = named('BOUNCE');
export const RAMP = named('RAMP');
export const RAMP_LONG = named('RAMP_LONG');
export const ACCEL = named('ACCEL');
export const GLIDE = named('GLIDE');

export const CURVES: Readonly<Record<CurveName, Ease>> = {
  OUT, IN_OUT, DRAG, BOUNCE, RAMP, RAMP_LONG, ACCEL, GLIDE,
};

export const cssEase = (n: CurveName): string => `cubic-bezier(${CURVE_POINTS[n].join(', ')})`;

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
export const seg = (t: number, start: number, duration: number): number =>
  duration <= 0 ? (t < start ? 0 : 1) : clamp01((t - start) / duration);

export function timeAt(ease: Ease, value: number, samples = 256): number {
  if (ease(0) >= value) return 0;
  for (let i = 1; i <= samples; i++) {
    if (ease(i / samples) < value) continue;
    let lo = (i - 1) / samples, hi = i / samples;
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (ease(mid) >= value) hi = mid; else lo = mid;
    }
    return hi;
  }
  return 1;
}
