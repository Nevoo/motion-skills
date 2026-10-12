---
name: text-as-texture
description: Put type into three.js by baking it big into a CanvasTexture with mipmaps, sRGB and anisotropy, on a plane sized from the texture's aspect. Includes per-letter atlases and when to use geometry text instead.
tags: [typography, textures, fonts]
---

# Text as texture

**Use when:** any readable type lives in the 3D scene.

## How it works

three.js has no text primitive. For motion graphics the reliable route is a 2D canvas: draw the text with the browser's own font engine, wrap the canvas in a `CanvasTexture`, and map it onto a `PlaneGeometry` whose aspect matches the canvas. It's deterministic, fast, uses any webfont and any CSS colour or gradient, and it's readable at any distance if you get five settings right:

1. **Bake big.** A 300–400 px font size, regardless of the on-screen size. The GPU scales down cleanly, never up.
2. **Mipmaps:** `minFilter = LinearMipmapLinearFilter`, `magFilter = LinearFilter`. Without them, scaled-down text shimmers.
3. **Anisotropy** 8, or `renderer.capabilities.getMaxAnisotropy()`, keeps tilted text sharp at grazing angles.
4. **`colorSpace = SRGBColorSpace`,** so hex colours render as specified (otherwise they look washed out or dark).
5. **Plane sized from the aspect:** `PlaneGeometry(h * aspect, h)`. Text never stretches, and `h` is the world height you frame with.

## Recipe

```ts
import {loadFonts, makeLabelPlane, makeLabelTexture} from './makeLabelTexture';

await loadFonts(['700 100px "Inter"', '500 100px "IBM Plex Mono"']);  // every face and weight you use
const title = makeLabelPlane('Ship it.', 1.3, {
  fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 700,
  ink: '#ffffff', tracking: -0.04, align: 'left',
});
const typed = makeLabelTexture('', {sizeText: 'designer · writer', fontWeight: 500}); // reserve width
typed.repaint('designer'.slice(0, n));                                               // typewriter step
```

Where you can't `await` before building (a Canvas Commons scene generator), build anyway. The asset repaints when the font lands, and rebuilds the plane if the measured width changed. Your harness must still wait for fonts before frame 0. See [../rendering/webgl.md](../rendering/webgl.md).

## Per-letter atlas (letters that move independently)

For per-letter pops, door splits or swarms, bake each glyph into one shared atlas canvas: measure each glyph's ink box, pack them in rows with padding of at least 16 px (mipmaps bleed), and give each letter its own small plane. Its UVs point at its cell, and its position is its offset from the word centre. One texture serves the whole word, with one plane per letter.

```ts
// Cell in atlas px: (ax, ay, cw, ch). UV v runs bottom-up, canvas y runs top-down.
const u0 = ax / AW, u1 = (ax + cw) / AW, vTop = 1 - ay / AH, vBot = 1 - (ay + ch) / AH;
const geo = new THREE.PlaneGeometry(cell.w, cell.h);   // vertices: TL, TR, BL, BR
geo.setAttribute('uv', new THREE.Float32BufferAttribute([u0, vTop, u1, vTop, u0, vBot, u1, vBot], 2));
```

## When to use geometry text instead

| Need | Use |
|---|---|
| Readable type, gradients, any webfont | canvas texture (this rule) |
| Extruded letters with real sides, or wireframe edge outlines | `TextGeometry` from a typeface JSON, `EdgesGeometry` for outlines |
| Huge amounts of changing text | SDF text libraries. Their glyph loading is asynchronous, so gate the first frame on their ready callback |

## Pitfalls

- **Canvas wider than the GPU limit** (often 4096–16384 px) fails silently or blurs. Long strings at 300 px hit this, so `makeLabelTexture` scales the bake down to `maxTexturePx`.
- **Fallback face baked into the texture** because the webfont wasn't loaded. Load fonts first, and repaint on ready.
- **Resizing the canvas after first upload** without reallocating the GPU texture. Dispose the texture so three.js uploads it at the new size.
- **Letter spacing** comes from `ctx.letterSpacing` (in px). Measure with it set, or widths won't match.

## See also

- [stacked-gradient-cards.md](stacked-gradient-cards.md), [door-split.md](door-split.md)
- [frame-by-fill.md](frame-by-fill.md): line box vs ink box when framing
