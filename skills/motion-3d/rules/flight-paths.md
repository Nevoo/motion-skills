---
name: flight-paths
description: One continuous camera flight through a 3D world, as a monotone keyed spline. Sections go arrive → slow drift → next flight, and no key is a full stop.
tags: [camera, flight, continuity]
---

# Continuous flight paths

**Use when:** a hype reel, intro or title sequence should feel like one move through one space, not a slideshow of stops.

## How it works

A sequence that goes stop, show, whip, stop still reads as a slideshow, even with good whips. Viewers stop feeling a continuous space. The fix is a camera that never rests. Content pops in along the path, and the camera flies through planes instead of cutting to them.

Key the camera pose at a few times, and interpolate each channel with a **monotone cubic (PCHIP)**:

- **Velocity is continuous through every key,** so there are no kinks and no sudden starts.
- **It never overshoots a key's value,** so the camera can't swing past a word and come back. Catmull-Rom and natural splines do that.
- A key whose value is a local extreme gets zero slope, so **that channel** pauses there. The camera only stops if **every** channel pauses at the same key.

## Recipe

```ts
import {applyCamera, cameraPath, findStops, sectionTimes} from './camera-path';

const [A, B] = sectionTimes(INTRO, [{fly: 1.75, drift: 0.5}, {fly: 0.8, drift: 0.55}]);
const path = cameraPath([
  {t: 0,              pos: [-3.4, 0.5, 8.8], tgt: [-0.9, 0.1, 0], roll: 0, fov: 38},
  {t: INTRO,          pos: [0.8, -0.15, 8.0], tgt: [0.1, 0, 0],   roll: 0},
  {t: INTRO + 0.875,  roll: -0.35},                       // roll peaks mid-flight, keyed alone
  {t: A.arrive,       pos: [0, 0, -14.8],  tgt: [0, 0, -22.4], roll: 0},  // arrive
  {t: A.leave,        pos: [0, 0, -15.3],  tgt: [0, 0, -23.0]},           // drift 0.5 units: z keeps falling
  {t: B.arrive,       pos: [0.9, 0.3, -24.5], tgt: [0.6, 0, -34]},
  {t: B.leave,        pos: [1.15, 0.35, -25.0], tgt: [0.75, 0, -34.4]},   // drift 0.56 units: x, y, z all continue
]);
// Verify, don't eyeball: the camera must never rest.
console.assert(findStops(path, {minSpeed: 0.05}).length === 0);
// In apply(): applyCamera(camera, path.at(t));
```

**Section rhythm.** Each section has two keys. *Arrive* is where the section reads. *Leave* is a short drift (a few tenths of a unit) in the same direction as the flight. PCHIP blends the fast incoming slope with the slow drift slope, so the camera decelerates into the section and keeps gliding instead of parking. Then the next flight takes over.

**No full stop.** At every key, make sure at least one position channel keeps the same sign of motion on both sides. Here z falls through every arrive and drift key, so the camera can't park even where x holds still (x is flat across section A). `findStops` reports any interval below a speed threshold.

**Ending.** The last key still moves slightly (a slow push-in or drift). A dead stop on the final frame reads as a freeze.

## Alternative: creep + pushes

For a straight run through words on the z axis, sum two layers instead of keying poses:

- a constant **creep** summed under the eased moves from the first frame (≈1.2 units/s forward);
- a RAMP **push** per word, tweened as an offset on top.

Calibrate each push's end level so the next word sits at its reading distance (`distForW`) when the next push starts. The creep guarantees motion during reads, and the pushes give the whips. Ease the creep down to ~0.4 units/s over the final title, rather than stopping it.

## Values

| Part | Range |
|---|---|
| Flight leg | 0.8–1.75 s |
| Drift after arriving | 0.3–0.55 s, 0.3–0.6 units |
| Speed during a drift | about 3–12 % of the leg's peak speed |
| Roll peak (barrel feel) | 0.2–0.35 rad, mid-leg, back to ~0 on arrival |
| Whole flight piece | 7–12 s |

## Pitfalls

- **Repeated values on consecutive keys** create a flat hold in that channel. Two such holds aligned make a full stop.
- **Linear interpolation** between keys has velocity jumps at every key. They read as bumps.
- **Overshoot curves (BOUNCE, spring, back) on a camera** make the frame lurch past each mark and recoil. Monotone splines can't overshoot by construction. Tweened camera legs use OUT, IN_OUT, RAMP, RAMP_LONG or GLIDE.
- **Keys too close in time with large position deltas** create violent acceleration. Plot `path.speed(t)` (or sample it into a contact sheet of numbers) and spread the keys of any leg whose peak towers over its neighbours.
- **Product demos are different.** Discrete stages in a column with RAMP glides (whip, settle, synced scale dip) remain right there. Flights are for hype and identity pieces.

## See also

- [vary-the-leg.md](vary-the-leg.md), [landing-poses-baked.md](landing-poses-baked.md)
- [depth-dissolve.md](depth-dissolve.md): what happens to planes the camera passes
- [speed-driven-fx.md](speed-driven-fx.md): FX keyed to the path's speed

*Idea adapted from HyperFrames (Apache-2.0).*
