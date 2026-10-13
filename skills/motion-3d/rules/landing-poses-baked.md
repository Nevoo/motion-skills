---
name: landing-poses-baked
description: Author each camera landing pose at design time, tune it live, and bake it as constants. Never measure or project per frame to find where the camera should be.
tags: [camera, workflow, determinism]
---

# Bake the landing poses

**Use when:** setting where the camera arrives for each read: a word, a card, a title, the final frame.

## How it works

A landing pose is a design decision: what fills the frame, from which angle, with how much air. Make it once, deliberately, and store it as data. Don't derive it every frame from measurements.

Three ways to get the numbers, in order of preference:

1. **Computed from intent at build time.** For example `z = word.z + distForW(width, 0.84, FOV, ASPECT)`, using sizes measured once after fonts load. This is deterministic and survives copy edits.
2. **Tuned by a human with live sliders,** then copied out and pasted back as defaults. Use this when the pose is about feel: a slight off-axis angle, a roll, air above a title.
3. **Hand-entered** for one-off art-directed moments.

Then the flight moves between poses. In a kinetic piece they are the landings of `legPath` ([../assets/legs.ts](../assets/legs.ts)), each with its own drift, and ramped legs join them. In a calm piece they are the arrive keys of the spline. See [flight-paths.md](flight-paths.md).

## Recipe

```ts
import type {V3} from './legs';
// One table of poses: the single source the path, the panel and the renderer read.
export const POSES = {
  open:  {pos: [-3.4, 0.5, 8.8],  tgt: [-0.9, 0.1, 0],  roll: 0},
  title: {pos: [0, 0, -14.8],     tgt: [0, 0, -22.4],   roll: 0},
  list:  {pos: [0.9, 0.3, -24.5], tgt: [0.6, 0, -34],   roll: 0},
  final: {pos: [-7, -2.2, -24],   tgt: [0, -5.2, -46],  roll: -0.08},
} satisfies Record<string, {pos: V3; tgt: V3; roll: number}>;

const path = legPath([
  {t: 0, ...POSES.open, drift: DRIFT},
  {t: T.title, ...POSES.title, drift: DRIFT},
  // ...
], LEGS, {fov: FOV});
```

Live tuning: expose each pose channel as a slider, read `POSES` inside apply() so a drag repaints the paused frame, and give the panel a visible "copy values" button. Headless renders start from a clean profile and use the baked defaults, so a pose that exists only in a browser's local storage never reaches the video.

## What "landing" means for the read

- **Frontal or near-frontal.** Type seen edge-on, smeared or in flight registers as pattern, not words. Anything the viewer must read lands with the plane facing the camera (turns straightened, roll near 0).
- **Sharp.** Speed FX are at zero because the camera is at its slowest (see [speed-driven-fx.md](speed-driven-fx.md)).
- **Long enough to read, and no longer.** Reading happens while the words build. The camera visibly moves within 0.3 s of the last word landing, and a ramped leg's slow start counts toward that. So before a RAMP or RAMP_LONG leg the hold after the last word is 0–0.1 s, and a leg over ≈ 0.75 s leaves before the last word lands ([flight-paths.md](flight-paths.md)). The drift keeps the camera moving through the hold, which makes it a moving read, not a stop. A push through a word with no hold reads in 0.3–0.6 s for one or two words.
- **Resting roll and lens.** A landing's `roll` and `fov` are where the leg's bumps return to. Keep roll near 0 on anything read.

## Pitfalls

- **Measuring the DOM or projecting objects every frame** (`getBoundingClientRect`, `vector.project(camera)`) to decide the camera. That couples framing to layout timing, breaks under parallel frame rendering, and can feed back on itself. Measure once at build.
- **Deriving a pose by inverting projection maths** in your head rarely matches what the eye wants. Compute a first guess with `distFor`, then look at it and adjust.
- **Pose numbers scattered across tween calls.** When the same pose appears in two places, they drift apart. Keep one table.
- **Placeholder landing times.** Poses tuned against placeholder timing land differently once the copy's real build times are in. Set the times from the final word builds before anyone reviews a render.

## See also

- [frame-by-fill.md](frame-by-fill.md)
- [vary-the-leg.md](vary-the-leg.md)
- The `canvas-commons` skill: the live panel asset and its copy/bake workflow

*Idea adapted from HyperFrames (Apache-2.0).*
