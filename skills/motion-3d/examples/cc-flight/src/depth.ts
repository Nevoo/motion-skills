// API: references/assets.md. FOV arguments are vertical, in degrees.

export const DEG = Math.PI / 180;

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export const smooth01 = (x: number): number => smoothstep(0, 1, x);

export const halfTan = (fovDeg: number): number => Math.tan((fovDeg * DEG) / 2);

export function distFor(height: number, fill: number, fovDeg: number): number {
  return height / fill / 2 / halfTan(fovDeg);
}

export function distForW(width: number, fill: number, fovDeg: number, aspect: number): number {
  return width / fill / 2 / (halfTan(fovDeg) * aspect);
}

export function distToFit(width: number, height: number, fill: number, fovDeg: number, aspect: number): number {
  return Math.max(distFor(height, fill, fovDeg), distForW(width, fill, fovDeg, aspect));
}

export function pxDistance(viewH: number, fovDeg: number): number {
  return viewH / 2 / halfTan(fovDeg);
}

export function pxToWorld(px: number, dist: number, fovDeg: number, viewH: number): number {
  return (px * 2 * dist * halfTan(fovDeg)) / viewH;
}

export function worldToPx(size: number, dist: number, fovDeg: number, viewH: number): number {
  return (size * viewH) / (2 * dist * halfTan(fovDeg));
}

// Camera on +z looking toward -z; infinite at the lens.
export function apparentScale(camZ: number, z: number): number {
  return camZ / (camZ - z);
}

export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

// camForward must be unit length (three.js: camera.getWorldDirection(v)).
export function viewDepth(point: Vec3Like, camPos: Vec3Like, camForward: Vec3Like): number {
  return (
    (point.x - camPos.x) * camForward.x +
    (point.y - camPos.y) * camForward.y +
    (point.z - camPos.z) * camForward.z
  );
}

export interface DepthFadeOptions {
  nearStart: number;
  nearEnd: number;
  farStart?: number;
  farEnd?: number;
}

export function depthFade(depth: number, f: DepthFadeOptions): number {
  const near = smoothstep(f.nearStart, f.nearEnd, depth);
  const far =
    f.farStart === undefined || f.farEnd === undefined ? 1 : 1 - smoothstep(f.farStart, f.farEnd, depth);
  return near * far;
}

export function windowFade(depth: number, ahead: number, soft: number): number {
  return smooth01((ahead - depth) / soft);
}
