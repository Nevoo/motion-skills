---
name: one-background
description: One background colour and one palette across a whole piece, with the background outside the camera; a mid-piece light-to-dark switch reads as a different video.
tags: [colour, design, taste, continuity]
---

# One background

**Use when:** choosing the canvas colour and palette, or when a piece moves through sections that seem to want different moods.

## How it works

The background is the space the whole piece lives in. Keep one colour from the first frame to the last and the stages read as places in one world. Switch it mid-piece (a light intro, then a dark middle) and the viewer feels a cut to a different video; the jolt is worst when the intro established a light world.

- **The background sits outside the camera,** so it never pans or scales. Content moves over a constant field. A background inside the camera shows its edges the moment the camera pulls back.
- **One palette per piece:** a calm explainer palette (cool, restrained) or a reel palette (a warm or dark canvas with a few saturated accents), never both.
- **A colour with a job keeps that job.** When one hue identifies a recurring element (the cursor, say), no chart, word or shape borrows it.
- **A product demo can take the product's canvas colour** as its background, so UI and world merge (faithful-product-ui).

If a section genuinely needs a darker mood, bring the dark in as content: a dark card or device that fills the frame through a morph or a push-in, while the world's background stays unchanged beneath it.

## Recipe

```ts
// Placeholders: a neutral grey ramp and a single accent. Swap in the real values.
export const COLORS = {
  accent: '#E4572E',
  grey900: '#121212',
  grey600: '#5C5C5C',
  grey300: '#B3B3B3',
  grey100: '#EBEBEB',
  canvas: '#F7F7F7',  // drawn once, outside the camera
} as const;
```

Scene code reads every colour from this one module, never from literals.

Verify it on the render: a corner pixel sampled across the piece must not change. Pick a corner that content never covers.

```bash
for t in 0 2 4 6 8; do
  ffmpeg -v error -ss $t -i out.mp4 -frames:v 1 -vf "format=rgb24,crop=1:1:4:4" -f rawvideo - | xxd -p
done
```

Every line should print the same hex value.

## Values

| part | rule |
|---|---|
| background colours per piece | 1 |
| palettes per piece | 1 |
| accent colours | 1–2, plus one reserved colour if there is a pointer |
| dark section in a light piece | a full-frame dark card brought in by a morph or push-in |

## Pitfalls

- **Section-themed backgrounds.** Each switch reads as a new video.
- **The background inside the camera.** It pans with the content and its edges appear during a pull-back or scale dip.
- **A gradient that drifts in hue across sections.** The same jolt, spread out.
- **Reusing the reserved colour** for an accent word or a chart.

## See also

- [signature-motif](signature-motif.md): the reel checklist
- [one-hero-per-frame](one-hero-per-frame.md)
- [faithful-product-ui](faithful-product-ui.md)
- [column-whip](column-whip.md)
