---
name: tunnel
description: A sequence of items (years, steps, words) spaced along the flight axis on a tightening spiral, visible only in a short window ahead of the camera, flown through with a barrel roll.
tags: [flight, sequence, depth]
---

# Windowed tunnel

**Use when:** a run of 5–12 items (a timeline, a list, a countdown) should be flown through one after another, each readable for a moment, without the far ones cluttering the frame.

## How it works

- **Spacing along −z.** Items sit at regular depth intervals down the flight axis, with the last item further out as the landing.
- **Spiral offsets.** Each item is offset from the axis on an ellipse at an advancing angle, with the radius shrinking toward the end. The camera threads between them, and the items converge on the final one.
- **Window.** Each item is visible only within a short distance ahead of the camera, fading in as it enters the window. The viewer sees one or two items at a time, which reads as passing through a sequence rather than looking at a list.
- **Near dissolve** removes each item as the camera passes it (see [depth-dissolve.md](depth-dissolve.md)).
- **Barrel roll.** The camera's roll peaks mid-flight and returns to 0 on arrival. Roll is keyed on its own, between the position keys.
- **Landing.** The last item is bigger, in the accent colour, and always visible, so it's there to arrive at. The camera arrives and keeps drifting slowly past it.

## Recipe

```ts
import {windowFade} from './depth';
const N = ITEMS.length, last = N - 1;
const endZ = -22.4, landZ = endZ + 7.6;
const z = (k: number) => (k === last ? endZ : -4 + (k / (last - 1)) * (landZ + 1.6 + 4));
const spiral = (k: number, R = 1.5) => {
  const f = k === last ? 0 : 1 - (0.45 * k) / (last - 1);   // tightens toward the end
  const ang = k * 1.15 + 0.6;
  return [R * f * Math.cos(ang), 0.6 * R * f * Math.sin(ang)];   // flattened ellipse
};
ITEMS.forEach((text, k) => {
  const {mesh} = makeLabelPlane(text, k === last ? 2.1 : 1.3, {ink: k === last ? ACCENT : INK});
  const [x, y] = spiral(k);
  mesh.position.set(x, y, z(k));
  mesh.rotation.z = k === last ? 0 : (k % 2 ? -1 : 1) * 0.09;
  // visibility: windowed, except the landing item
  register(mesh, d => state.tunnelOn * (k === last ? 1 : windowFade(d, WINDOW, 2.5)));
});
// Camera keys: enter the axis, roll mid-flight, arrive short of the last item, drift.
//   {t: a,           pos: [0.8, -0.15, 8], tgt: [0.1, 0, 0], roll: 0}
//   {t: a + fly / 2, roll: -0.35}
//   {t: a + fly,     pos: [0, 0, landZ],       tgt: [0, 0, endZ],       roll: 0}
//   {t: a + fly + 0.5, pos: [0, 0, landZ - 0.5], tgt: [0, 0, endZ - 0.6]}
```

Note that z(k) runs from −4 toward the landing, so the first item sits nearest the camera.

## Values

| Parameter | Value |
|---|---|
| Items | 5–12 |
| Flight time through the tunnel | 1.5–2 s (≈ 0.2 s per item) |
| Window ahead of the camera | ≈ 7 units, soft edge 2.5 |
| Spiral radius | 1.5, vertical squash 0.6, tightening to 55 % |
| Angle step | ≈ 1.15 rad per item |
| Roll peak | 0.3–0.35 rad, at mid-flight |
| Drift after landing | 0.5 units over 0.5 s |

## Particles around the axis

A dust or streak field reads as speed. Place particles in a **hollow tube** around the flight axis (inner radius ≈ 2.5, outer ≈ 9), so nothing crosses the centre of the lens. Stretch each particle's tail along the camera's travel since `t − shutter`. See [speed-driven-fx.md](speed-driven-fx.md).

## Pitfalls

- **No window.** All the items are visible at once, which reads as a cluttered list in perspective.
- **Items on the axis.** The camera hits them face-on, and each fills the frame and blinds the shot. Offset them, and let the near fade handle passes.
- **Roll without return.** The landing is tilted and harder to read. Roll is a flight gesture, so keep it at 0 when arriving.

## See also

- [flight-paths.md](flight-paths.md), [depth-dissolve.md](depth-dissolve.md)
