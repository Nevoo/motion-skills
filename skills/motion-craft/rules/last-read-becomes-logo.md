---
name: last-read-becomes-logo
description: End a piece by turning the last thing the viewer read into the logo, its glyphs or motif elements breaking and re-forming into the mark as one morph. Never build the logo from new material, and never fly the camera from the text to a separate logo.
tags: [ending, logo, morph, motif]
---

# The last read becomes the logo

**Use when:** planning the ending of a reel or launch piece (the logo lockup, the end card, the sign-off), or when an ending feels bolted on.

## How it works

The ending is where a piece proves it was one thing. If the motif's elements have travelled with the viewer the whole way, the logo is made of them. If it arrives as new material, the piece ends on a different video.

**The motif persists and re-forms.** The motif's elements (dots, strokes, tiles, a pointer) are one population that lives through the whole piece. They form a line of copy, stream through a whip, form the next line. Nothing is spawned for the ending that the viewer hasn't already been watching.

**The last thing read becomes the mark.** Whatever the viewer read last (a headline, a question, a product name) breaks into its elements, and those elements re-form into the logo. The glyphs become dots, the dots converge on the mark by bearing ([formation-by-bearing](formation-by-bearing.md)), and the mark resolves solid. It is a morph, not a crossfade: the same elements, every shared property tweened ([morph-not-crossfade](morph-not-crossfade.md)).

**Never build the logo from new material.** A fresh batch of dots, a mark fading in over the old line, a logo drawn on from nothing: each tells the viewer the story ended and an advert began.

**Moving the camera from the text to a separate logo is a cut in disguise.** The line stays where it was, the camera trucks to a logo built somewhere else, and the viewer watches two unrelated objects in turn. Bring the mark to the copy instead: it forms where the last line was, in the frame the camera already holds. The camera may push in on it; it doesn't travel to it.

**Observed failure:** the last line formed, the camera trucked away from it, and the logo assembled from a new set of dots. Each part was well animated and the ending still read as amateur.

**Make the break invisible.** On one frame, swap the type for a dot raster of its own glyphs, with each dot at the radius where neighbours merge, so the swap can't be seen. Then shrink the dots apart so the type visibly crumbles. Choose the raster pitch so the line's dot count roughly matches the mark's; leftover dots shrink to nothing in flight, missing ones are born at a neighbour's position. One leftover may become the next element, such as the dot that stretches into the call-to-action pill.

## Recipe

Each dot is one element from the last line to the mark. `slotOf` comes from `assignByBearing` in formation-by-bearing; `loose` holds the scattered positions, seeded once at build time.

```ts
import {IN_OUT, OUT, seg, lerp} from './curves';

type P = {x: number; y: number};
const mix = (a: P, b: P, k: number): P => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)});

function endingDot(t: number, i: number, glyph: P[], loose: P[], mark: P[], slotOf: number[]) {
  const apart = OUT(seg(t, BREAK_AT, 0.15));
  const scatter = OUT(seg(t, BREAK_AT, SCATTER));
  const lock = IN_OUT(seg(t, LOCK_AT, LOCK));
  const merge = OUT(seg(t, LOCK_AT + LOCK, MERGE));
  const pos = mix(mix(glyph[i], loose[i], scatter), mark[slotOf[i]], lock);
  return {...pos, r: lerp(lerp(MERGED_R, DOT_R, apart), MERGED_R, merge)};
}
```

`LOCK_AT` falls before `BREAK_AT + SCATTER`, so the lock starts while the scatter is still settling and nothing holds between them. When the merged dots read as solid, swap to the vector mark on one frame. A time-remap hang on the scatter ([time-remap-ramps](time-remap-ramps.md)) makes the snap into the mark the hero moment.

## Values

| phase | curve | timing |
|---|---|---|
| type swaps to its dot raster | none, same frame | one frame |
| dots shrink apart | OUT | ~0.15s |
| scatter | OUT | 0.3–0.5s, overlapping the lock |
| converge on the mark | IN_OUT, or RAMP after a time-remap hang | 0.4–0.6s |
| dots merge solid | OUT | ~0.4s |
| final lockup hold | still creeping | ~1–1.5s ([reel-pacing](reel-pacing.md)) |

## Pitfalls

- **A fresh batch of elements for the logo.** The thread breaks on the last beat. Re-use the population on screen.
- **A crossfade from the line to the mark.** Two objects sharing a spot; the "became" link is gone.
- **The camera trucking from the text to a logo elsewhere.** A cut in disguise. Form the mark where the line is.
- **A visible swap from type to dots.** Match the dot radius to the merged size on the swap frame.
- **Unequal counts solved by popping.** Leftovers shrink away in flight or are born at a neighbour's position.
- **A hold between scatter and lock.** Overlap them; a time-remap hang is the only sanctioned slow-down.

## See also

- [signature-motif](signature-motif.md): the population that persists
- [formation-by-bearing](formation-by-bearing.md): slots for the converging dots
- [morph-not-crossfade](morph-not-crossfade.md)
- [time-remap-ramps](time-remap-ramps.md)
- [kinetic-glyph-stretch](kinetic-glyph-stretch.md): measuring real glyphs
