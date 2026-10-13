---
name: speed-ramps
description: The RAMP family (RAMP, RAMP_LONG, ACCEL, GLIDE) for linger-whip-settle moves, compared with an asymmetric wind-up, burst, long-settle "nudge" for in-frame group moves.
tags: [easing, speed-ramp, whip, reel]
---

# Speed ramps

**Use when:** a move should feel editorial rather than polite: camera whips, whole-frame morphs, a pan across a row, a group sliding to make room.

This file covers ease-curve ramps, which shape the speed of one move. An edit-style ramp that bends time for the whole frame (fast, slow-motion hang, snap) is a time remap: see [time-remap-ramps](time-remap-ramps.md). The two stack: a RAMP whip inside a remap window keeps its shape.

## How it works

A speed ramp spends its time near the ends and crosses the middle in a burst. RAMP covers the middle half of its distance in 11% of its duration and peaks at 6.7× its average speed; IN_OUT needs 20% and peaks at 2.9×. That contrast is the whip. It only reads if the rest of the piece is calmer, so RAMP is reserved for camera glides and whole-frame changes. If every tween ramps, nothing whips.

| curve | shape | reach for it when |
|---|---|---|
| RAMP | symmetric linger, whip, settle | camera moves between stages, a whole-frame morph |
| RAMP_LONG | the linger runs longer, so the whip lands later and harder | a long pan whose payoff is holding, then going |
| ACCEL | builds and leaves at full speed | the exit side of a velocity-matched cut; only when something takes the momentum |
| GLIDE | moving from the first frame, builds, settles | continuous drifts; an entry that flows into a pan without stopping |

**One tween, not two.** An entry followed by a pan as two chained tweens has a velocity seam where the first one stops. Make it one GLIDE tween over the whole distance. Events keyed off the swept value still fire correctly.

## The nudge: an asymmetric ramp

RAMP is symmetric: the first 10% and the last 10% of the distance each take 34% of the time. For an in-frame group repositioning (rows sliding up to make room, a stack shifting to reveal the next card), an asymmetric shape reads better: a short wind-up, a constant-speed burst that covers most of the distance, then a long settle at least three times the wind-up. Reveal the new content during the burst; the motion masks its arrival. The nudge is the one composite this skill sanctions next to the eight named curves, and only for group repositioning.

The burst is the one place linear motion belongs: it is bracketed by eased phases, so the viewer never sees it start or stop. Easing the burst removes the contrast that makes a nudge.

| | RAMP | nudge (defaults in the recipe) |
|---|---|---|
| first 10% of distance | 34% of the time | 20% |
| middle | middle half in 11% of the time | 65% of the distance in 18% |
| last 10% of distance | 34% of the time | 49% |
| peak speed | 6.7× at the midpoint, for an instant | 3.6×, held across the burst |
| use | whole-frame whips, camera | in-frame group repositioning |

## Recipe

RAMP and the other three need nothing beyond `assets/curves.ts`. The nudge is a custom `Ease`, so it plugs into the same hosts (a Canvas Commons timing function, a GSAP ease, or CSS through `linear()`):

```ts
import type {Ease} from './curves';

// windUp/burst: shares of the duration. dWind/dBurst: shares of the distance.
function nudge(windUp = 0.2, burst = 0.18, dWind = 0.1, dBurst = 0.65): Ease {
  const tTail = 1 - windUp - burst, dTail = 1 - dWind - dBurst;
  return (t, from = 0, to = 1) => {
    let p: number;
    if (t <= 0) p = 0;
    else if (t >= 1) p = 1;
    else if (t < windUp) p = dWind * (t / windUp) ** 3;
    else if (t < windUp + burst) p = dWind + (dBurst * (t - windUp)) / burst;
    else p = 1 - dTail * (1 - (t - windUp - burst) / tTail) ** 4;
    return from + (to - from) * p;
  };
}

// CSS has no solver for a piecewise curve, but linear() takes evenly spaced samples.
const cssLinear = (e: Ease, n = 40) =>
  `linear(${Array.from({length: n + 1}, (_, i) => e(i / n).toFixed(4)).join(', ')})`;
```

## Values

| move | curve | duration |
|---|---|---|
| camera whip between stages | RAMP | 0.7–0.9s |
| long pan along a row | RAMP_LONG | 1.5–3s |
| drift during a hold | GLIDE | the whole hold |
| group repositioning | nudge | 0.5–0.7s |
| exit half of a cut | ACCEL | 0.25–0.35s |

## Pitfalls

- **RAMP on small UI moves.** The linger reads as input lag.
- **RAMP on both the camera and the content it carries.** Two whips stack. Let the content ride the camera, unless the content is meant to ride the camera as one recession (`motion-3d`'s pull-back through text), where both share the curve on purpose.
- **ACCEL with nothing after it.** A crash stop.
- **A nudge with a short tail.** It smacks into place. Give the settle more time and keep its distance as it was.

## See also

- [named-curves](named-curves.md)
- [time-remap-ramps](time-remap-ramps.md): fast, slow-motion hang and snap across the whole frame
- [column-whip](column-whip.md): RAMP between stages with a scale dip
- [seams-and-vectors](seams-and-vectors.md): ACCEL into OUT across a cut
- [linear-reads-cheap](linear-reads-cheap.md)

*Idea adapted from HyperFrames (Apache-2.0).*
