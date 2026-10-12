// API: references/assets.md. Key times must strictly increase.

export type V3 = [number, number, number];

export interface CamKey {
  t: number;
  pos?: V3;
  tgt?: V3;
  roll?: number;
  fov?: number;
}

export interface CamState {
  pos: V3;
  tgt: V3;
  roll: number;
  fov: number | undefined;
}

export interface Track {
  (x: number): number;
  slope(x: number): number;
}

export interface PchipOptions {
  ends?: 'secant' | 'zero';
}

const constant = (v: number): Track => Object.assign((): number => v, {slope: (): number => 0});

export function pchip(points: ReadonlyArray<readonly [number, number]>, opts: PchipOptions = {}): Track {
  const n = points.length;
  if (n === 0) throw new Error('pchip: needs at least one point');
  const x = points.map(p => p[0]);
  const y = points.map(p => p[1]);
  for (let i = 1; i < n; i++) {
    if (!(x[i] > x[i - 1])) throw new Error(`pchip: key times must strictly increase (at index ${i})`);
  }
  if (n === 1) return constant(y[0]);

  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h[i] = x[i + 1] - x[i];
    d[i] = (y[i + 1] - y[i]) / h[i];
  }
  const m = new Array<number>(n).fill(0);
  if (opts.ends !== 'zero') {
    m[0] = d[0];
    m[n - 1] = d[n - 2];
  }
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) continue; // extremum or flat run: slope 0 keeps it monotone
    const w1 = 2 * h[i] + h[i - 1];
    const w2 = h[i] + 2 * h[i - 1];
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }

  const segment = (v: number): number => {
    let lo = 0;
    let hi = n - 2;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (x[mid] <= v) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };

  const f = ((v: number): number => {
    if (v <= x[0]) return y[0];
    if (v >= x[n - 1]) return y[n - 1];
    const i = segment(v);
    const s = (v - x[i]) / h[i];
    const s2 = s * s;
    const s3 = s2 * s;
    return (
      (2 * s3 - 3 * s2 + 1) * y[i] +
      (s3 - 2 * s2 + s) * h[i] * m[i] +
      (-2 * s3 + 3 * s2) * y[i + 1] +
      (s3 - s2) * h[i] * m[i + 1]
    );
  }) as Track;

  f.slope = (v: number): number => {
    if (v < x[0] || v > x[n - 1]) return 0;
    const i = Math.min(segment(v), n - 2);
    const s = (v - x[i]) / h[i];
    const s2 = s * s;
    return (
      ((6 * s2 - 6 * s) * y[i] +
        (3 * s2 - 4 * s + 1) * h[i] * m[i] +
        (-6 * s2 + 6 * s) * y[i + 1] +
        (3 * s2 - 2 * s) * h[i] * m[i + 1]) /
      h[i]
    );
  };
  return f;
}

export interface CameraPathDefaults {
  pos?: V3;
  tgt?: V3;
  roll?: number;
  fov?: number;
}

export interface CameraPath {
  at(t: number): CamState;
  velocity(t: number): V3;
  speed(t: number): number;
  readonly start: number;
  readonly end: number;
}

export function cameraPath(keys: readonly CamKey[], defaults: CameraPathDefaults = {}, opts: PchipOptions = {}): CameraPath {
  if (keys.length === 0) throw new Error('cameraPath: needs at least one key');
  const track = (pick: (k: CamKey) => number | undefined, fallback: number | undefined): Track | undefined => {
    const pts: Array<[number, number]> = [];
    for (const k of keys) {
      const v = pick(k);
      if (v !== undefined) pts.push([k.t, v]);
    }
    if (pts.length) return pchip(pts, opts);
    return fallback === undefined ? undefined : constant(fallback);
  };
  const dp = defaults.pos ?? [0, 0, 0];
  const dt = defaults.tgt ?? [0, 0, -1];
  const pos = [0, 1, 2].map(i => track(k => k.pos?.[i], dp[i]) as Track);
  const tgt = [0, 1, 2].map(i => track(k => k.tgt?.[i], dt[i]) as Track);
  const roll = track(k => k.roll, defaults.roll ?? 0) as Track;
  const fov = track(k => k.fov, defaults.fov);

  const velocity = (t: number): V3 => [pos[0].slope(t), pos[1].slope(t), pos[2].slope(t)];
  return {
    at: t => ({
      pos: [pos[0](t), pos[1](t), pos[2](t)],
      tgt: [tgt[0](t), tgt[1](t), tgt[2](t)],
      roll: roll(t),
      fov: fov ? fov(t) : undefined,
    }),
    velocity,
    speed: t => Math.hypot(...velocity(t)),
    start: keys[0].t,
    end: keys[keys.length - 1].t,
  };
}

export interface CameraLike {
  position: {set(x: number, y: number, z: number): unknown};
  lookAt(x: number, y: number, z: number): void;
  rotateZ(angle: number): unknown;
  updateMatrixWorld(force?: boolean): void;
  fov?: number;
  updateProjectionMatrix?(): void;
}

export function applyCamera(camera: CameraLike, s: CamState): void {
  camera.position.set(s.pos[0], s.pos[1], s.pos[2]);
  camera.lookAt(s.tgt[0], s.tgt[1], s.tgt[2]);
  if (s.roll) camera.rotateZ(s.roll); // after lookAt, which overwrites rotation
  // Compared with the camera's current fov, never the last frame's, so skipping is seek-safe.
  if (s.fov !== undefined && camera.fov !== s.fov && camera.updateProjectionMatrix) {
    camera.fov = s.fov;
    camera.updateProjectionMatrix();
  }
  camera.updateMatrixWorld();
}

export interface StopScan {
  from?: number;
  to?: number;
  minSpeed: number;
  hz?: number;
}

export interface Stop {
  from: number;
  to: number;
  speed: number;
}

export function findStops(path: CameraPath, scan: StopScan): Stop[] {
  const from = scan.from ?? path.start;
  const to = scan.to ?? path.end;
  const step = 1 / (scan.hz ?? 240);
  const out: Stop[] = [];
  let open: Stop | null = null;
  for (let i = 0, t = from; t <= to + 1e-9; i++, t = from + i * step) {
    const v = path.speed(Math.min(t, to));
    if (v < scan.minSpeed) {
      if (open) {
        open.to = t;
        open.speed = Math.min(open.speed, v);
      } else {
        open = {from: t, to: t, speed: v};
        out.push(open);
      }
    } else {
      open = null;
    }
  }
  return out;
}

export interface SpeedOptions {
  from?: number;
  to?: number;
  floor?: number;
  curve?: number;
  hz?: number;
}

export function normalisedSpeed(path: CameraPath, o: SpeedOptions = {}): (t: number) => number {
  const from = o.from ?? path.start;
  const to = o.to ?? path.end;
  const step = 1 / (o.hz ?? 240);
  const floor = o.floor ?? 0;
  const curve = o.curve ?? 1;
  let vmax = 0;
  for (let t = from; t <= to; t += step) vmax = Math.max(vmax, path.speed(t));
  const span = vmax - floor;
  if (span <= 1e-9) return () => 0;
  return t => {
    const u = (path.speed(t) - floor) / span;
    return u <= 0 ? 0 : Math.pow(Math.min(1, u), curve);
  };
}

export interface Leg {
  fly: number;
  drift: number;
}

export function sectionTimes(start: number, legs: readonly Leg[]): Array<{arrive: number; leave: number}> {
  let t = start;
  return legs.map(l => {
    const arrive = t + l.fly;
    const leave = arrive + l.drift;
    t = leave;
    return {arrive, leave};
  });
}
