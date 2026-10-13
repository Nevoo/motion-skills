---
name: drum-ratchet
description: A real 3D slot-machine drum of names that rotates with a ratchet. It slows on each name but never stops, driven by one eased position value.
tags: [list, rotation, typography]
---

# Ratcheting drum

**Use when:** cycling through several names, values or options in one spot ("built for: A → B → C"), where a vertical list would be too static and a swap would be a cut.

**Optional look, not a default.** The drum is a set piece, like [tunnel.md](tunnel.md), [door-split.md](door-split.md) and [path-through-depth.md](path-through-depth.md). A piece uses at most two, each chosen because the subject calls for it: here, one slot whose value keeps changing. A flight with no set piece is complete.

## How it works

The names sit around a cylinder whose axis is horizontal (x). Name `i` sits at angle `θᵢ = i·STEP − rot`, at radius R, facing outward. Only the front-facing names are visible: opacity follows `cos θ`, so names fade as they roll over the top or bottom edge.

The rotation `rot` comes from one value `s` (drum position, in names), via a **ratchet** function:

```
rot(s) = STEP · (s − k · sin(2πs) / (2π))
```

Its derivative is `STEP · (1 − k · cos(2πs))`. At every whole `s` (a name centred), the speed drops to `1 − k` of the average, then picks up between names. With `k < 1` the drum slows on each name but never stops, so it keeps the flow. `k = 1` would stop dead on every name.

Tween `s` once, from slightly before the first name to the last, with GLIDE. The ratchet supplies the per-name rhythm, so there are no per-name tweens.

## Recipe

```ts
const R = 1.3, STEP = 0.85, K = 0.7;
const ratchet = (s: number) => STEP * (s - (K * Math.sin(2 * Math.PI * s)) / (2 * Math.PI));
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const drum = new THREE.Group();
drum.rotation.y = -0.12;                      // slight yaw so the cylinder reads as 3D
const labels = NAMES.map(n => makeLabelPlane(n, 1.3, {align: 'left', ink: ACCENT}));
labels.forEach(l => drum.add(l.mesh));

// In apply():
const rot = ratchet(state.drumS);
labels.forEach((l, i) => {
  const th = i * STEP - rot;
  l.mesh.position.set(0, R * Math.sin(th), R * Math.cos(th));
  l.mesh.rotation.x = -th;                    // face outward from the axis
  l.material.opacity = clamp01((Math.cos(th) - 0.3) / 0.55) * state.drumIn;
});
// Timeline: drumS from -1.2 to NAMES.length - 1 over (N - 1) × 0.24 s + lead-in, GLIDE.
```

A static lead label ("built for") sits to the left of the drum's front face at the same depth, right-aligned, so the rolling names complete its sentence.

## Values

| Parameter | Value |
|---|---|
| Radius R | ≈ 1 × label height |
| STEP (angle between names) | 0.75–0.9 rad |
| k (ratchet strength) | 0.6–0.8 (speed on a name = 1 − k of average) |
| Time per name | 0.2–0.3 s |
| Visible band | cos θ from 0.3 (invisible) to 0.85 (full) |
| Drum yaw | 0.1–0.15 rad |

## Pitfalls

- **k ≥ 1.** At k = 1 the drum stops on every name. Above 1 it runs backwards between names.
- **Per-name tweens** (rotate, wait, rotate) stop between names and read as a slideshow inside the shot.
- **Back faces.** Names past ±90° are mirrored. The opacity band must reach 0 before cos θ does.
- **Left-aligned labels rotating around their centre.** Anchor the geometry at the text's left edge, so names line up on the lead label's baseline.

## See also

- [tunnel.md](tunnel.md), [flight-paths.md](flight-paths.md)
- [text-as-texture.md](text-as-texture.md)
