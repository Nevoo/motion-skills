---
name: lighting-and-materials
description: Start unlit (MeshBasicMaterial, baked gradients). Move to matcap or standard materials with a simple light rig only when real geometry needs form. Covers colour space, tone mapping and lines.
tags: [materials, lighting, colour]
---

# Lighting and materials

**Use when:** choosing materials, or when the 3D looks either flat or muddy.

## How it works

The material decides whether lighting exists at all. Lit materials (`MeshStandardMaterial`, `MeshPhysicalMaterial`, Lambert, Phong) shade each pixel from lights and an environment, so their colour changes with angle and position. `MeshBasicMaterial` ignores lights and outputs its colour or texture unchanged. `MeshMatcapMaterial` reads its shading from an image indexed by the surface normal, so it looks lit without any light in the scene. Choose by what the content needs: exact colour (unlit), readable form without a rig (matcap), or physical surfaces (lit).

### Default: unlit

Typographic planes, cards and UI recreations use **`MeshBasicMaterial`** with the colour baked into the texture. Brand colours come out exactly as specified, nothing depends on light direction, and the piece costs almost nothing. Life comes from motion and tilt ([playful-tilt.md](playful-tilt.md)), not from shading.

### When to leave it

| Content | Material | Light |
|---|---|---|
| Type, cards, photos, UI | `MeshBasicMaterial` | none |
| Extruded logo, chunky 3D type, simple objects | `MeshMatcapMaterial` with a soft studio matcap | none; the matcap is the light, deterministic and cheap |
| Product-like objects, metal, glass | `MeshStandardMaterial` / `MeshPhysicalMaterial` | `HemisphereLight` (sky / ground) + one `DirectionalLight` key; environment map for reflections |
| Wireframes, grids, outlines | `LineBasicMaterial`; fat-line `LineMaterial` for widths above 1 px | none |
| Particles, dust | `PointsMaterial` or a small custom shader | none |

## Recipe (lit object, minimal rig)

```ts
renderer.outputColorSpace = THREE.SRGBColorSpace;   // the default since r152
renderer.toneMapping = THREE.NoToneMapping;          // brand colours stay exact; ACES only for photoreal scenes
scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x3a3f4a, 1.6));   // sky, ground, intensity
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(-2.5, 4, 3);
scene.add(key);
// Reflections without a light rig: a generated room environment.
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
```

Lights are state like everything else. If a light moves or changes intensity, apply() writes it from t.

## Colour space and tone mapping

- Textures that carry colour (labels, photos, matcaps) need `colorSpace = SRGBColorSpace`. Data textures (normal maps, noise) stay linear.
- `NoToneMapping` keeps flat colours exact. ACES and AgX tone mapping desaturate and shift brand hues. Use them only for photoreal lit scenes.
- One background colour for the whole piece. Switching from light to dark mid-piece is jarring, especially after a light intro.

## Fake light, cheaply

- **Gradient direction** in the baked texture (lighter top) reads as top light.
- **A sheen band** across a landing word for one hero moment.
- **Fake Lambert in a shader:** darken a turned plane by how far its normal faces away from the camera. Planes rotating on hinges (door splits) then read as lit, without real lights.

## Pitfalls

- **Shadows** cost a lot, alias at video resolution, and rarely help motion graphics. Skip them unless a shadow is the subject.
- **Lit materials on baked-gradient cards** turn white text grey and shift gradients. Keep cards unlit.
- **Fog with lit materials** needs `fog: true` (the default) on every material, including custom shaders that include the fog chunks.
- **Line widths.** `LineBasicMaterial` is always 1 px in WebGL. Use fat lines and set their resolution to the drawing-buffer size.

## See also

- [playful-tilt.md](playful-tilt.md), [text-as-texture.md](text-as-texture.md)
- [compositing-3d-and-2d.md](compositing-3d-and-2d.md)
