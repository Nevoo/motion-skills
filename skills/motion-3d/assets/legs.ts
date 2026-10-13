// API: references/assets.md. Leg k ends on landing k + 1; leg curves stay in 0..1 and leave and settle at zero slope.

export type V3 = [number, number, number];
export type Ease = (t: number, from?: number, to?: number) => number;

export interface CamState {
  pos: V3;
  tgt: V3;
  roll: number;
  fov: number | undefined;
}

export interface Landing {
  t: number;
  pos: V3;
  tgt: V3;
  drift?: V3;
  roll?: number;
  fov?: number;
}

export interface LegSpec {
  dur: number;
  curve: Ease;
  arc?: boolean;
  roll?: number;
  fov?: number;
}

export interface LegPathOptions {
  drift?: V3;
  fov?: number;
  end?: number;
}

export interface LegSpan {
  start: number;
  end: number;
  arc: boolean;
}

export interface LegPath {
  at(t: number): CamState;
  velocity(t: number): V3;
  speed(t: number): number;
  readonly start: number;
  readonly end: number;
  readonly landings: readonly number[];
  readonly legs: readonly LegSpan[];
  progress(leg: number, t: number): number;
  legAt(t: number): number;
}

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const mix = (a: V3, b: V3, k: number): V3 => add(a, scale(sub(b, a), k));
const length = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export function driftToward(from: V3, to: V3, speed: number): V3 {
  const d = sub(to, from);
  const l = length(d);
  return l > 1e-12 ? scale(d, speed / l) : [0, 0, 0];
}

const STEP = 5e-4;
const rateOf = (curve: Ease, u: number): number => {
  const a = Math.max(0, u - STEP);
  const b = Math.min(1, u + STEP);
  return (curve(b) - curve(a)) / (b - a);
};

const SLOPE_TOL = 0.05;
const FIRST_FRAME_SLOPE = 1; // GLIDE leaves at 0.4, OUT at 6.25
const startSlope = (curve: Ease): number => (curve(1e-4) - curve(0)) / 1e-4;
const settles = (curve: Ease): boolean => curve(1) - curve(1 - 1e-4) < SLOPE_TOL * 1e-4;
const overshoots = (curve: Ease): boolean => {
  for (let i = 0; i <= 1000; i++) {
    const v = curve(i / 1000);
    if (v < -1e-6 || v > 1 + 1e-6) return true;
  }
  return false;
};

const spherical = (o: V3) => {
  const r = length(o);
  return {az: Math.atan2(o[0], o[2]), el: r > 1e-12 ? Math.asin(Math.max(-1, Math.min(1, o[1] / r))) : 0, r};
};

export function legPath(landings: readonly Landing[], legs: readonly LegSpec[], opts: LegPathOptions = {}): LegPath {
  const n = landings.length;
  if (n === 0) throw new Error('legPath: needs at least one landing');
  if (legs.length !== n - 1) throw new Error(`legPath: ${n} landings need ${n - 1} legs, got ${legs.length}`);
  const L = landings.map(l => ({
    t: l.t,
    pos: l.pos,
    tgt: l.tgt,
    v: l.drift ?? opts.drift ?? ([0, 0, 0] as V3),
    roll: l.roll ?? 0,
    fov: l.fov ?? opts.fov,
  }));
  const hasFov = L.some(l => l.fov !== undefined) || legs.some(g => g.fov);
  if (hasFov && L.some(l => l.fov === undefined)) throw new Error('legPath: a fov is set somewhere, so set opts.fov as the base');

  const spans = legs.map((g, k) => {
    const end = L[k + 1].t;
    const start = end - g.dur;
    if (!(g.dur > 0)) throw new Error(`legPath: leg ${k} needs dur > 0`);
    if (start < L[k].t - 1e-9) throw new Error(`legPath: leg ${k} starts at ${start}, before landing ${k} at ${L[k].t}`);
    if (overshoots(g.curve)) throw new Error(`legPath: leg ${k} overshoots its landing; its curve must stay within 0..1`);
    const fromFirstFrame = k === 0 && start <= L[0].t + 1e-9;
    if (startSlope(g.curve) > (fromFirstFrame ? FIRST_FRAME_SLOPE : SLOPE_TOL)) {
      throw new Error(`legPath: leg ${k} jumps in speed as it leaves; use RAMP, RAMP_LONG or IN_OUT (GLIDE only on leg 0 from the first frame)`);
    }
    if (!settles(g.curve)) throw new Error(`legPath: leg ${k} arrives with speed left over; its curve must settle`);
    const s0 = spherical(sub(L[k].pos, L[k].tgt));
    const s1 = spherical(sub(L[k + 1].pos, L[k + 1].tgt));
    let daz = s1.az - s0.az;
    daz -= 2 * Math.PI * Math.round(daz / (2 * Math.PI)); // shortest way round
    return {start, end, dur: g.dur, curve: g.curve, arc: g.arc ?? false, roll: g.roll ?? 0, fov: g.fov ?? 0, s0, daz, del: s1.el - s0.el, dr: s1.r - s0.r};
  });

  const end = opts.end ?? L[n - 1].t;
  if (end < L[n - 1].t) throw new Error('legPath: opts.end is before the last landing');

  const legAt = (t: number): number => {
    for (let k = 0; k < spans.length; k++) if (t >= spans[k].start && t < spans[k].end) return k;
    return -1;
  };
  const holdAt = (t: number): number => {
    let k = 0;
    while (k + 1 < n && L[k + 1].t <= t) k++;
    return k;
  };
  const hold = (k: number, t: number) => {
    const d = scale(L[k].v, t - L[k].t);
    return {pos: add(L[k].pos, d), tgt: add(L[k].tgt, d)};
  };

  const evaluate = (t: number) => {
    const k = legAt(t);
    if (k < 0) {
      const i = holdAt(t);
      const h = hold(i, t);
      return {pos: h.pos, tgt: h.tgt, roll: L[i].roll, fov: L[i].fov, vel: [...L[i].v] as V3};
    }
    const g = spans[k];
    const a = L[k];
    const b = L[k + 1];
    const u = clamp01((t - g.start) / g.dur);
    const e = g.curve(u);
    const de = rateOf(g.curve, u) / g.dur;
    const ha = hold(k, t);
    const hb = hold(k + 1, t);
    const vDrift = mix(a.v, b.v, e);
    const tgt = mix(ha.tgt, hb.tgt, e);
    const vTgt = add(vDrift, scale(sub(hb.tgt, ha.tgt), de));
    let pos: V3;
    let vel: V3;
    if (g.arc) {
      const az = g.s0.az + e * g.daz;
      const el = g.s0.el + e * g.del;
      const r = g.s0.r + e * g.dr;
      const [ca, sa, ce, se] = [Math.cos(az), Math.sin(az), Math.cos(el), Math.sin(el)];
      const dir: V3 = [ce * sa, se, ce * ca];
      const dDir: V3 = [g.daz * ce * ca - g.del * se * sa, g.del * ce, -g.daz * ce * sa - g.del * se * ca];
      pos = add(tgt, scale(dir, r));
      vel = add(vTgt, scale(add(scale(dir, g.dr), scale(dDir, r)), de));
    } else {
      pos = mix(ha.pos, hb.pos, e);
      vel = add(vDrift, scale(sub(hb.pos, ha.pos), de));
    }
    const bump = 4 * e * (1 - e);
    return {
      pos,
      tgt,
      roll: a.roll + (b.roll - a.roll) * e + g.roll * bump,
      fov: a.fov === undefined || b.fov === undefined ? undefined : a.fov + (b.fov - a.fov) * e + g.fov * bump,
      vel,
    };
  };

  return {
    at: t => {
      const s = evaluate(t);
      return {pos: s.pos, tgt: s.tgt, roll: s.roll, fov: s.fov};
    },
    velocity: t => evaluate(t).vel,
    speed: t => length(evaluate(t).vel),
    start: L[0].t,
    end,
    landings: L.map(l => l.t),
    legs: spans.map(g => ({start: g.start, end: g.end, arc: g.arc})),
    progress: (k, t) => spans[k].curve(clamp01((t - spans[k].start) / spans[k].dur)),
    legAt,
  };
}
