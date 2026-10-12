---
name: synced-events-from-curve
description: When something must fire as an eased motion passes a point, compute the time from the curve (or key it off the swept value), never from linear time; includes the inversion math.
tags: [easing, timing, sync, math]
---

# Synced events from the curve

**Use when:** "the card appears as the dot passes it", "the counter peaks with the burst", "the label pops as the camera crosses the plane".

## How it works

An eased tween does not cover its range at a constant rate. With IN_OUT, the ends are slow and the middle is fast, so the time at which a value is reached is not `value × duration`. Naive timing fires early before the midpoint and late after it.

IN_OUT over 3.5s, measured with `timeAt` from `assets/curves.ts`:

| eased value | true time | naive time | error |
|---|---|---|---|
| 0.476 | 1.72s | 1.67s | 0.05s early |
| 0.657 | 1.95s | 2.30s | 0.35s late |
| 0.838 | 2.30s | 2.93s | 0.63s late |

A 0.63s error is a whole beat in a reel.

## The inversion math

A cubic-bezier is two polynomials in a parameter s from 0 to 1:

```
x(s) = 3(1-s)²s·x1 + 3(1-s)s²·x2 + s³      time fraction
y(s) = 3(1-s)²s·y1 + 3(1-s)s²·y2 + s³      eased value
```

For IN_OUT (0.65, 0, 0.35, 1) these reduce to `y(s) = 3s² − 2s³` and `x(s) = 1.95s − 2.85s² + 1.9s³`.

To find when the eased value reaches v:

1. Solve y(s) = v for s. Bisection is enough. If the curve overshoots (BOUNCE), take the first crossing.
2. Evaluate x(s). That is the fraction of the duration.
3. Multiply by the duration and add the tween's start.

Worked: v = 0.476 gives s ≈ 0.484, x(s) ≈ 0.492, so 0.492 × 3.5s = 1.72s.

`timeAt(ease, v)` in `assets/curves.ts` does the same for any Ease by bisecting on the eased output directly, so it also works for custom eases such as the nudge.

## Recipe

```ts
import {IN_OUT, OUT, timeAt, seg, clamp01} from './curves';

const START = 4.0, DUR = 3.5;
// Card k sits at cardY[k] along a line drawn from LINE_FROM over LINE_LEN.
const fireAt = cardY.map(y => START + timeAt(IN_OUT, (y - LINE_FROM) / LINE_LEN) * DUR);
```

**Better, where the engine allows: key off the value, not the time.** If the scene is evaluated as a function of time each frame (reactive bindings, a `render(t)` function), skip the inversion. Derive each reaction from the leader's swept value. It stays correct when the curve or duration changes later.

```ts
const drawn = (t: number) => IN_OUT(seg(t, START, DUR));               // leader progress 0..1
const cardIn = (t: number, k: number) => OUT(clamp01((drawn(t) - cardAt[k]) / 0.12));
```

Use `timeAt` when the engine needs a timeline position (a GSAP position parameter, a delay inside a Canvas Commons block). Use value keys when it doesn't.

**Counters bind to the same progress** as the motion they measure, so the number and the burst peak together. A count-up run separately afterwards reads as two events.

## Pitfalls

- **`value × duration`.** Early before the midpoint, late after it, by up to a beat.
- **Overshooting curves.** BOUNCE first reaches 1.0 at t = 0.376 although the tween ends at 1; decide whether the event belongs to the first crossing or the end.
- **Re-timing later.** Time-keyed events break when a duration changes; value-keyed ones don't. Recompute with `timeAt` after every timing change.

## See also

- [named-curves](named-curves.md)
- [one-moment-one-block](one-moment-one-block.md): reactions as offsets inside a moment
- [camera-locked-to-leader](camera-locked-to-leader.md): binding attachments to the leader's progress
