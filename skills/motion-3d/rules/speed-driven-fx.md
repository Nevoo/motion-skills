---
name: speed-driven-fx
description: Tie post FX (zoom blur, chromatic aberration, FOV kick, streaks) to the camera's normalised speed, so they appear only during whips and vanish at every landing. Covers blur discipline and seek-safe trails.
tags: [fx, post, camera, blur]
---

# Speed-driven FX

**Use when:** a flight or a set of punches needs a sense of velocity, and you're tempted to add blur, glow or flashes.

## How it works

Effects earn their place only when they're tied to motion. Compute one number, the camera's **normalised speed** `v(t)` in 0..1, and let it drive every speed effect. The effects then rise during whips and fall to zero as the camera decelerates into each landing, so the copy is always sharp when it's read. No per-beat keyframes and no exposure flashes: the motion itself authors the FX.

```ts
import {normalisedSpeed} from './camera-path';
// floor = cruise speed (a constant creep summed under the eased moves), so FX stay off while cruising.
const speed = normalisedSpeed(path, {floor: CRUISE, curve: 1.35});
```

For a camera built from tweens rather than keys, sample its pure position function with a central difference and normalise by the maximum over the piece. See [pure-function-of-time.md](pure-function-of-time.md).

## Recipe: what the speed drives

```ts
// The 1–3 snaps allowed a strong smear; every other whip stays at the subtle level.
const HERO_LEGS: Array<[number, number]> = [[4.1, 4.55]];
const hero = (t: number) => Math.max(0, ...HERO_LEGS.map(([a, b]) =>
  smoothstep(a - 0.05, a + 0.05, t) * (1 - smoothstep(b - 0.05, b + 0.05, t))));

// In apply()/render(), all pure in t:
const v = speed(t), h = hero(t);
lens.uniforms.uZoom.value = lerp(0.025, 0.075, h) * v;     // radial zoom blur length
lens.uniforms.uCaPx.value = 0.45 + lerp(2, 5.5, h) * v;    // chromatic offset at the corners, px
lens.uniforms.uTaps.value = v > 0.004 ? 10 : 1;            // skip the loop when still
lens.uniforms.uFrame.value = Math.round(t * FPS);          // jitter and grain reseeded per frame, not per call
```

A lens pass (own shader; radial taps toward the centre, red and blue split outward):

```glsl
uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uZoom, uCaPx, uFrame; uniform int uTaps;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 d = vUv - 0.5;
  float r = length(d * uRes) / length(0.5 * uRes);          // 0 centre .. 1 corner
  float fall = smoothstep(0.1, 0.75, r);                     // the centre stays sharp
  vec2 ca = normalize(d * uRes + 1e-6) * uCaPx * r * r / uRes;
  float jit = hash(gl_FragCoord.xy + uFrame);
  vec3 col = vec3(0.0); float wsum = 0.0;
  for (int i = 0; i < 16; i++) {
    if (i >= uTaps) break;
    float f = (float(i) + jit) / float(uTaps);
    float k = 1.0 - uZoom * fall * f; float w = 1.0 - 0.5 * f;
    vec2 q = 0.5 + d * k;
    col += vec3(texture2D(tDiffuse, q + ca * k).r, texture2D(tDiffuse, q).g, texture2D(tDiffuse, q - ca * k).b) * w;
    wsum += w;
  }
  gl_FragColor = vec4(col / wsum, 1.0);   // opaque; carry .a too if the buffer must stay transparent
}
```

Chain: `RenderPass` → this `ShaderPass` → `OutputPass`, all at the supersampled buffer size. In Canvas Commons, pass the composer to the bridge node's `composer` prop ([../assets/Three.ts](../assets/Three.ts)).

**Time reaches passes only through uniforms.** Render with `composer.render(0)`: with no argument, EffectComposer measures wall-clock time between calls and hands that delta to every pass. Any pass that changes over time (grain, jitter, a sweep) reads t or the frame index from a uniform you set in apply(), as `uFrame` does above. Stock passes that add the delta to their own time (FilmPass) or keep counters (GlitchPass) are history-dependent: set their time uniform from t yourself every frame, or replace them.

**Lens-side whoosh.** During each push, kick the FOV by +5–8° (up over the first 45 % with IN_OUT, back over the rest with OUT) and bank the roll ±0.04 rad, alternating sign. It's the 3D counterpart of a 2D scale dip (1 → 0.9 → 1) during a whip.

**Streaks and trails, pure.** A particle's tail is its head position at `t − 1/60`, computed. For letters, draw two or three echo copies at `t − k/240` with opacities around 0.16 / 0.09 / 0.05 (see [door-split.md](door-split.md)).

## Blur discipline

- **Two levels.** Speed-proportional FX may follow every whip, but only at a subtle level that reads as lens character, not smear. The strong, visibly smeared level is reserved for one to three hero snaps per piece: the biggest whip, a slam, a spin. Gate it with a per-leg weight computed from t alone (`hero(t)` above).
- Smear only moves that hit hard and fast: whips, punches, slams, spins.
- Never blur a fade, a slow drift, or text at the moment it's read. The smear belongs to the travel into a read. The read itself is crisp.
- Light accents (a sheen, a bloom pop, a streak flare) go to one hero moment. A flash on every beat reads as distracting noise.
- No HUD chrome as "detail". The detail lives in the motion itself: speed, lens, depth.

Levels for the lens pass above, at speed 1, with a 1920×1080 output. Hero is the peak tuned in a finished piece. Subtle is a starting point of about a third of it, to tune on the live panel.

| Level | uZoom | Smear at side edges / corners | uCaPx (corners) | Budget |
|---|---|---|---|---|
| Subtle | ≈ 0.025 | ≈ 24 px / 28 px | 0.45 + ≈ 2 px | every whip |
| Hero | 0.075 | ≈ 72 px / 83 px | 0.45 + 5.5 px | 1–3 per piece |

The centre stays sharp at both levels (`fall` is 0 inside 10 % of the half-diagonal), and the smear shrinks toward the top and bottom edge middles (≈ 9 / 26 px).

## Pitfalls

- **History-based motion blur** (afterimage, accumulation, previous-frame buffers) breaks seeking and parallel rendering. Use the zoom blur and pure trails above.
- **FX on a constant cruise.** Without a speed floor, a creeping camera keeps a permanent haze. Set `floor` to the cruise speed.
- **Normalising per section.** Use one maximum for the whole piece, so a gentle leg reads gentler than the big whip.

## See also

- [flight-paths.md](flight-paths.md), [../rendering/webgl.md](../rendering/webgl.md)
- The `motion-craft` skill: effects and blur discipline as a general rule

*Idea adapted from HyperFrames (Apache-2.0).*
