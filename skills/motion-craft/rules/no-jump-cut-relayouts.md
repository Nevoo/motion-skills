---
name: no-jump-cut-relayouts
description: Never change a layout with a hard cut, even when a reference clip does; tween position, size and crop together on one progress so every layout change is a visible move.
tags: [layout, morph, transitions, taste]
---

# No jump-cut re-layouts

**Use when:** the frame's layout changes: a full-bleed shot becomes a split screen, a panel resizes, a grid reflows, a video tile shrinks into a corner, a crop tightens.

## How it works

A hard cut between two layouts of the same content reads as a glitch: the viewer sees the same pixels teleport and assumes something broke. This holds even when the reference clip being recreated uses jump cuts. In live footage the cut has a reason; in a rebuilt motion piece it doesn't.

**Observed failure:** re-layouts recreated faithfully from a reference's jump cuts were read as jagged and glitching, twice. Morphing every layout change fixed it.

Morph a re-layout on one progress value:

- **Position and size together** (the whole rect), never one and then the other.
- **The crop** (the window into the content), so the content doesn't jump inside its frame.
- **Underlying layers in step:** a background that fades, a second panel that slides in, all on the same progress.

Use RAMP when the whole frame changes and OUT or IN_OUT for a single panel.

## Recipe

```ts
import {RAMP, seg, lerp} from './curves';

type Rect = {x: number; y: number; w: number; h: number};
const lerpRect = (a: Rect, b: Rect, k: number): Rect => ({
  x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k),
});

function toSplit(t: number, at: number, dur = 0.8) {
  const k = RAMP(seg(t, at, dur));
  return {
    tile: lerpRect(FULL_FRAME, LEFT_HALF, k),    // where the tile sits on screen
    crop: lerpRect(SOURCE_WIDE, SOURCE_FACE, k), // which part of the source shows inside it
    panelX: lerp(FRAME_W, FRAME_W / 2, k),       // the newcomer slides in on the same k
    dimBehind: k * 0.4,                          // layers underneath change in step
  };
}
```

For DOM hosts, the FLIP pattern does the same: measure the first and last boxes, apply the inverse transform, then animate to identity on a named curve. A pure scale distorts content, so for text and UI animate the box size or clip and keep the content unscaled.

## Values

| change | curve | duration |
|---|---|---|
| whole frame (full to split, grid reflow) | RAMP | 0.6–0.9s |
| one panel resize or dock | OUT | 0.4–0.5s |
| crop or reframe inside a tile | IN_OUT, same duration as the tile | same |

## Pitfalls

- **Stretching instead of cropping.** Changing aspect by scaling distorts faces and type. Tween the crop.
- **Text reflowing mid-tween.** Lines jump between wraps. Fix the text box at its end width, or scale the text block uniformly.
- **Width first, then height.** Two moves where the viewer expects one.
- **Tweening sizes inside a layout engine directly.** The solver can overwrite them every frame. Drive one master progress and derive sizes from it (engine mechanics in `canvas-commons`).

## See also

- [morph-not-crossfade](morph-not-crossfade.md)
- [speed-ramps](speed-ramps.md)
- [continuous-over-cut](continuous-over-cut.md)
