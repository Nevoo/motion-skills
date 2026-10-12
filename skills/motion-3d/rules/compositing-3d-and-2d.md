---
name: compositing-3d-and-2d
description: Stack 2D layers under and over a transparent WebGL buffer, and hand elements between 2D and 3D in the same frame at matched size, so the boundary never shows.
tags: [compositing, layering, host]
---

# Compositing 3D and 2D

**Use when:** a piece mixes three.js with 2D nodes or DOM: a 2D background, 2D titles over 3D, a 3D reveal that continues as 2D kinetic type, or the reverse.

## How it works

Render three.js into a **transparent** buffer (`alpha: true`, clear alpha 0, premultiplied alpha) and treat it as one layer in a stack:

```
top     2D overlays: lockups, captions, a veil
        3D layer: the WebGL canvas / bridge node
bottom  2D background: one colour for the whole piece
```

- **Canvas Commons:** nodes added before the bridge node draw underneath it. Nodes added after it, or as its children, draw on top.
- **HyperFrames:** the WebGL canvas is an absolutely positioned element. DOM layers above it get a higher stacking order. Keep the canvas buffer pinned at the supersampled size, with its CSS size equal to the composition.

## Hand-offs between 2D and 3D

Crossing the boundary should be invisible. Swap representations **in the same frame**, at the **same on-screen size and position**:

1. Pick the frame where the element is still (or at the end of a move).
2. Compute the 3D size that matches the 2D ink size at the current camera distance (`pxToWorld`), or build the world in pixel space so they're equal by construction ([px-space-world.md](px-space-world.md)).
3. In one frame: hide one and show the other. Never crossfade them, because two overlapping copies of the same text read as a double image.

```ts
// 3D → 2D (Canvas Commons): at the end of the pull-back
planeOn(0);                    // apply() hides the 3D plane
headline().opacity(1);         // the 2D node sits exactly where the plane settled
```

## Landing a 2D lockup over a 3D world

When the final title is 2D and the 3D world keeps drifting behind it:

- Fade a **veil**, a full-frame rect in the background colour at about 0.9–0.95 opacity, over 0.5 s with OUT. The world recedes without vanishing.
- Land the lockup at the same moment, scaling from about 3× to 1 with OUT, opacity rising over the first third.
- Keep the lockup moving with a constant push-in (+2–3 % scale per second) summed under its landing from the landing's first frame, `scale = land(t) * (1 + 0.025 * max(0, t - tLand))`, so the final frame isn't frozen and the landing doesn't kink into the creep.

## Pitfalls

- **Two background colours.** If the 3D scene sets `scene.background` and a 2D rect also paints the background, they diverge under grading or FX. Pick one owner (usually the 2D layer) and keep the WebGL buffer transparent.
- **Premultiplied-alpha fringes.** Dark or light halos around 3D edges over 2D mean the alpha modes disagree. Keep `premultipliedAlpha: true` and transparent clear colour; don't un-premultiply in a post pass.
- **Post passes that output alpha 1** make the 3D layer opaque and hide the 2D background. Either carry alpha through the pass, or let the 3D own the background.
- **Opaque post FX applied only to the 3D layer** stop at the layer boundary. If blur or CA must affect 2D overlays too, render the 2D into the same pass (or accept that overlays stay sharp, which is usually right for copy).
- **HUD chrome** (corner labels, counters, progress bars) on a kinetic 3D piece draws the eye away from the motion. Leave it out.

## See also

- [pull-back-through-text.md](pull-back-through-text.md), [px-space-world.md](px-space-world.md)
- [../hosts/canvas-commons.md](../hosts/canvas-commons.md), [../hosts/hyperframes.md](../hosts/hyperframes.md)
