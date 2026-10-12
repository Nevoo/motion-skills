---
name: sticker-vs-depth-layering
description: Choose per group between sticker layering (paint order decides, depthTest off) and true depth occlusion (depthTest on). Mixing them by accident causes flicker and wrong overlaps.
tags: [layering, materials, depth]
---

# Sticker layering vs true depth

**Use when:** flat planes overlap or intersect: stacked cards, letters, labels near other geometry, planes the camera flies through.

## How it works

three.js draws opaque objects first, front to back, with the depth buffer. It then draws transparent objects sorted by `renderOrder`, then by distance from the camera (far to near). Every material with `opacity < 1` or a texture with alpha should be `transparent: true`, so most motion-graphics planes land in the second group. From there, you pick one of two modes.

**Sticker layering:** `depthTest: false, depthWrite: false`, plus an explicit `renderOrder`.

- Paint order alone decides who is on top, like cut paper.
- Intersecting or co-planar cards never z-fight, and a turned stack never flickers.
- Use it for stacked cards, letters of one word, labels and anything the camera flies through.

**True depth:** depth test and write on.

- Real occlusion: a card behind a cube is hidden by it, and intersecting planes cut each other.
- Use it for real geometry (extruded logos, products, rooms) and for anything that must hide behind something else from some angles.

## Recipe

```ts
// Sticker group: explicit order. Higher draws later, so it sits on top.
cards.forEach((m, i) => {
  m.material.depthTest = false;
  m.material.depthWrite = false;
  m.renderOrder = i;
});

// Many words along a flight: nearer words on top, letters in reading order within a word.
words.forEach((w, k) => w.letters.forEach((m, j) => (m.renderOrder = 1000 - k * 40 + j)));

// True-depth group: defaults, plus a small z gap between co-planar pieces.
logo.traverse(o => { if ((o as THREE.Mesh).isMesh) o.renderOrder = 0; });
```

`makeLabelPlane` takes `layering: 'sticker' | 'depth'` ([../assets/makeLabelTexture.ts](../assets/makeLabelTexture.ts)).

## Pitfalls

- **Mixing modes within one overlapping group.** Sticker planes draw over depth-tested geometry regardless of distance, so a far sticker can appear in front of a near cube. Keep each overlapping group in one mode. Mix only between groups that never overlap on screen.
- **Relying on automatic distance sorting** for planes at similar depths. three.js sorts by object centre, so two overlapping cards can swap order mid-turn. Use explicit `renderOrder`.
- **Depth-tested transparent planes** write depth and hide what's drawn after them, even where they're transparent (the square halo around text). Use sticker mode, or `alphaTest` for cut-out shapes.
- **Background planes.** A full-frame backdrop in sticker mode needs the lowest `renderOrder` (e.g. −20), or it paints over everything.

## See also

- [stacked-gradient-cards.md](stacked-gradient-cards.md), [depth-dissolve.md](depth-dissolve.md)
- [compositing-3d-and-2d.md](compositing-3d-and-2d.md): layering across the 2D/3D boundary
