---
name: stacked-gradient-cards
description: A vertical stack of word cards, each with its own vertical gradient, slightly overlapping and at slightly different depths. The base object for 3D kinetic counts and wordmarks.
tags: [typography, layout, stack]
---

# Stacked gradient cards

**Use when:** a few short words should read as a set of playful physical objects (counts, taglines, wordmarks) rather than a flat list.

## How it works

Each card is a plane carrying a baked pill (rounded stadium; a circle for one- or two-letter words) with white text and its **own** top-to-bottom gradient. Cards stack top to bottom with a small overlap, then the stack is re-centred on the origin so the camera maths stays simple.

Distinct gradients do three jobs. They separate overlapping cards, they give each word a personality, and they act as "lighting" without any lights. Lighter at the top and deeper at the bottom reads as lit from above.

## Recipe

```ts
interface Card { text: string; h: number; z: number; angleDeg: number; top: string; bottom: string; }
const CARDS: Card[] = [
  {text: 'one',   h: 0.92, z: -0.06, angleDeg: -5, top: '#A78BFA', bottom: '#6D28D9'},
  {text: 'two',   h: 1.00, z:  0.00, angleDeg:  4, top: '#38BDF8', bottom: '#1D4ED8'},
  {text: 'three', h: 1.08, z: -0.05, angleDeg: -4, top: '#FB7185', bottom: '#EA580C'},
];
const OVERLAP = 0.12;

// Centres top to bottom, then re-centre the whole stack on y = 0.
const c: number[] = [];
CARDS.forEach((k, i) => c.push(i === 0 ? 0 : c[i - 1] - (CARDS[i - 1].h / 2 + k.h / 2 - OVERLAP)));
const topEdge = c[0] + CARDS[0].h / 2;
const botEdge = c[c.length - 1] - CARDS[CARDS.length - 1].h / 2;
const Y = c.map(v => v - (topEdge + botEdge) / 2);
const stackH = topEdge - botEdge;

const group = new THREE.Group();
const meshes = CARDS.map((k, i) => {
  const {mesh} = makeLabelPlane(k.text, k.h, {
    fontWeight: 800, pill: [k.top, k.bottom], ink: '#FFFFFF', minAspect: 1,
  });
  mesh.position.set(0, Y[i], k.z);
  mesh.rotation.z = k.angleDeg * THREE.MathUtils.DEG2RAD;
  mesh.renderOrder = i;            // sticker layering: lower cards paint over upper ones
  group.add(mesh);
  return mesh;
});
```

`makeLabelPlane` is in [../assets/makeLabelTexture.ts](../assets/makeLabelTexture.ts). It bakes big, with mipmaps, and repaints when the webfont lands.

## Values

| Parameter | Range |
|---|---|
| Card heights | 0.9–1.1, growing slightly down the stack |
| Overlap | 10–15 % of card height |
| z offsets | −0.06…0 (just enough parallax under a turn, no visible gap) |
| In-plane tilt | ±4–5°, alternating sign |
| Gradient | same hue family, top 15–25 % lighter than bottom; neighbours in different hues |
| Pill padding | ~0.42 em horizontal, ~0.33 em vertical; min aspect 1 |

## Pitfalls

- **One gradient for all cards** flattens the stack into a single shape where cards overlap.
- **Real depth testing on overlapping cards** causes z-fighting and sorting flicker under turns. Use sticker layering with an explicit `renderOrder`. See [sticker-vs-depth-layering.md](sticker-vs-depth-layering.md).
- **Baking at display size** gives soft edges and shimmer. Bake at ~300–360 px font size whatever the on-screen size.
- **Contrast.** White text needs the gradient's lightest stop to stay dark enough (WCAG large-text ≥ 3:1). Check the top stop, not the average.

## See also

- [punch-through-stack.md](punch-through-stack.md), [playful-tilt.md](playful-tilt.md)
- [text-as-texture.md](text-as-texture.md)
