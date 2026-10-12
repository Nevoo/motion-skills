---
name: signature-motif
description: Pick one repeating visual as the spine of a reel before animating anything; the eye learns it and uses it to parse the montage. Four proven motif concepts and a reel checklist.
tags: [reel, motif, structure, concept]
---

# One signature motif

**Use when:** building a launch reel, sizzle reel or any dense montage, or when a reel feels like noise.

## How it works

A dense reel without a spine reads as noise. Pick one visual that returns three or four times, each time meaning the same thing, and decide it before animating anything. The eye learns it on its first appearance and uses it to parse everything after. Reel energy comes from fast morphing around that spine, not from fast cutting: a strong 45-second launch reel can get by with fewer than four hard cuts.

Four proven concepts:

- **Ring to burst ("thinking").** A ring of dots contracts to a point, then bursts into a fine radial starburst, all from one progress value. A counter ticking on the same progress peaks with the rays.
- **The pointer as a character.** One pointer glides between interface elements, presses, drags. It stitches unrelated stages into one space. It has one reserved colour used for nothing else, moves on OUT (IN_OUT floats), and on a click only it and the touched element react. Its click causes the next morph immediately.
- **Multiply, merge, label.** One shape multiplies into several in a radial stagger, the cluster merges into a row, and one survivor stretches into a pill carrying a word. Every step is a morph. Pre-place the copies and drive the spread from one progress.
- **Block dissolve (real to abstract).** A photo or live subject dissolves into a grid of canvas-coloured squares that uncover in scattered order, and re-forms as the piece's abstract language. Pair the dissolve-out with the next element's arrival in one block.

**Reserve hard geometry for hard meaning.** A circle becoming a pill should mean "this expanded into a label", not decoration.

## Recipe

```ts
import {IN_OUT, clamp01} from './curves';

const band = (a: number, b: number, v: number) => clamp01((v - a) / (b - a));

// Ring to burst. p is the eased progress (IN_OUT over ~1.4s); every phase reads it.
function ringBurst(p: number) {
  return {
    dotRadius: RING_R * (1 - band(0, 0.4, p)),   // dots ride inward
    dotAlpha: 1 - band(0.4, 0.6, p),             // dots hand over to rays
    rayOuter: RAY_INNER + RAY_LEN * band(0.45, 1, p),
    rayAlpha: band(0.45, 1, p),
    counter: Math.round(p * FINAL_COUNT),        // same progress: peaks with the rays
  };
}
const burstAt = (t: number) => ringBurst(IN_OUT(clamp01((t - BURST_AT) / 1.4)));

// Block dissolve. Thresholds are seeded once at build time, never drawn per frame,
// so every render and every seek is identical.
const rand = (n: number) => { const x = Math.sin(n * 91.7 + 13.1) * 43758.5; return x - Math.floor(x); };
const thresholds = Array.from({length: COLS * ROWS}, (_, i) => rand(i));
const cellCover = (cell: number, reveal: number) => 1 - clamp01((reveal - thresholds[cell]) / 0.08);
```

Drop-in components for the ring burst and the pointer exist in `canvas-commons`.

## Reel checklist

1. **One motif repeats.** If every beat is a different idea, promote one visual to recurring.
2. **Morph where you would cut.** Sub-second hard cuts read cheap; keep cuts for a deliberate jolt.
3. **The pointer keeps one reserved colour and moves on OUT.**
4. **Headlines build word by word** with one accent word and a stagger smaller than the word duration.
5. **Counters ride the same progress** as the burst they measure.
6. **One background colour throughout,** so every card and accent pops from the same field.
7. **One palette.** Never mix the calm and the reel palettes in one piece.

## Pitfalls

- **Choosing the motif after animating.** It ends up bolted on rather than structural.
- **A motif that changes meaning.** If the burst means "thinking" once and "success" later, the viewer stops parsing it.
- **Random numbers drawn per frame** in a dissolve. It flickers, and two renders differ.

## See also

- [kinetic-headlines](kinetic-headlines.md)
- [morph-not-crossfade](morph-not-crossfade.md)
- [one-background](one-background.md)
- [reel-pacing](reel-pacing.md)
