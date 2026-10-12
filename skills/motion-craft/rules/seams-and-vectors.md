---
name: seams-and-vectors
description: Plan every cut as a vector hand-off; log exit and entry axis, direction and depth sign before authoring, cut while both sides are moving, match the speed with ACCEL into OUT, and never dissolve.
tags: [transitions, seams, cuts, velocity]
---

# Seams and vectors

**Use when:** two passages meet at a cut: any boundary where one set of content replaces another without a continuous camera move.

## How it works

A cut disappears when the eye's momentum survives it. The eye carries the direction and speed of whatever it was tracking; if the next shot continues that vector, the brain stitches the two shots into one motion.

**Write a vector ledger before authoring.** One row per cut:

| cut at | exit axis, direction | entry axis, direction | depth sign | carrier |
|---|---|---|---|---|
| 3.20s | y, up | y, up | none | the headline's word group |
| 6.85s | z, in (growing) | z, in (growing) | + | the logo ring |
| 9.40s | x, left | x, left | none | the pointer, mid-path |

Depth sign: content growing on screen means pushing in (+); shrinking means pulling back (−). The flip to watch for: the outgoing shot shrinks away from the viewer, then the incoming content scales up out of nothing, because scaling up is what most entrance presets do. Depth reverses at the cut and the eye feels the jolt.

Then hold every seam to five rules:

1. **The exit is still moving at the cut.** Settling to rest first leaves a dead frame.
2. **The entry is mid-flight.** The incoming content is already travelling on its first frame; it never starts from rest.
3. **Same axis, same direction.** x stays x; never mirror (up then down, push then pull).
4. **Matched speed.** The entry's first-frame speed is close to the exit's last-frame speed. Treat small mismatches as warnings, not failures.
5. **Zero overlap.** A cut is not a dissolve. Exactly one side is visible on any frame.

A seam is most convincing when an object the eye is already following survives it, continuing on the far side from the same spot at the same pace: the pointer partway through its move, a shape that turns into the next layout, a line of words.

## Velocity-matched curves

Exit on an ease-in, enter on an ease-out, so the fastest points meet at the cut. With the named curves, exit on ACCEL (it leaves at 2.49× its average speed) and enter on OUT (it arrives at 6.25× its average speed). Match the speeds through the durations:

```
exit speed  = 2.49 · D_exit  / T_exit
entry speed = 6.25 · D_entry / T_entry
equal when    T_entry = 2.51 · T_exit · D_entry / D_exit
```

For equal distances the entry runs about 2.5× as long as the exit: a short accelerating exit, a long decelerating entry.

## Recipe

```ts
import {ACCEL, OUT, seg} from './curves';

const CUT = 3.2, T_EXIT = 0.3, D = 300;
const T_ENTRY = 2.51 * T_EXIT;                                   // equal distances
const exitY = (t: number) => ACCEL(seg(t, CUT - T_EXIT, T_EXIT), 0, -D);
const entryY = (t: number) => OUT(seg(t, CUT, T_ENTRY), D, 0);  // continues upward
const outgoingVisible = (t: number) => t < CUT;                  // hard switch, no dissolve

// Seam audit from the pure functions: direction and speed at the cut.
const F = 1 / 60;
const vExit = (exitY(CUT) - exitY(CUT - F)) / F;
const vEntry = (entryY(CUT + F) - entryY(CUT)) / F;
const mirrored = Math.sign(vExit) !== Math.sign(vEntry);
const speedRatio = vEntry / vExit;                                // ~1 is matched
```

With these numbers both sides move at about 2,490 px/s at the cut. Sampled one frame apart, as above, the ratio reads about 0.97 because OUT already decelerates within its first frame; flag only large mismatches.

## Pitfalls

- **The exit finishes, then the cut.** A dead beat. Cut while it still moves.
- **A default entrance after a pull-back.** Scale-up-from-small mirrors the depth vector.
- **A dissolve between passages.** It has no carrier and no vector.
- **Editing a passage's first or last second.** That re-opens its seam. Re-check the ledger row.
- **Changing direction without a visible cause.** A click or an impact licenses a turn; an uncaused flip reads as ping-pong.

## See also

- [exit-is-the-transition](exit-is-the-transition.md)
- [continuous-over-cut](continuous-over-cut.md)
- [speed-ramps](speed-ramps.md)
- [named-curves](named-curves.md): start and end speeds of every curve

*Idea adapted from HyperFrames (Apache-2.0).*
