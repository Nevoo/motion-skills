// Stand-in so the template runs alone; swap in motion-craft's assets/curves.ts.
import type {TimingFunction} from '@canvas-commons/core';

export function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number): TimingFunction {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;
  const x = (t: number) => ((ax * t + bx) * t + cx) * t;
  const y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (value: number, from = 0, to = 1) => {
    let t = value;
    for (let i = 0; i < 8; i++) {
      const d = dx(t);
      const err = x(t) - value;
      if (Math.abs(err) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    t = Math.min(1, Math.max(0, t));
    return from + (to - from) * y(t);
  };
}

export const OUT = cubicBezier(0.16, 1, 0.3, 1);
export const IN_OUT = cubicBezier(0.65, 0, 0.35, 1);
