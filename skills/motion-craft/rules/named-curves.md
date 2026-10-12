---
name: named-curves
description: The eight named cubic-bezier curves (four calm, four speed ramps), what each does, measured shape data, what each is banned from, and how to use assets/curves.ts in any engine.
tags: [easing, curves, foundations]
---

# The eight named curves

**Use when:** choosing an ease for any tween, in any engine. Every tween in a piece uses one of these eight. The one sanctioned exception is the nudge, a three-phase composite in the speed-ramp family, used only for group repositioning ([speed-ramps](speed-ramps.md)).

## How it works

Each curve is an exact cubic-bezier (x is time, y is progress), so it evaluates the same in Canvas Commons, GSAP, CSS and a hand-written render loop. Engine presets are not: `ease-in-out`, `power2.inOut` and `easeInOutCubic` are three different curves. Mixing presets is how two halves of a piece end up feeling different. A fixed vocabulary also gives the human and the agent words to argue with: "make that a RAMP" is a precise request.

| curve | points | character | use for | never for |
|---|---|---|---|---|
| `OUT` | 0.16, 1, 0.3, 1 | fast start, calm settle | anything entering or arriving: fades in, titles, icons, settles, pointer moves | camera glides between two rests |
| `IN_OUT` | 0.65, 0, 0.35, 1 | symmetric S | camera and position moves between two rests, line draws | entries (they feel late) |
| `DRAG` | 0.72, 0, 0.18, 1 | heavy start, firm arrival | followers that lag a leader of the same duration | leaders |
| `BOUNCE` | 0.34, 1.45, 0.5, 1 | 6.6% overshoot | the landing scale of small elements | position, camera, text, anything bounded by a track |
| `RAMP` | 0.85, 0, 0.15, 1 | linger, whip, settle | camera whips, whole-frame morphs | small UI moves (the linger reads as lag) |
| `RAMP_LONG` | 0.9, 0, 0.16, 1 | longer linger, later and harder whip | long pans whose payoff is the build | short moves |
| `ACCEL` | 0.55, 0.055, 0.675, 0.19 | ease-in, leaves at full speed | a move that hands its momentum to the next one | the last move of anything |
| `GLIDE` | 0.25, 0.1, 0.2, 1 | moving from frame one, builds, settles | drifts, a slide that flows into a pan | arrivals that need snap |

The calm four carry explainers; the speed-ramp four carry reels. Both registers use both families, but a reel leans on the ramps and an explainer on the calm four.

## Using curves.ts

Copy [assets/curves.ts](../assets/curves.ts) into the project; it has no imports. Its exports:

| export | what it is |
|---|---|
| `OUT` … `GLIDE`, `CURVES` | the eight curves as `Ease` functions, singly or keyed by name |
| `Ease` | `(t, from?, to?)`: eased progress for t in 0..1, or the eased value between from and to |
| `CURVE_POINTS`, `cssEase(name)` | the raw control points, and a ready `cubic-bezier(...)` string |
| `cubicBezier(x1, y1, x2, y2)` | build any other bezier ease |
| `timeAt(ease, value)` | the fraction of the duration at which an ease first reaches a value |
| `seg(t, start, dur)`, `lerp`, `clamp01` | the helpers every recipe in this skill uses |

`Ease` matches the Canvas Commons `TimingFunction` signature and the GSAP ease signature, so the same import works in every host:

```ts
import {OUT, RAMP, seg, cssEase} from './curves';

// Any engine: compute each value from t alone.
const titleY = (t: number) => OUT(seg(t, 1.2, 0.5), 40, 0);
const cameraY = (t: number) => RAMP(seg(t, 2.0, 0.85), 0, -1200);

// Canvas Commons: pass it where a TimingFunction goes
yield* camera().position.y(-1200, 0.85, RAMP);
// GSAP / HyperFrames: pass it as the ease
tl.to(cam, {y: -1200, duration: 0.85, ease: RAMP, onUpdate: render}, 2.0);
// CSS / Web Animations: the browser evaluates the same bezier
el.animate(frames, {duration: 850, easing: cssEase('RAMP')});
```

## Values

Measured from `assets/curves.ts`. Times are fractions of the tween's duration; speeds are relative to the move's average speed (1×).

| curve | 10% done at | 50% at | 90% at | peak speed | start speed | end speed |
|---|---|---|---|---|---|---|
| OUT | 0.017 | 0.102 | 0.329 | 6.25× at start | 6.25× | 0 |
| IN_OUT | 0.287 | 0.500 | 0.713 | 2.86× at 0.50 | 0 | 0 |
| DRAG | 0.298 | 0.462 | 0.655 | 4.38× at 0.46 | 0 | 0 |
| BOUNCE | 0.024 | 0.132 | 0.297 | 4.26× at start | 4.26× | 0 |
| RAMP | 0.344 | 0.500 | 0.656 | 6.67× at 0.50 | 0 | 0 |
| RAMP_LONG | 0.364 | 0.523 | 0.664 | 7.72× at 0.52 | 0 | 0 |
| ACCEL | 0.424 | 0.779 | 0.959 | 2.49× at end | 0.10× | 2.49× |
| GLIDE | 0.100 | 0.276 | 0.603 | 2.50× at 0.20 | 0.40× | 0 |

BOUNCE peaks at 1.066 around t = 0.55 and first crosses 1.0 at t = 0.376.

## Pitfalls

- **Engine presets as stand-ins.** `easeInOut`, `power3.out` or CSS `ease` are different shapes in every engine. Use the named eight.
- **Spring, back or elastic on a camera.** When the camera overshoots, the entire frame sways past its mark and swings back, which looks like unsteady footage and can make viewers queasy. BOUNCE does the same; keep it off cameras, positions and text.
- **ACCEL as the final move.** It leaves at 2.5× average speed; if nothing takes the momentum, it reads as a crash stop.
- **BOUNCE on a bar inside a track.** The 6.6% overshoot pokes past the track. Use OUT; it is already front-loaded.
- **Linear count-ups.** A number ticking at a constant rate rushes uniformly. Drive the count with OUT so it lands quickly, then refines.

## See also

- [curve-pairing](curve-pairing.md): which curve each property of one element gets
- [speed-ramps](speed-ramps.md): the RAMP family in depth, and the asymmetric nudge
- [linear-reads-cheap](linear-reads-cheap.md): what replaces linear motion
- [synced-events-from-curve](synced-events-from-curve.md): timing events off an eased value

*Idea adapted from HyperFrames (Apache-2.0).*
