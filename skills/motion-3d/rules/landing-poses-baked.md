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

Then the flight interpolates between poses. See [flight-paths.md](flight-paths.md).

## Recipe

```ts
// One table of poses: the single source the path, the panel and the renderer read.
export const POSES = {
  open:   {pos: [-3.4, 0.5, 8.8],  tgt: [-0.9, 0.1, 0],  roll: 0},
  tunnel: {pos: [0, 0, -14.8],     tgt: [0, 0, -22.4],   roll: 0},
  drum:   {pos: [0.9, 0.3, -24.5], tgt: [0.6, 0, -34],   roll: 0},
  final:  {pos: [-7, -2.2, -24],   tgt: [0, -5.2, -46],  roll: -0.08},
} as const;

const keys = [
  {t: 0, ...POSES.open},
  {t: T.tunnel, ...POSES.tunnel},
  // ...
];
```

Live tuning: expose each pose channel as a slider, read `POSES` inside apply() so a drag repaints the paused frame, and give the panel a visible "copy values" button. Headless renders start from a clean profile and use the baked defaults, so a pose that exists only in a browser's local storage never reaches the video.

## What "landing" means for the read

- **Frontal or near-frontal.** Type seen edge-on, smeared or in flight registers as pattern, not words. Anything the viewer must read lands with the plane facing the camera (turns straightened, roll near 0).
- **Sharp.** Speed FX are at zero because the camera is at its slowest (see [speed-driven-fx.md](speed-driven-fx.md)).
- **Long enough to read, short enough to keep pace.** These are moving reads (the camera keeps creeping), not holds: roughly 0.3–0.6 s for one or two words. Where a move fully lands, its read pause is 0.2–0.3 s, and stage-to-stage whips run 0.7–0.9 s.

## Pitfalls

- **Measuring the DOM or projecting objects every frame** (`getBoundingClientRect`, `vector.project(camera)`) to decide the camera. That couples framing to layout timing, breaks under parallel frame rendering, and can feed back on itself. Measure once at build.
- **Deriving a pose by inverting projection maths** in your head rarely matches what the eye wants. Compute a first guess with `distFor`, then look at it and adjust.
- **Pose numbers scattered across tween calls.** When the same pose appears in two places, they drift apart. Keep one table.

## See also

- [frame-by-fill.md](frame-by-fill.md)
- [vary-the-leg.md](vary-the-leg.md)
- The `canvas-commons` skill: the live panel asset and its copy/bake workflow

*Idea adapted from HyperFrames (Apache-2.0).*
