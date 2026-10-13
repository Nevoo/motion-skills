---
name: effects-tied-to-motion
description: Blur, chromatic aberration, flashes and other post effects earn their place only when driven by motion; derive them from camera speed so they appear in whips and vanish at rest. Subtle speed effects on every whip, strong smear on 1–3 hero snaps.
tags: [effects, post, motion-blur, shaders]
---

# Effects tied to motion

**Use when:** adding post effects (zoom blur, motion blur, chromatic aberration, bloom, flashes, lens distortion), or deciding whether to.

## How it works

An effect with no cause reads as decoration. An exposure flash on every beat becomes a strobe; a constant colour fringe looks like a dirty lens. The same effect driven by motion reads as physics: the frame smears because it moved fast, the lens fringes because the camera whipped, far planes soften because they are far.

**Drive effects from a speed signal.** Measure the camera's speed from its own position function, normalise it over the piece, and scale every effect by it. Effects then appear during whips and are exactly zero at rest.

**Measure the speed the viewer sees.** Under a whole-frame time remap ([time-remap-ramps](time-remap-ramps.md)), on-screen speed is the action-time speed times the remap rate, |pos'(τ)|·r(t). Measure it from the composed function `cameraZ(warp.tau(t))`, so the slow-motion hang goes quiet and the snap after it smears.

**Light accents get one hero moment.** A flash, a bloom boost or a streak works once per piece, on the moment that matters (the logo lands, the camera punches through the final plane). Repeated, it becomes noise.

## Blur budget

Two tiers, the same split `motion-3d` uses:

- **Subtle, on every whip.** Speed-proportional effects (a light zoom blur, a faint colour fringe) may follow every fast camera move, because they scale with speed and fall to zero at rest. Keep them low enough that a paused frame from mid-whip still reads.
- **Strong, on 1–3 hero snaps per piece.** A heavy, visibly smeared blur is reserved for the few moves that should hit hardest: the slam into the logo, the single biggest whip, a scale punch, a fast spin.

One hero gate `hero(t)` blends between the tiers: 0 on ordinary whips, 1 inside a hero snap, with a smoothstep centred on each window edge (from 0.05s before the edge to 0.05s after) so the switch never pops. Each effect's level is `lerp(subtle, hero, hero(t))`, so the hero values are total levels, not amounts added on top.

Never blurred, in either tier:

- **Moves that barely travel between frames:** fades, colour shifts, slow drifts, parallax. When something moves less than its own width per frame, its smear stacks up inside its own outline and it just looks out of focus.
- **Type the viewer is reading right now.** If the move earns it, the words can smear on their way in, but they arrive crisp and stay crisp for as long as they are being read.

**Derive the smear, don't key it.** A smear's length is speed times shutter time. Compute it from the same speed signal instead of hand-keying a blur amount on each tween.

## Recipe

```ts
import {clamp01, lerp} from './curves';

// cameraZ(t): the camera position function. Speed is measured, then normalised.
const H = 1 / 240;
const vAt = (t: number) => Math.abs(cameraZ(t + H) - cameraZ(t - H)) / (2 * H);
let vMax = 0;
for (let t = 0; t <= DURATION; t += H) vMax = Math.max(vMax, vAt(t));
const speed = (t: number) => Math.pow(clamp01((vAt(t) - V_FLOOR) / (vMax - V_FLOOR)), SPEED_CURVE);

// Hero gate: 1 inside a hero snap's [start, end], 0 outside, smoothstep centred on each edge.
const E = 0.05;
const smoothstep = (a: number, b: number, v: number) => { const x = clamp01((v - a) / (b - a)); return x * x * (3 - 2 * x); };
const hero = (t: number) => Math.max(0, ...HERO_SNAPS.map(([a, b]: [number, number]) =>
  smoothstep(a - E, a + E, t) * (1 - smoothstep(b - E, b + E, t))));

// Per frame, every effect scales with the same signal; the gate picks the tier.
const fx = (t: number) => ({
  zoomBlur: lerp(ZOOM_SUBTLE, ZOOM_HERO, hero(t)) * speed(t),
  aberrationPx: CA_REST_PX + lerp(CA_SUBTLE_PX, CA_HERO_PX, hero(t)) * speed(t),
  smearWorld: vAt(t) * SHUTTER_S,         // world units; project to pixels in the renderer
});
```

With a time remap, `cameraZ` in this recipe is the composed `cameraZ(warp.tau(t))` and `vMax` is taken after the remap. `V_FLOOR` (the camera's cruise speed) keeps steady travel and slow drifts at zero; a `SPEED_CURVE` above 1 keeps medium moves clean so the effect peaks only in whips. `HERO_SNAPS` lists the one to three hero windows. Because everything is computed from t alone, it seeks correctly and renders the same in any frame order.

## Values

| effect | driven by | at rest |
|---|---|---|
| zoom or radial blur | camera speed × tier: ~0.025 on a whip, ~0.075 on a hero snap | 0 |
| chromatic aberration | camera speed × tier: up to ~2px on a whip, ~5.5px on a hero snap | ~0.45px |
| directional motion blur | element speed × shutter | 0 |
| depth soften | distance from the focal plane | focal plane sharp |
| flash or bloom boost | one hero event | 0 |
| FOV kick or barrel | a punch or crossing a plane | 0 |

Tuned starting points from a speed-driven 3D reel: speed exponent ~1.35 (higher keeps effects off longer); the speed floor set to the camera's constant cruise speed, so steady travel produces no effect; zoom blur totals ~0.025 on an ordinary whip and ~0.075 on a hero snap at peak speed; chromatic aberration is ~0.45px at rest plus up to ~2px on an ordinary whip or ~5.5px on a hero snap, measured at the frame corners; a shutter of one frame (1/60s at 60fps).

## Pitfalls

- **A flash on every beat.** Keep light accents to one hero moment.
- **Heavy blur on every whip.** The strong tier loses its punch; keep it to the hero snaps.
- **Blur keyed by hand per tween.** It drifts out of sync when timing changes; derive it from speed.
- **Effects that need previous-frame history** (feedback trails, temporal accumulation) in a seekable or parallel renderer. They differ when frames render out of order. Rebuild them from t.
- **Blurring a container that doesn't move.** Point the effect at what moves.
- **Speed measured in action time under a time remap.** The hang smears and the snap stays clean, the opposite of what the viewer sees. Include r(t).
- **An always-on grain or glitch layer.** Still decoration (no-hud-chrome).

## See also

- [no-hud-chrome](no-hud-chrome.md)
- [column-whip](column-whip.md): where speed peaks in a whip
- [kinetic-headlines](kinetic-headlines.md): type arrives crisp
- [time-remap-ramps](time-remap-ramps.md): on-screen speed under a time remap
- WebGL passes, supersampling and render setup: `motion-3d`.

*Idea adapted from HyperFrames (Apache-2.0).*
