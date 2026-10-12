---
name: stagger-waves
description: Staggered reveals read as one wave only when the stagger is shorter than each item's duration; every item shares one curve, and the wave travels outward from its cause.
tags: [stagger, pacing, reveal]
---

# Stagger waves

**Use when:** several items (cards, rows, words, dots, edges) arrive or leave as a group.

## How it works

If the stagger is shorter than each item's duration, the items overlap and the group reads as one wave passing through. If it is longer, each item finishes before the next starts: a sequence of beats, a ticking clock.

Order matters as much as timing. A wave should travel from something:

- **the cause:** outward from the button that was clicked or the point where the camera lands;
- **reading order:** along each line, then down to the next, for text and lists;
- **the focal point:** outward from the hero.

Array order that jumps around the screen reads as random. Scattered order is reserved for dissolves.

Every item in a wave shares one curve and one duration; only the start offset differs. Per-item curves or durations turn a wave into noise.

## Recipe

```ts
import {OUT, BOUNCE, seg} from './curves';

// Item i: shared curve and duration, offset start.
const item = (t: number, i: number) => OUT(seg(t, START + i * STAGGER, DUR));

// A radial wave from a source: order by distance, not by array index.
const order = items
  .map((it, i) => ({i, d: Math.hypot(it.x - src.x, it.y - src.y)}))
  .sort((a, b) => a.d - b.d)
  .map(o => o.i);
const startOf = new Map(order.map((idx, rank) => [idx, START + rank * STAGGER]));

// Or let the wave travel at a speed: the start is proportional to distance.
const startAt = (d: number) => START + d / WAVE_PX_PER_S;

// Long lists: cap the total wave so the last item doesn't spill into the next moment.
const stagger = (n: number) => Math.min(STAGGER, MAX_WAVE / Math.max(1, n - 1));

// Small chips may land with a BOUNCE scale while their opacity rides OUT.
const chip = (t: number, i: number) => ({
  opacity: OUT(seg(t, START + i * 0.06, 0.4)),
  scale: BOUNCE(seg(t, START + i * 0.06, 0.46), 0.6, 1),
});
```

## Values

| group | per item | stagger |
|---|---|---|
| 3 cards fading in | 0.34s | ~0.09s |
| 3 rows | 0.32s | ~0.08s |
| headline words | 0.42–0.5s | 0.08–0.12s |
| 4+ items | 0.4–0.5s | 0.12–0.18s |
| nodes or chips in a reel | 0.4–0.46s | ~0.06s |
| edges or lines drawing in | ~0.42s | ~0.1s |

The ratio that matters: every row above staggers at roughly a quarter to a third of the item duration, so three or four items are always in flight together. That overlap is what reads as one gesture.

## Pitfalls

- **Stagger longer than the duration.** Items tick in one by one.
- **A wave that grows with the list.** Ten items at 0.15s is a 1.35s wave that drags. Cap the total.
- **BOUNCE on text items.** Words in a wave rise on OUT; only small shapes bounce.
- **A wave with no origin.** If nothing caused it, start it from the focal point or follow reading order.

## See also

- [kinetic-headlines](kinetic-headlines.md): the word-by-word wave
- [formation-by-bearing](formation-by-bearing.md): waves that converge into a shape
- [reel-pacing](reel-pacing.md)
