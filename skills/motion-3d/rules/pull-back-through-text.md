---
name: pull-back-through-text
description: Reveal a headline by pulling the camera back through it, while the 3D content in front shrinks away. Covers the real 3D-plane version, the 2D-overlay version, and the same-frame hand-off.
tags: [transition, camera, typography, reveal]
---

# Pull back through the text

**Use when:** moving from a 3D sequence (a punched stack, a flight) to the next line of copy, without a cut or a crossfade. The camera's recession is the transition.

## How it works

The camera dollies straight back. The next headline is a real plane **parked behind the camera's start**, so at first it's outside the frustum and invisible. As the camera passes the plane's depth, the headline enters from the near side, huge, and shrinks toward its readable size as the dolly settles. Meanwhile the content in front shrinks, straightens and fades late. One continuous recession, and no opacity trick on the headline: the frustum reveals it.

## Recipe (3D plane, preferred)

```ts
import {pxToWorld} from './depth';
// Camera dollies from openZ to allZ (allZ > openZ, looking down -z).
const pass = 0.36;                                     // where along the dolly the camera crosses the plane
const zPlane = openZ + pass * (allZ - openZ);
const settle = allZ - zPlane;                          // camera-to-plane distance at the end
const h = pxToWorld(TARGET_INK_PX, settle, FOV, 1080); // plane height that lands at the 2D size
const {mesh} = makeLabelPlane('next line', h, {box: 'ink', ink: INK});
mesh.position.set(0, lookY, zPlane);                   // parked at the camera's look height
mesh.renderOrder = 100;                                // over the receding content once in front
```

Canvas Commons timeline. Every channel shares one duration and one curve.

```ts
yield* all(
  camZ(allZ, DUR, RAMP),                                      // pure Z dolly: no vertical move
  stackScale(0.12, DUR, RAMP),                                // what was in front shrinks the whole way
  turnY(0, DUR, RAMP), turnX(0, DUR, RAMP),                   // and straightens
  chain(waitFor(DUR * 0.6), stackFade(0, DUR * 0.4, OUT)),    // fades only once small
);
// Same frame: hide the 3D plane (apply() reads planeOn) and show the identical 2D text.
planeOn(0);
headline2D().opacity(1);
```

If `pass` is a live slider, bake the geometry once at a reference pass point, and scale the mesh by `settle / settleRef` every frame. That way the landing size never changes.

**Keep moving after the dolly (hype pieces).** RAMP lands at zero speed, and a camera that parks there breaks the never-rest rule. Use a constant creep summed under the eased dolly from its first frame, as a pure term in apply(): `camera.position.z = camZ() + CREEP * Math.max(0, t - tDollyStart)`. Run it in the dolly's direction at roughly 2–5 % of the camera distance per second, and size the plane at the settle distance including the creep's offset. Don't start it at the settle frame. The camera then kicks into motion just as the shot lands (measured: 0.03 → 0.24 units/s within 10 ms). Started with the dolly, the speed glides smoothly through the settle, and the onset hides under the start of the move. A creep running from the piece's first frame has no onset at all. Product demos may hold instead.

## Recipe (2D overlay version)

Use this when the headline must stay a 2D node. Park it at its final position with scale ≈ 3–5 and opacity 0. Over the same dolly, tween its scale to 1 with the same duration and curve, and fade its opacity in from 15 % to 45 % of the move with OUT. Because the flat headline and the 3D content shrink on the same curve, the 2D layer reads as part of the recession.

## Values

| Parameter | Range |
|---|---|
| Dolly duration | 0.8–1.1 s, RAMP |
| Pass point | 0.3–0.45 of the dolly |
| Front content shrink | to 0.1–0.15 |
| Front content fade | starts at 60 % of the move, OUT |
| 2D-overlay start scale | 3–5 |

## Pitfalls

- Observed failure: the camera trucked upward during the pull-back to re-centre. The headline drifted in from the top, and the vertical move reversed direction mid-shot. Keep the dolly a pure Z move, and park the plane at the camera's current look height.
- **Near-plane clipping.** The plane passes within centimetres of the lens. Use a small near plane (0.05) and sticker layering, so it isn't cut or sorted away.
- **3D-plane variant: fading the headline in** defeats the effect. The frustum does the reveal, so the plane's opacity stays 1. (The 2D-overlay variant has no frustum to hide it, so it fades in on purpose.)
- **Hand-off mismatch.** If the 2D text's ink size or y differs from the settled plane, the swap pops. Compute the plane size with `pxToWorld` at the settle distance, measure the 2D ink box, and swap in the same frame.

## See also

- [punch-through-stack.md](punch-through-stack.md), [playful-tilt.md](playful-tilt.md)
- [compositing-3d-and-2d.md](compositing-3d-and-2d.md)
- [frame-by-fill.md](frame-by-fill.md)
