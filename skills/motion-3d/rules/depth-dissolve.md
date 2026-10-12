---
name: depth-dissolve
description: Fade every plane by its depth along the camera's view axis. Near the lens it dissolves, far away it fades into fog, so flying through a plane reads as punching through it.
tags: [depth, flight, fade]
---

# Depth dissolve

**Use when:** the camera flies through or past planes (words, cards, photos) in a continuous flight, and they must clear out of the way without cuts or authored fade-outs.

## How it works

Each frame, apply() measures each object's **view depth**: the distance from the lens along the camera's forward axis. It then multiplies the object's own entrance opacity by a depth fade:

- **Near fade:** 0 at or behind the lens, ramping to 1 a short distance ahead. As the camera approaches a plane, the plane grows huge and dissolves just before it would fill the screen. The viewer reads that as passing through it.
- **Far fade (optional):** fully visible up to a distance, then fading out. Distant sections stay quiet until the camera gets close, like fog that works over any background.

Because the fade comes from the camera pose, it's automatic, seek-safe and consistent. Retime the flight and the dissolves follow.

## Recipe

```ts
import {depthFade, viewDepth} from './depth';
const fadeables: Array<{obj: THREE.Object3D; mats: THREE.Material[]; vis: (depth: number) => number}> = [];
const wp = new THREE.Vector3(), fwd = new THREE.Vector3();

// In apply(), AFTER the camera is written and camera.updateMatrixWorld() has run:
camera.getWorldDirection(fwd);
for (const f of fadeables) {
  f.obj.getWorldPosition(wp);
  const d = viewDepth(wp, camera.position, fwd);
  const o = f.vis(d) * depthFade(d, {nearStart: 0.5, nearEnd: 2.3, farStart: 16, farEnd: 26});
  f.obj.visible = o > 0.003;
  for (const m of f.mats) m.opacity = o;
}
```

`vis(depth)` is the object's own visibility: its entrance value, a section switch, or a window (see [tunnel.md](tunnel.md)). Register every faded object once at build. Objects that should survive a final pull-back get a flag that exempts them from a "clear everything else" value.

## Fog vs opacity

| Approach | Works when | Watch out |
|---|---|---|
| Opacity depth fade (above) | any background, sticker layering, 2D layers below | needs `transparent: true` on every faded material |
| `scene.fog = new THREE.Fog(bg, near, far)` | solid background of exactly the fog colour | blends toward a colour, not toward transparent, so it's wrong over gradients or 2D layers |

The two combine well: fog for far atmosphere, an opacity near fade for the pass-through.

## Depth soften (optional)

Planes far behind the focus can soften by biasing the texture's mip level with distance. Sample with `texture2D(map, uv, bias)`, with `bias = maxBias * smoothstep(focus + near, focus + far, depth)`. It's cheap, seek-safe and needs no blur pass. Keep the bias at or below ~1.7, and keep the reading plane sharp.

## Values

| Parameter | Range (world ≈ word height 1–1.3) |
|---|---|
| nearStart / nearEnd | 0.35–0.5 / 1.6–2.3 |
| farStart / farEnd | 16 / 26, or fog 5 → 20 on a dark background |

## Pitfalls

- **Euclidean distance instead of view depth.** Objects off to the side at the same distance fade differently from centred ones, and a plane beside the lens can vanish while still on screen. Use the dot product with the forward axis.
- **Fading before the camera pose is final.** Write the camera, call `updateMatrixWorld()`, then compute fades. Otherwise fades lag one frame and break seeking.
- **Objects behind the lens with positive opacity** flash for a frame when the near plane is tiny. The near fade must be 0 at or behind the lens.
- **Two writers of opacity** (entrance code and fade code). Compose them in one expression.

## See also

- [flight-paths.md](flight-paths.md), [door-split.md](door-split.md)
- [sticker-vs-depth-layering.md](sticker-vs-depth-layering.md)
