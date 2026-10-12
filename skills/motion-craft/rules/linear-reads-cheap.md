---
name: linear-reads-cheap
description: Constant-speed motion reads as mechanical wherever the viewer can see it start or stop; drifts glide, rotations arc once, typewriters step per character, counts ease.
tags: [easing, drift, rotation, typewriter, taste]
---

# Linear reads as cheap

**Use when:** anything moves at a constant rate: a drift during a hold, a spinner, a rotating emblem, a typewriter, a count-up, a progress fill.

## How it works

Real things accelerate and decelerate. A visible move at constant speed, above all one that starts or stops abruptly, reads as a software default. That holds wherever it lands, including small background motion the viewer only half notices. The replacement depends on the kind of motion:

| motion | instead of linear |
|---|---|
| drift during a hold (slow push, pan, scale creep) | GLIDE across the whole hold, already moving when the hold begins; for the last hold of the piece, let the GLIDE window run past the end (or add a constant creep) so the final frame still moves |
| continuous rotation (spinner, emblem, ring) | one IN_OUT arc spanning the whole passage, ending on a multiple of the shape's symmetry angle |
| typewriter | whole characters at a steady interval with a caret; never an eased interpolation of the string |
| count-up | the count driven by OUT: rushes, then refines |
| progress or loading fill | OUT per known phase |

**Rotation.** Spin up, spin, stop, spin again is three motions where the viewer expects one. One long IN_OUT arc covers the whole passage: its slow start is the spin-up and its slow end is the landing. End on the shape's symmetry (pentagon 72°, hexagon 60°, square 90°) so the final pose looks deliberate.

**Typewriters.** Typing has a steady rhythm of discrete keystrokes. Interpolating the string through an ease makes characters arrive in bursts and stalls, which reads as a glitch rather than typing.

## Recipe

```ts
import {IN_OUT, GLIDE, OUT, seg} from './curves';

// Rotation: one arc for the whole passage, landing on symmetry.
const SIDES = 5, STEPS = 10;                         // 10 × 72° = 720°
const angle = (t: number) => IN_OUT(seg(t, PASSAGE_AT, PASSAGE_DUR)) * STEPS * (360 / SIDES);

// Drift: one GLIDE over the entire hold.
const holdScale = (t: number) => GLIDE(seg(t, HOLD_AT, HOLD_DUR), 1, 1.04);

// Typewriter: whole characters, steady interval, caret dips on each keystroke.
const CHAR = 0.085;
function typed(t: number, text: string, at: number) {
  const n = Math.min(text.length, Math.floor(Math.max(0, t - at) / CHAR));
  const inKey = t >= at && n < text.length && (t - at) % CHAR < CHAR * 0.45;
  return {shown: text.slice(0, n), caretOpacity: inKey ? 0.3 : 1};
}

// Count-up: the number rides OUT.
const count = (t: number) => Math.round(OUT(seg(t, COUNT_AT, 1.2)) * FINAL);
```

## Values

| element | value |
|---|---|
| keystroke interval | 0.06–0.09s |
| caret during a keystroke | dips to 0.3 for ~45% of the interval |
| caret after typing | fades out over ~0.16s |
| hold drift | a few percent of scale or frame width, GLIDE over the hold |

## Where linear is fine

Only as an ingredient the viewer never sees start or stop:

- the time base itself;
- the burst segment of a nudge, bracketed by eased phases (see speed-ramps);
- a constant creep summed under eased moves from the first frame. It is already moving on frame one and still moving on the last, so it never visibly starts or stops; it just keeps the frame alive between moves.

```ts
const cameraZ = (t: number) => -CREEP * t + RAMP(seg(t, WHIP_1, 0.85), 0, -D1) + RAMP(seg(t, WHIP_2, 0.85), 0, -D2);
```

A dead stop on the final frame reads as a freeze, so the last frame of a piece is always still creeping or drifting.

## Pitfalls

- **Spinner on a linear loop.** Replace it with one arc across the passage.
- **Rotation that ends off-symmetry.** The shape settles into a visibly wrong orientation.
- **A drift that starts after the hold begins.** The dead first frames read as a stall. GLIDE starts moving at once.
- **Caret that stays solid while typing.** The keystroke dip is what gives typing its tactile rhythm.

## See also

- [named-curves](named-curves.md)
- [formation-by-bearing](formation-by-bearing.md): rotation during convergence
- [speed-ramps](speed-ramps.md)
