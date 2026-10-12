---
name: path-through-depth
description: A line that draws itself along a 3D curve weaving in and out of depth, with nodes that pop as the head passes. Shows a process, pipeline or journey as a real spatial route.
tags: [line, process, depth]
---

# Path drawing through depth

**Use when:** showing a sequence of steps (a pipeline, a workflow, a route) as one continuous gesture rather than a row of boxes.

## How it works

- **Curve.** A smooth curve through a few control points whose z alternates in front of and behind the label plane, so the line visibly weaves through depth as the camera drifts.
- **Tube.** A tube mesh along the curve, drawn progressively by limiting its index range. A thin, faint "ghost" tube shows the whole route underneath, so the eye knows where the line is going.
- **Nodes.** One dot plus one label per step, at arc-length positions along the curve. Each node pops (BOUNCE scale, fade) the moment the drawing head reaches it. Events are derived from the head's position, never separately timed.
- **Progress.** One value `p` (0 → 1) drives the whole thing.

## Recipe

```ts
import {BOUNCE, OUT, clamp01} from './curves';   // the motion-craft skill's assets/curves.ts

const pts = [[-3.6, -1, 0.9], [-1.8, -0.8, -0.9], [0, -1.1, 0.6], [1.8, -0.8, -0.9], [3.6, -1, 0.9]]
  .map(([x, y, z]) => new THREE.Vector3(x, y, z).add(ORIGIN));
const curve = new THREE.CatmullRomCurve3(pts);
const SEG = 240, RAD = 10;
const tubeGeo = new THREE.TubeGeometry(curve, SEG, 0.035, RAD, false);
const tube = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({color: ACCENT, transparent: true, depthTest: false}));
const ghost = new THREE.Mesh(new THREE.TubeGeometry(curve, SEG, 0.02, 6, false),
  new THREE.MeshBasicMaterial({color: FAINT, transparent: true, depthTest: false}));
ghost.renderOrder = -1;

const nodes = STEPS.map((name, i) => {
  const u = i / (STEPS.length - 1);
  const at = curve.getPointAt(u);                 // arc-length position, matches the tube's spacing
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), new THREE.MeshBasicMaterial({color: ACCENT, transparent: true, depthTest: false}));
  dot.position.copy(at);
  const label = makeLabelPlane(name, 0.26, {fontWeight: 500});
  label.mesh.position.set(at.x, at.y - 0.45, at.z);
  return {u, dot, label};
});

// In apply(): p = state.pathP (0 → 1, IN_OUT)
tubeGeo.setDrawRange(0, Math.floor(state.pathP * SEG) * RAD * 6);   // 6 indices per quad, RAD quads per ring
nodes.forEach(n => {
  const hit = clamp01((state.pathP - n.u) / 0.08 + 1);              // 0 → 1 as the head arrives
  n.dot.scale.setScalar(BOUNCE(hit));                              // 6.6 % overshoot, settles at 1
  n.dot.material.opacity = Math.min(1, hit * 2);
  n.label.material.opacity = OUT(hit);
});
```

`TubeGeometry` samples the curve at equal arc length, and so does `getPointAt`, so the head and the nodes agree.

## Values

| Parameter | Value |
|---|---|
| Draw duration | 0.8–1.2 s, IN_OUT |
| Depth weave | ±0.6–0.9 units around the label plane |
| Tube radius | ≈ 3 % of label height; ghost ≈ 60 % of that |
| Node pop window | 8 % of the path before the node |
| Dot overshoot | BOUNCE, 6.6 % (the only overshoot allowed, on small landing scales) |
| Segments | 200–300 along, 8–12 around |

## Pitfalls

- **Linear progress.** The line crawls at constant speed, which reads as mechanical. IN_OUT gives the gesture a start and a finish.
- **Timing node pops separately.** They drift off the head when the duration changes. Derive them from `p`.
- **Fat lines instead of tubes.** Screen-space lines don't foreshorten, so the depth weave reads flat. Tubes thin with distance.
- **drawRange on a non-indexed geometry** counts vertices, not indices. TubeGeometry is indexed. Check before porting the formula.

## See also

- [flight-paths.md](flight-paths.md): drift the camera while the path draws
- The `motion-craft` skill: events synced from the curve
