---
name: formation-by-bearing
description: When scattered elements converge into a formation, assign slots by each element's bearing around the centre, and make any spin one continuous arc that ends on the formation's symmetry.
tags: [formation, choreography, rotation, convergence]
---

# Formation by bearing

**Use when:** N scattered elements converge into a ring, grid, logo lockup or cluster, possibly spinning once formed, including the ending, when the last line's glyphs break apart and converge into the logo.

## How it works

If slots are assigned in array order, elements cross each other's paths on the way in. Crossing paths read as shuffling or glitching, not as a shape condensing. Give each element the slot it is already pointing at: sort elements and slots by bearing (the angle around the formation's centre) and pair them in cyclic order, choosing the rotation offset with the least total travel. Every element then flies roughly straight inward.

If the formed shape spins (a loading ring, an orbiting cluster), the spin is **one continuous arc spanning convergence and spin**. Its IN_OUT slow start doubles as the spin-up while elements converge, and it slows to rest at the end of the passage on a multiple of the formation's symmetry angle (pentagon 72°, hexagon 60°). Form, full stop, spin up is three motions where the viewer expects one.

Rotation during convergence is only a problem with array-order slots: crossing paths plus orbit is chaos. With bearing-matched slots it reads as a coherent swirl.

**At the ending, converge what is already on screen.** When the formation is the logo, the converging elements are the motif's own population: the last line read, broken into its dots or strokes, not a new batch spawned for the lockup. The mark forms where the line was, in the frame the camera already holds; a camera move from the text to a logo formed elsewhere is a cut in disguise ([last-read-becomes-logo](last-read-becomes-logo.md)).

## Recipe

```ts
import {IN_OUT, OUT, seg, lerp} from './curves';

type P = {x: number; y: number};
const bearing = (p: P, c: P) => Math.atan2(p.y - c.y, p.x - c.x);

// slotOf[i] = slot for item i. Cyclic pairing by bearing, best rotation offset.
function assignByBearing(items: P[], slots: P[], c: P): number[] {
  const n = items.length;
  const byBearing = (pts: P[]) =>
    pts.map((_, i) => i).sort((a, b) => bearing(pts[a], c) - bearing(pts[b], c));
  const iOrder = byBearing(items), sOrder = byBearing(slots);
  let best = 0, bestCost = Infinity;
  for (let k = 0; k < n; k++) {
    let cost = 0;
    for (let j = 0; j < n; j++) {
      const a = items[iOrder[j]], b = slots[sOrder[(j + k) % n]];
      cost += Math.hypot(a.x - b.x, a.y - b.y);
    }
    if (cost < bestCost) { bestCost = cost; best = k; }
  }
  const slotOf = new Array<number>(n);
  iOrder.forEach((item, j) => (slotOf[item] = sOrder[(j + best) % n]));
  return slotOf;
}

// One arc for the whole passage; elements fly to the ROTATING slot positions.
const spin = (t: number) => IN_OUT(seg(t, FORM_AT, PASSAGE)) * STEPS * (2 * Math.PI / SIDES);
function itemAt(t: number, i: number, start: P[], slotOf: number[], slots: P[], c: P): P {
  const a = spin(t), s = slots[slotOf[i]];
  const rx = c.x + (s.x - c.x) * Math.cos(a) - (s.y - c.y) * Math.sin(a);
  const ry = c.y + (s.x - c.x) * Math.sin(a) + (s.y - c.y) * Math.cos(a);
  const k = OUT(seg(t, FORM_AT, CONVERGE));
  return {x: lerp(start[i].x, rx, k), y: lerp(start[i].y, ry, k)};
}
```

## Values

| part | curve | timing |
|---|---|---|
| convergence | OUT | shorter than the spin passage, so the shape forms while the spin is still accelerating |
| spin | IN_OUT | the whole passage, convergence included |
| total rotation | a whole number of symmetry steps | e.g. 10 × 72° for a pentagon |

## Pitfalls

- **Array-order slots.** Paths cross; it reads as a glitch.
- **Sorted by bearing but no cyclic offset.** Elements on one side still travel across the formation.
- **Flying to static slots while the formation rotates.** Elements arrive at the wrong spots and snap. Target the rotated slot positions.
- **Stopping between formation and spin.** Three motions instead of one.
- **Ending off-symmetry.** The final pose looks crooked.
- **A new batch of elements for the logo.** Converge the elements the viewer has been watching.

## See also

- [linear-reads-cheap](linear-reads-cheap.md): rotation as one arc
- [stagger-waves](stagger-waves.md)
- [signature-motif](signature-motif.md)
- [last-read-becomes-logo](last-read-becomes-logo.md): the logo formed from the last line
