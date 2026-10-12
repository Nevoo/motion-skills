---
name: kinetic-glyph-stretch
description: Stretching, squashing or smearing real font glyphs; scale about the measured optical centre, and build a comet trail from one moving value rather than per-glyph timings.
tags: [typography, kinetic-type, glyphs, comet]
---

# Kinetic glyph stretch

**Use when:** the glyphs themselves deform: a letter stretched tall, a word smeared into a comet, a run of letters growing as a wave passes.

## How it works

**Use real glyphs.** Viewers tell a circle standing in for an "o" from the font's own "o" instantly.

**Scale about the optical centre.** Most engines scale text about its line box. The line box includes ascender and descender space, so its centre sits above the visible ink, and a glyph scaled about it grows off-centre. Measure the ink's centre once per font and size (canvas text metrics give the ink bounds relative to the baseline; replicate how your engine places the baseline), re-measure after fonts finish loading, and counter-translate so the ink centre stays put.

**The amplification trap.** A pivot error ε becomes ε × scale of drift: a 12px error at scale 11 is about 130px. Don't fix that by moving the whole line, which drags the static text along. Add a correction that is zero at rest and full at maximum stretch, and expose it as a slider.

**The comet.** A run of glyphs that reveal, stretch tall as the motion passes, and trail off:

- **One laid-out row of real glyphs,** each in a fixed-width cell (cell width equals the pitch), so spacing never drifts while glyphs deform inside their cells.
- **Bind everything to one moving value** (the world or camera x), read every frame. Reveal, stretch and trail are functions of each glyph's screen position, not per-glyph timings.
- **Height grows, width stays near 1.** Growing width makes glyphs collide and thins the stroke.
- **A steep ramp that plateaus.** Early glyphs barely move, then the stretch climbs hard, and the last few all reach the maximum: a fat head, not a single spike.
- **The stretch holds** once reached. A band that grows and shrinks reads as a travelling hill.
- **A tonal trail.** Opacity rises on reveal, holds, then decays to a faint floor with age, so fresh glyphs are dark and old ones pale. The gradient shows direction and speed.
- **Spread to de-pile.** When stretched footprints exceed the pitch, fan glyphs apart by the excess (stroke width included), anchored at the head.

## Recipe

```ts
import {OUT, clamp01, lerp} from './curves';

// gc: ink centre below the pivot at scale 1, measured. The ink centre stays at BASE_Y.
const pivotY = (sy: number) =>
  BASE_Y - gc * sy + (STRETCH_FIX * (sy - 1)) / Math.max(0.001, MAX_SY - 1);

// Glyph i of n, at screen x. The row moves left past REVEAL_X as the camera pans.
function comet(i: number, n: number, screenX: number) {
  const past = REVEAL_X - screenX;                                  // px past the reveal line
  const peak = 1 + Math.pow(clamp01(i / (n - FULL_COUNT)), POW) * (MAX_SY - 1);
  const sy = lerp(1, peak, OUT(clamp01(past / GROW_PX)));          // grows in, then holds
  const reveal = clamp01((past + ENTER_PX) / ENTER_PX);
  const age = clamp01((past - HOLD_PX) / FADE_PX);
  return {sx: 1, sy, opacity: reveal * lerp(1, TRAIL_FLOOR, age)};
}
```

`STRETCH_FIX` is zero at rest and exactly its own value at `MAX_SY`, so it recentres the fully stretched glyphs without moving round ones or the surrounding text.

## Values

| parameter | starting point |
|---|---|
| maximum vertical stretch | 10–11× |
| glyphs at the plateau | the last 3–4 |
| ramp exponent | 2–3 |
| trail floor opacity | 0.15–0.3 |

These depend on font and frame. Expose all of them as live sliders.

## Pitfalls

- **Stand-in shapes** instead of the font's glyphs.
- **Scaling the text node directly** about its line box: the stretch grows downward.
- **Fixing drift by moving the line.** The static text moves too.
- **Per-glyph timelines.** Re-timing the pan becomes impossible; bind to the moving value.
- **Forgetting the stroke** in spacing maths. A stroked shape's footprint is its width plus the line width.

## See also

- [kinetic-headlines](kinetic-headlines.md)
- [signature-motif](signature-motif.md)
- Engine gotchas (pivot properties, layout children ignoring position, wrapping a glyph in a plain node): `canvas-commons`. Pulling the camera back through text in 3D: `motion-3d`.
