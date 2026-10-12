---
name: depth-pop
description: Entrance where an element rushes forward from behind its rest depth while growing and fading in, driven by one 0→1 value. It reads as 3D arrival, not a flat fade.
tags: [entrance, depth, typography]
---

# Depth-pop entrance

**Use when:** words, cards or objects appear in a 3D scene, especially along a camera path.

## How it works

One entrance value `a` (0 → 1) per element drives four things at once:

- **z:** the element starts `travel` units behind its rest depth and rushes forward to it;
- **scale:** it grows from `s0` to 1;
- **opacity:** it fades in slightly ahead of the move, so it's solid before it lands;
- **rotation (optional):** an extra lean unwinds to the rest angle. See [playful-tilt.md](playful-tilt.md).

The z-rush is what sells depth. Perspective magnifies the element as it approaches, so the eye reads "flew toward me", which a flat scale-up never gives.

## Recipe

```ts
// In apply(): a = state.appear[i] (tweened 0 → 1 with OUT), base = rest position.
function depthPop(obj: THREE.Object3D, mat: THREE.Material, a: number, base: THREE.Vector3,
                  travel = 0.95, s0 = 0.55, fadeLead = 1.4) {
  obj.visible = a > 0.001;
  obj.position.set(base.x, base.y, base.z - travel * (1 - a));
  obj.scale.setScalar(s0 + (1 - s0) * a);
  mat.opacity = Math.min(1, a * fadeLead);   // multiply by any depth fade here
}
```

Tween `a` with OUT (decisive arrival, long settle). Canvas Commons: `appear[i](1, 0.34, OUT)`. HyperFrames: `tl.fromTo(state.appear, {[i]: 0}, {[i]: 1, duration: 0.34, ease: OUT, immediateRender: false}, at)`.

**Sync with the camera.** Start the pop a beat after the camera move toward the element starts (≈0.06 s), so both arrive together. A pop that finishes before the camera arrives looks pre-placed. One that starts after looks late.

**Per letter.** For per-letter planes, stagger each letter's `a` by 0.018–0.022 s, and alternate the extra lean's sign by letter index.

## Values

| Parameter | Small cards / type (world h ≈ 1) | Big flight words (h ≈ 1–1.3, far apart) |
|---|---|---|
| travel | 0.95–1.2 | 1.6–6 |
| s0 | 0.55–0.7 | 0.7–0.8 |
| fadeLead | 1.4–2 | 1.5 |
| duration | 0.34–0.42 s | 0.42–0.55 s |
| stagger | 0.05–0.1 s per element | 0.018–0.022 s per letter |

## Pitfalls

- **Fading only.** Opacity without the z-rush reads as 2D, whatever the camera does.
- **Travel toward the camera on a plane it's about to pass.** Large travel can push the element through the near plane. Keep `base.z - travel` behind it.
- **Opacity owned twice.** If depth fades also write opacity, compute `entrance × depthFade` in one place. See [depth-dissolve.md](depth-dissolve.md).
- **Linear tweens on `a`.** They make the arrival mechanical. OUT is the default. IN_OUT works only for letters that "solidify" in sequence.

## See also

- [punch-through-stack.md](punch-through-stack.md): pops synced to camera punches
- [playful-tilt.md](playful-tilt.md)
- [depth-dissolve.md](depth-dissolve.md)
