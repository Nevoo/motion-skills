---
name: flight-paths
description: One continuous camera flight that never rests. Kinetic pieces (reels, launches, hype, identity) fly baked landings joined by ramped legs over a constant drift (legs.ts); calm pieces (explainers, ambient) use the monotone keyed spline (camera-path.ts).
tags: [camera, flight, continuity, speed-ramp]
---

# Continuous flight paths

**Use when:** a piece should feel like one move through one space, not a slideshow of stops.

## How it works

Stop, show, whip, stop reads as a slideshow, even with good whips. The camera never rests: content pops in along the path, and the camera flies through planes instead of cutting to them. Two constructions do that. Pick by the piece's register (`motion-craft` → `rules/reel-pacing.md`).

| register | construction | asset | peak ÷ average speed of one leg, measured |
|---|---|---|---|
| kinetic: reels, launches, hype, identity | baked landings + ramped legs over a constant drift | [legs.ts](../assets/legs.ts) `legPath` | RAMP 6.2–6.7×, RAMP_LONG 7.2–7.7×, IN_OUT 2.7–2.9× |
| calm: explainers, ambient | monotone keyed spline through arrive and drift keys | [camera-path.ts](../assets/camera-path.ts) `cameraPath` | 1.43–1.44× |

**Why the spline can't whip.** PCHIP gives every key a slope blended from its neighbours, so each leg is a smooth hump. On the calm recipe below it peaks at 1.43× its average speed (0.8 s leg) and 1.44× (1.75 s leg). A RAMP leg over the same poses, duration and drift peaks at 6.2×, and the bare RAMP curve at 6.7×. The speed-ramp rules (`motion-craft` → `rules/speed-ramps.md`) never reach a spline camera, and more keys only make it rounder. Observed failure: a reel flown on a correctly keyed spline read as a polite, hovering flight.

**The kinetic construction.** Landing k is a baked pose `A_k = {pos, tgt}` reached at `t_k`, with a drift velocity `v_k` that moves position and target together, so the read stays frontal.

- Hold at landing k: `p(t) = A_k + v_k·(t − t_k)`.
- Leg k → k+1 over `[t0, t1]`, ending on landing k+1: `p(t) = lerp(A_k + v_k·(t − t_k), A_k+1 + v_k+1·(t − t1), e)` with `e = C(seg(t, t0, t1 − t0))`. The target follows the same formula.
- An **arc** leg interpolates the offset `pos − tgt` in spherical coordinates (azimuth, elevation, distance), so the camera orbits instead of cutting the chord.
- Roll and FOV kick are bumps on the eased progress, `peak · 4e(1 − e)`: zero at both ends, highest at the whip.

**Leg curves.** At both ends of a leg the velocity is exactly the drift, provided the curve has zero slope there, and the camera never passes a landing, provided the curve stays within 0..1. `legPath` accepts RAMP, RAMP_LONG, IN_OUT and DRAG (a follower's curve, rarely a camera's) on any leg. GLIDE leaves at 0.4× the leg's average speed, so it fits only leg 0 when the camera moves from the first frame, where a start slope up to 1 is allowed. `legPath` throws on everything else: OUT (leaves at 6.25×), BOUNCE (overshoots), ACCEL (never settles), and GLIDE on any other leg.

**The read pause ends when the camera visibly moves.** A ramped leg lingers before it travels. It reaches 15 % of its own peak speed, the `auditTiming` threshold, about 0.36 of its duration in on RAMP, 0.40 on RAMP_LONG and 0.18 on IN_OUT, and later when another leg is faster. That linger is part of the read pause, which ends within 0.3 s of the last word. So a 0.4 s punch leaves 0–0.1 s after the last word, a 0.75 s whip as it lands, and the 1.15 s reveal about 0.2 s before it, while the last words still build. The recipe below audits at read gaps of 0.27 s and 0.24 s.

## Recipe: kinetic

```ts
import {GLIDE, RAMP, RAMP_LONG} from './curves';   // the motion-craft skill's assets/curves.ts
import {legPath} from './legs';
import {applyCamera, findStops} from './camera-path';
import {auditTiming, formatTimingAudit} from './timing-audit';

const D = 0.3;
const path = legPath([
  {t: 0,    pos: [0, 0.4, 12],    tgt: [0, 0, 0],       drift: [0, 0, -D]},
  {t: 1.4,  pos: [0, 0, 6],       tgt: [0, 0, 0],       drift: [D, 0, 0]},   // next leg pulls back: drift sideways
  {t: 2.75, pos: [5, 1.5, 7],     tgt: [0, 0, -2],      drift: [D, 0, -D]},
  {t: 3.4,  pos: [3.5, 0.5, 4.5], tgt: [1.5, -0.5, -5], drift: [0, 0, -D]},
], [
  {dur: 1.4,  curve: GLIDE},
  {dur: 1.15, curve: RAMP_LONG, arc: true, roll: -0.05},   // leaves at 1.6, 0.25 s before read 1's last word
  {dur: 0.4,  curve: RAMP, roll: 0.04, fov: 4},            // leaves at 3.0, 0.1 s after read 2's last word
], {fov: 38, end: 5.2});
console.assert(findStops(path, {minSpeed: D / 2, hz: 1000}).length === 0);
const audit = auditTiming({
  end: path.end, camera: path,
  copy: [{name: 'read 1', from: 0.65, to: 1.85}, {name: 'read 2', from: 2.45, to: 2.9}, {name: 'lockup', from: 3.3, to: 3.8}],
  reads: [{name: 'read 1', lastWordAt: 1.85}, {name: 'read 2', lastWordAt: 2.9}],
  exempt: [{from: 3.8, to: 5.2, why: 'final lockup hold'}],
});
console.assert(audit.ok, formatTimingAudit(audit));
// apply(): applyCamera(camera, path.at(t)); a word keyed to leg 2 reads path.progress(2, t)
```

The poses come from [landing-poses-baked.md](landing-poses-baked.md), each at its fill fraction ([frame-by-fill.md](frame-by-fill.md)). Write the leg plan first ([vary-the-leg.md](vary-the-leg.md)). A straight run through words on one axis (a creep under pushes) is the same construction: equal drift on every landing, RAMP legs, each landing at the next word's reading distance.

## Recipe: calm

```ts
import {cameraPath, findStops, sectionTimes} from './camera-path';

const INTRO = 1.0;
const [A, B] = sectionTimes(INTRO, [{fly: 1.75, drift: 0.5}, {fly: 0.8, drift: 0.55}]);
const path = cameraPath([
  {t: 0,             pos: [-3.4, 0.5, 8.8],  tgt: [-0.9, 0.1, 0], roll: 0, fov: 38},
  {t: INTRO,         pos: [0.8, -0.15, 8.0], tgt: [0.1, 0, 0],    roll: 0},
  {t: INTRO + 0.875, roll: -0.35},
  {t: A.arrive,      pos: [0, 0, -14.8],     tgt: [0, 0, -22.4],  roll: 0},
  {t: A.leave,       pos: [0, 0, -15.3],     tgt: [0, 0, -23.0]},
  {t: B.arrive,      pos: [0.9, 0.3, -24.5], tgt: [0.6, 0, -34]},
  {t: B.leave,       pos: [1.15, 0.35, -25.0], tgt: [0.75, 0, -34.4]},
]);
console.assert(findStops(path, {minSpeed: 0.05}).length === 0);
```

Each section has an *arrive* key, where it reads, and a *leave* key a few tenths of a unit further in the direction of travel. PCHIP keeps velocity continuous and never overshoots a key, so the camera eases into the section and glides on. A key whose value is a local extreme gets zero slope in that channel, so keep at least one position channel moving the same way through every key.

## Values

| Part | Kinetic (legs.ts) | Calm (camera-path.ts) |
|---|---|---|
| Leg | punch ≈ 0.4 s; whip 0.7–0.9 s; the one reveal up to ≈ 1.15 s. Exception: a tunnel leg, read during the flight, replaces the reveal at 1.5–2 s ([tunnel.md](tunnel.md)) | 0.8–1.75 s |
| Curve | RAMP; RAMP_LONG for the reveal or a long pan; IN_OUT for a soft reposition; GLIDE on leg 0 from the first frame only | the spline |
| Hold on a landing | 0–0.1 s after the last word lands before a RAMP or RAMP_LONG leg, sized so the camera visibly moves within 0.3 s of it; legs over ≈ 0.75 s leave before it lands. The drift keeps moving | the drift key, 0.3–0.55 s |
| Drift | constant, ≈ 3–5 % of the camera distance per second | 0.3–0.6 units, 3–12 % of the leg's peak speed |
| Roll peak | ±0.03–0.06 rad, alternating sign; barrel roll 0.2–0.35 rad | the same, keyed mid-leg |
| FOV kick | +4–8° on punches and push-throughs | rarely |
| Whole flight piece | 7–12 s | 7–12 s |

## Pitfalls

- **The spline on a reel.** Every leg peaks at about 1.4× its average, so nothing whips.
- **OUT or GLIDE on a leg after a hold.** The camera jumps from drift to full speed in one frame.
- **A 0.2–0.3 s hold, then a ramped leg.** The linger adds to the hold, and the camera hovers on copy already read. Measured on the kinetic recipe with each last word landing as the camera lands: a 0.2 s hold before the reveal and a 0.25 s hold before the punch audit at read gaps of 0.72 s and 0.39 s.
- **Drift against a leg.** Against the leaving leg, the camera stops and reverses in the linger. Against the arriving leg, it overshoots and recoils. Give each drift a positive component along both legs it touches, and drift sideways where a push turns into a pull. `findStops` at half the drift speed and 1000 Hz catches both: measured on a pull against a forward drift, it reported two stops at 0.002 units/s.
- **Zero drift.** Every hold is a full stop, and `findStops` lists each one.
- **Events on linear time inside a leg.** A RAMP leg covers its middle half in a burst. Key them on `path.progress(k, t)` (`motion-craft` → `rules/synced-events-from-curve.md`).
- **Overshoot curves (BOUNCE, spring, back) on a camera.** The frame lurches past its mark and recoils.
- **A dead stop on the last frame** reads as a freeze. The last landing keeps drifting until `end`.
- **Product demos** with discrete stages in a column keep RAMP glides between stages (`motion-craft` → `rules/column-whip.md`).

## See also

- [vary-the-leg.md](vary-the-leg.md), [landing-poses-baked.md](landing-poses-baked.md), [camera-position-and-target.md](camera-position-and-target.md)
- [depth-dissolve.md](depth-dissolve.md): what happens to planes the camera passes
- [speed-driven-fx.md](speed-driven-fx.md): FX keyed to the path's speed
- [../references/assets.md](../references/assets.md): `legPath` and `cameraPath` signatures

*Idea adapted from HyperFrames (Apache-2.0).*
