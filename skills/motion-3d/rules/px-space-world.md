---
name: px-space-world
description: Build the 3D world in screen pixels. Place the camera at (viewH/2)/tan(fov/2), so the z=0 plane maps 1:1 to the 2D layout and elements hand off between 2D and 3D without conversion.
tags: [camera, compositing, layout]
---

# Pixel-space world

**Use when:** 3D content must line up exactly with a 2D layout: glyphs that leave a 2D line and fly into depth, a 3D world behind a 2D portal, a 2D title that becomes 3D.

## How it works

Put a perspective camera on the +z axis, looking at the origin, at distance:

```
D = (viewH / 2) / tan(fov / 2)
```

At that distance, the z=0 plane is exactly one frame tall in world units. An object at z=0 with world size S projects to exactly S pixels. 2D coordinates transfer 1:1, with y flipped (screen y goes down, world y goes up):

```
world.x = screen.x - viewW / 2     world.y = -(screen.y - viewH / 2)     world.z = 0
```

Off the plane, perspective takes over. An object at depth z (positive = toward the camera) looks `D / (D − z)` times bigger, and that's the factor to animate when a glyph should fly at the viewer. If the camera dollies to `camZ`, the factor becomes `camZ / (camZ − z)`. Moving only `position.z` keeps the projection otherwise pixel-true.

## Recipe

```ts
import {pxDistance, apparentScale} from './depth';
const FOV = 50, W = 1920, H = 1080;
const D = pxDistance(H, FOV);
const camera = new THREE.PerspectiveCamera(FOV, W / H, 10, D + ROOM_DEPTH_PX * 2);  // near/far in px
camera.position.set(0, 0, D);
camera.lookAt(0, 0, 0);
scene.fog = new THREE.Fog(BG, D * 0.9, D * 3.2);  // fog distances as fractions of D

// Hand-off: a 2D glyph at (sx, sy) with ink height hPx becomes a 3D glyph of the same size.
glyph.position.set(sx - W / 2, -(sy - H / 2), 0);
glyph.scale.setScalar(hPx / glyphGeometryHeight);
// Flying toward the viewer: choose the on-screen size, solve for z.
const zForScale = (k: number) => D * (1 - 1 / k);   // inverse of apparentScale(D, z)
```

## Builders that don't animate themselves

A world builder (grid corridor, starfield, wireframe glyphs) returns the scene, the camera, the distance D and **setters** (`setGridOpacity(o)`, `setDotsTravel(zPx)`, `setGlyphPose(i, pose)`). It never runs its own loop or tween. The scene's single apply() calls the setters with values computed from t. A streaming starfield is pure, too: each dot's z is its seeded base plus a travel offset, wrapped modulo the corridor depth.

```ts
z = zBack + ((((baseZ - zBack + travel) % span) + span) % span);
```

## Values

| Parameter | Typical |
|---|---|
| fov | 40–50° (wider = stronger depth when glyphs fly) |
| near / far | 10 px / D + 2 × room depth |
| Fog | start ≈ 0.9 D, end ≈ 3.2 D, colour = background |
| Room depth behind z=0 | ≈ 3 × frame height |
| Extruded glyph depth | ≈ 25 % of glyph size |
| Wire line width (fat lines) | ≈ 2.5 px × supersample factor |

## Pitfalls

- **Forgetting the y flip.** Everything mirrors vertically on hand-off.
- **Fat-line resolution.** Line materials that take a `resolution` must get the drawing-buffer size, which is the frame times the supersample factor. Otherwise line widths come out wrong.
- **Near plane in world units of 0.1** in a pixel-sized world wastes depth precision. Scale near and far to pixels.
- **Rotating the camera** breaks the 1:1 mapping. Keep it frontal while hand-offs happen, and rotate objects instead.

## See also

- [compositing-3d-and-2d.md](compositing-3d-and-2d.md), [frame-by-fill.md](frame-by-fill.md)
- [../assets/depth.ts](../assets/depth.ts): `pxDistance`, `pxToWorld`, `apparentScale`
