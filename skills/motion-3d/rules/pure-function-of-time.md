---
name: pure-function-of-time
description: Every rendered value is computed from t alone, so any frame can be seeked in any order. Lists what breaks that and the seek-safe replacement for each.
tags: [architecture, determinism, rendering]
---

# Every value from t alone

**Use when:** writing apply()/render(), adding particles, noise, accent envelopes, trails or post FX, or when a render differs from the preview.

## How it works

Renderers don't play your piece from start to end. Canvas Commons resets the scene and replays it when you seek backwards. HyperFrames seeks to arbitrary times and can split frame ranges across parallel browser workers. A frame that depends on the previous frame comes out wrong, or different on every run.

The test: render frame N right after a fresh load, then again after playing from 0. Both must be pixel-identical.

## What breaks it, and the replacement

| Breaks seeking | Seek-safe replacement |
|---|---|
| `Date.now()`, `performance.now()`, `clock.getDelta()` | the host's `t` |
| `requestAnimationFrame` / `setAnimationLoop` driving motion | render only when the host asks (begin-render event, seek event) |
| `x += v * dt`, physics stepped per frame | closed form `x(t)`, or a table precomputed at build time and indexed by t |
| `MathUtils.damp`, lerping toward last frame's value | a curve on the target value itself (OUT, GLIDE) |
| `Math.random()` at frame time | a seeded hash of (index, salt), computed at build |
| `mixer.update(delta)` | `mixer.setTime(t)` |
| afterimage / feedback / temporal-accumulation post passes | effects rebuilt from t (see [speed-driven-fx.md](speed-driven-fx.md)) |
| `composer.render()` with no delta (EffectComposer then reads a wall-clock timer), passes that add the delta to their own time (FilmPass) or count frames (GlitchPass) | `composer.render(0)`, and every time-dependent pass reads t from a uniform you set in apply() |
| CSS animations next to a WebGL layer (HyperFrames) | tween the same state the canvas reads |

## Recipe

Seeded randomness, organic drift and accent envelopes, all pure:

```ts
import {OUT} from './curves';                 // the motion-craft skill's curves asset
import {clamp01, smoothstep} from './depth';

const hash01 = (n: number) => {          // integer mix (Murmur3 finaliser), same n gives the same value
  let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const TAU = Math.PI * 2;
// Handheld drift: a few incommensurate sines, tiny amplitude. Same t, same pose.
const drift = (t: number, amp: number) => amp * (0.6 * Math.sin(TAU * 0.23 * t + 1.3) + 0.4 * Math.sin(TAU * 0.51 * t + 0.2));
// Accent envelope from a known moment t0: quick rise, OUT decay. A function of (t - t0), never of the last frame.
const pulse = (t: number, t0: number, rise = 0.05, decay = 0.22) =>
  t < t0 ? 0 : t < t0 + rise ? smoothstep(t0, t0 + rise, t) : 1 - OUT(clamp01((t - t0 - rise) / decay));
```

Velocity, for blur, streaks and speed FX, comes from the pure function, never from stored history:

```ts
const vel = (f: (t: number) => number, t: number, h = 1 / 240) => (f(t + h) - f(t - h)) / (2 * h);
const tail = positionAt(t - SHUTTER);   // a streak's tail is where the head was, computed, not remembered
```

Stepped values (typewriters, counters) use `Math.floor` of a tweened value. That keeps them pure and stepped, never an eased text lerp.

```ts
let painted = '';                                      // mirrors what the label canvas currently shows
// in apply():
const text = FULL.slice(0, Math.floor(state.chars));   // stepped, derived from t
if (text !== painted) { label.repaint(text); painted = text; }
```

## Pitfalls

- **Skipping work is fine, remembering motion is not.** It's safe to skip a write when the destination already holds the value (`camera.fov === s.fov`), or when a cache keyed purely by t-derived inputs says the result is unchanged (the painted string, the allocated buffer size). Whatever frame came before, the output is the same. Unsafe: skipping because "nothing moved last frame", or keeping a last position to integrate from.
- **Velocity from tween libraries.** GSAP can't tell you a property's value at an earlier time. Record each tween's segment (start, duration, from, to, ease) as you add it, or compute that channel from a pure function. See [../hosts/hyperframes.md](../hosts/hyperframes.md).
- **Async loads that land mid-render** change pixels between frames. Load everything before the first frame. See [../rendering/webgl.md](../rendering/webgl.md).
- **Grain and dither** must be reseeded from the frame index (`round(t * fps)`), not from a running counter.

## See also

- [state-apply-architecture.md](state-apply-architecture.md)
- [speed-driven-fx.md](speed-driven-fx.md)
- [../rendering/webgl.md](../rendering/webgl.md): readiness and history-dependent post passes

*Idea adapted from HyperFrames (Apache-2.0).*
