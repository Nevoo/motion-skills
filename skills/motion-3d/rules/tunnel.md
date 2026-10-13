---
name: tunnel
description: A sequence of items (years, steps, words) spaced along the flight axis on a tightening spiral, visible only in a short window ahead of the camera, flown through with a barrel roll.
tags: [flight, sequence, depth]
---

# Windowed tunnel

**Use when:** a run of 5–12 items (a timeline, a list, a countdown) should be flown through one after another, each readable for a moment, without the far ones cluttering the frame.

**Optional look, not a default.** The tunnel is a set piece, like [drum-ratchet.md](drum-ratchet.md), [door-split.md](door-split.md) and [path-through-depth.md](path-through-depth.md). A piece uses at most two, each chosen because the subject calls for it: here, a sequence the viewer should travel through. A flight with no set piece is complete.

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
// Camera (legPath): enter the axis, one leg with a barrel roll, land short of the last item, drift on.
//   landing {t: a,       pos: [0.8, -0.15, 8],  tgt: [0.1, 0, 0],   drift: [0, 0, -1]}
//   leg     {dur: fly,   curve: IN_OUT, roll: -0.35}
//   landing {t: a + fly, pos: [0, 0, landZ],    tgt: [0, 0, endZ],  drift: [0, 0, -1]}
```

Note that z(k) runs from −4 toward the landing, so the first item sits nearest the camera. The tunnel leg uses IN_OUT: RAMP covers the middle half of its distance in 11 % of the time, so the middle items would whip past unread. On the calm spline, key the roll alone at mid-flight and add a drift key 0.5 units past the landing ([flight-paths.md](flight-paths.md)).

## Values

| Parameter | Value |
|---|---|
| Items | 5–12 |
| Flight time through the tunnel | 1.5–2 s (≈ 0.2 s per item). The items are read during the leg, so it can't shrink to a whip. In a kinetic piece it is the one long move, replacing the ≈ 1.15 s reveal, with 5–8 items |
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
