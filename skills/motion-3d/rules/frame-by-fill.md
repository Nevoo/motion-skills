---
name: frame-by-fill
description: Place the camera by how much of the frame an object should fill (distFor / distForW), not by a hand-picked Z.
tags: [camera, framing]
---

# Frame by fill fraction

**Use when:** deciding any camera distance: opening frame, punch-in, pull-back, landing on a word.

## How it works

For a perspective camera with vertical FOV `fov`, an object `h` world units tall fills a fraction `fill` of the frame height at distance:

```
d = h / fill / 2 / tan(fov / 2)
```

The same holds horizontally, with the frame's half-width `tan(fov / 2) * aspect`. Long words and wide cards bind on width, so frame them with `distForW`. Tall stacks bind on height, so use `distFor`. `distToFit` takes the larger of the two, so the object fits both ways.

The camera's Z is then `object.z + d`. A move becomes a statement of intent ("punch to 58 %", "pull back until the stack fills 82 %") instead of a number you re-tune every time a size changes.

## Recipe

```ts
import {distFor, distForW, distToFit} from './depth';
const FOV = 38, ASPECT = 16 / 9;

const openZ = WORDS[0].z + distFor(WORDS[0].h, 0.46, FOV);    // top card fills 46 % of the height
const allZ  = distFor(stackH, 0.82, FOV);                     // whole stack fills 82 %
const landZ = word.z + distForW(word.width, 0.84, FOV, ASPECT); // a hero word spans 84 % of the width
```

Measure word widths from the baked texture after fonts load, then calibrate once at build:

```ts
const D = words.map(w => distForW(w.width, w.fill, FOV, ASPECT)); // reading distance per word
```

When the camera never stops, set the reading distance at the moment the next move starts, not at a resting pose. With a constant creep summed under eased pushes from the first frame, that's `D[k]` minus a small margin (~0.2 units), so the word reads just inside its fill target as the next push begins.

## Values

| Shot | Fill | Axis |
|---|---|---|
| Opening on one card of a stack | 0.42–0.50 | height |
| Punch to the next card | 0.55–0.62, a touch more each step | height |
| Whole stack / pull-back reveal | 0.78–0.85 | height |
| Hero word, frame-filling kinetic type | 0.80–0.86 | width |
| Final title, settled | 0.60–0.70 | width |

## Pitfalls

- **Fill computed with the kicked FOV.** If a push widens the FOV mid-move, compute framing with the base FOV. The kick should be back to zero at the landing.
- **Line box vs ink box.** A label baked with padding is taller than its letters, so "fills 50 %" means the padded box. Bake with `box: 'ink'` ([../assets/makeLabelTexture.ts](../assets/makeLabelTexture.ts)) when the fill should refer to the glyphs.
- **Tilted or turned planes** project narrower than their width. Fill maths assumes frontal, so land frontal (straighten turns before the read).
- **Off-axis objects.** The formula frames an object centred on the view axis. Aim the target at the object's centre, or account for the offset.

## See also

- [camera-position-and-target.md](camera-position-and-target.md)
- [punch-through-stack.md](punch-through-stack.md)
- [px-space-world.md](px-space-world.md): the special distance where world units equal pixels
