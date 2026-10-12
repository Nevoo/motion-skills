---
name: camera-position-and-target
description: Drive the camera as position + look-at target (+ roll, + fov), written in one fixed order. Move both together to translate, move one to swing.
tags: [camera, rig]
---

# Camera = position + target

**Use when:** any camera move: punches, pull-backs, trucks, flights, orbits.

## How it works

The camera state is `{pos: [x,y,z], tgt: [x,y,z], roll, fov}`. That's two points, a twist and a lens. Every move is a statement about those two points:

| Intent | Position | Target | Reads as |
|---|---|---|---|
| Slide the view (truck, pedestal, punch down a stack) | moves | moves by the same delta | clean translation, content stays frontal |
| Dolly in or out | moves along the view axis | fixed | approach / recede, no rotation |
| Swing / parallax turn | moves sideways | fixed | the camera orbits; near things sweep past far ones |
| Rack / look-over | fixed | moves | a head turn |
| Barrel roll | either | either | `roll` peaks mid-flight and returns to 0 |

Move only the position when you meant to translate, and the shot swings and skews. It's the most common accidental rotation in 3D motion graphics.

## Recipe

Write the camera in a fixed order, from one place. The order is: position, then aim, then roll, then lens.

```ts
camera.position.set(s.pos[0], s.pos[1], s.pos[2]);
camera.up.set(0, 1, 0);                 // only if something else ever changes `up`
camera.lookAt(s.tgt[0], s.tgt[1], s.tgt[2]);
camera.rotateZ(s.roll);                 // after lookAt: roll about the view axis
if (camera.fov !== s.fov) { camera.fov = s.fov; camera.updateProjectionMatrix(); }
camera.updateMatrixWorld();             // fades that read the camera pose need it now
```

`applyCamera(camera, state)` in [../assets/camera-path.ts](../assets/camera-path.ts) does exactly this.

Why this order: `lookAt` overwrites the rotation from position and target, so a roll applied earlier is lost. A roll applied after it always means "twist around the line of sight", whatever the aim.

Tween the two points in step. Canvas Commons, a punch down a stack:

```ts
yield* all(camY(Y[i], 0.42, RAMP), tgtY(Y[i], 0.42, RAMP), camZ(zFor(i), 0.42, RAMP));
```

## Group turn vs camera orbit

Turning a **group** (`group.rotation.y = 0.13`) shows a stack as an object without moving the camera, so framing maths stays valid. Orbiting the **camera** turns the whole world, background included. Use the group turn for "these cards are real objects" and the camera orbit for "we're moving through a space".

## Values

| Channel | Typical range |
|---|---|
| fov | 35–50° (38–40 suits type; wider exaggerates depth during flights) |
| roll during a flight | ±0.04–0.35 rad, peaking mid-leg and back to ~0 at arrival |
| fov kick during a push | +5–8° at the middle of the push, back to base on arrival |
| near plane | 0.05–0.1 (planes the camera flies through must not clip early) |

## Pitfalls

- **Target on the camera's vertical line.** `lookAt` degenerates when the view direction is parallel to `up`. For straight-down shots, offset the target slightly, or set `up` to (0, 0, -1) for that move only.
- **fov animated but projection not updated.** Call `updateProjectionMatrix()` whenever fov changes. The Canvas Commons bridge node updates aspect every frame, but not your fov.
- **Overshoot on the camera** carries the whole set past its mark and pulls it back. The viewer feels the frame lurch instead of feeling speed. Camera curves are OUT, IN_OUT, RAMP, RAMP_LONG, GLIDE; ACCEL only as the exit side of a velocity-matched cut; never BOUNCE or spring/back on a camera. (Curve definitions: the `motion-craft` skill.)
- **Mixing a position tween with a separate lookAt tween of different length** makes the swing appear and vanish mid-move. Give both the same duration and curve unless the swing is the point.

## See also

- [frame-by-fill.md](frame-by-fill.md): where to put the position
- [flight-paths.md](flight-paths.md): keying the pose over time
- [landing-poses-baked.md](landing-poses-baked.md)

*Idea adapted from HyperFrames (Apache-2.0).*
