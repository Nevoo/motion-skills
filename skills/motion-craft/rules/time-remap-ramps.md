---
name: time-remap-ramps
description: Edit-style speed ramps that bend time for the whole frame (fast, slow-motion hang, snap), built as a time-neutral, seek-safe remap so the piece keeps its length and music grid. Optional; at most one to three per piece, on the hero moments.
tags: [speed-ramp, time-remap, reel, effects]
---

# Time-remap speed ramps

**Use when:** a hero moment should hit like an edit rather than a tween: the action rushes in, hangs in slow motion, then snaps on. The opening hit, the biggest whip, the logo forming.

## How it works

An ease curve shapes one move ([speed-ramps](speed-ramps.md)). An edit-style ramp bends time itself: for a moment everything in the frame runs fast, nearly stops, then snaps back. That contrast is what a viewer reads as a speed ramp, and it only reads if the whole frame obeys it.

**One clock for the whole frame.** Every value is evaluated at action time τ = warp(t) instead of output time t: the camera, the copy, the particles, the morphs, the background field. There is one place where t becomes τ, and everything downstream reads τ. Ramp only the camera and the copy keeps its real speed, so the slow motion reads as a camera stutter rather than time bending.

**A rate profile per window.** Each ramp is a window [at, at + len] with a rate r(t) = dτ/dt that runs 1 → fast → slow-motion hang → fast → 1, each change a smoothstep, so neither edge has a velocity seam. The hang is the frame the ramp exists for: dots in mid-flight, glyphs scattered just before they lock, the camera at the peak of its whip. The fast stretch after the hang is the snap.

**Time-neutral.** The fast level is solved so that ∫r dt over the window equals len. Then τ = t at both edges and everywhere outside the windows: the piece keeps its length, the beat sheet stays in output seconds and every later cue stays on the music grid. End a window on the landing, where τ = t again, so the landing keeps its beat.

**Pure and seek-safe.** τ is a cumulative table built once from the ramp params alone and rebuilt when one of them changes. Never accumulate τ += r·dt per frame: a seek, a scrub or a parallel render then gets a different τ, and the sum drifts from the true integral.

**Effects follow on-screen speed.** Blur and colour fringing read the speed the viewer sees, d pos(τ(t))/dt = pos'(τ)·r(t), normalised once over the whole piece. The camera's speed in τ gets both halves wrong: it smears during the hang, where the screen barely moves, and under-blurs the snap.

**At most one to three per piece,** on the key moments only; none is fine. Give each a strength slider from 0 (off) to 1, so the human can compare with and without ([live tuning](../process/live-tuning.md)). Ramps stack with curves: a RAMP whip inside a window keeps its linger-whip-settle, and the hang can sit on its peak.

## Recipe

`assets/time-warp.ts` (no imports) builds the warp. `hang` is the span of output time held at the slow rate; the smoothstep changes (`edge`, default 0.1s) sit outside it.

```ts
import {makeTimeWarp, type RampWindow} from './time-warp';

const RAMPS: RampWindow[] = [
  {at: 0.4, len: 0.9, hang: [0.65, 0.95], slow: 0.25, strength: P.RAMP_OPEN},
  {at: 2.6, len: 0.75, hang: [2.85, 3.05], slow: 0.4, strength: P.RAMP_WHIP},
  {at: 8.3, len: 1.1, hang: [8.6, 9.0], slow: 0.15, strength: P.RAMP_LOGO},
];
const warp = makeTimeWarp(RAMPS);

// The one place t becomes tau.
function frame(t: number) {
  const tau = warp.tau(t);
  return {camera: cameraAt(tau), copy: copyAt(tau), dots: dotsAt(tau), fx: fxAt(t)};
}

// Differentiate in output time, so the remap rate is included.
const H = 1 / 240;
const screenSpeed = (t: number) =>
  Math.abs(cameraZ(warp.tau(t + H)) - cameraZ(warp.tau(t - H))) / (2 * H);
let vMax = 0;
for (let t = 0; t <= DURATION; t += H) vMax = Math.max(vMax, screenSpeed(t));
const speed = (t: number) => Math.min(1, screenSpeed(t) / vMax);
```

`warp.rate(t)` returns r(t) directly, for an effect that already knows its speed in action time (multiply by it). `warp.ramps` lists each ramp's solved `fast` level, worth showing next to the sliders. Rebuild the warp, and `vMax` with it, whenever a ramp param changes; three windows rebuild in well under a millisecond, so the strength sliders stay live. Overlapping windows throw.

## Values

| ramp | window | hang | slow rate |
|---|---|---|---|
| opening hit | 0.8–1.0s | the middle third | 0.2–0.3 |
| biggest whip | the whip's own duration | around the whip's peak speed | 0.35–0.5 |
| logo forming | 1.0–1.2s, ending on the lock | the scatter just before the snap | 0.15–0.2 |

| knob | value |
|---|---|
| ramps per piece | 0–3 |
| edge (each smoothstep change) | 0.08–0.12s |
| hang share of the window | 20–40%; at slow 0.2 the solved fast level is 1.4× at 20%, 2× at 40%, 2.6× at 50% |
| strength | 0 = off, 1 = full; the slow rate blends from 1 to `slow` |

## Pitfalls

- **Ramping only the camera.** Copy, particles and morphs keep real time and desync from the move. Route every value through τ.
- **A ramp that changes the total length.** A slow section with no solved fast level lengthens the piece and pushes every later cue off the music grid. Check τ(at + len) = at + len.
- **Ramps everywhere.** If every move hangs, nothing does. At most three, on the hero moments.
- **Effects that ignore r(t).** Blur from the camera's speed in τ smears the hang and starves the snap. Measure speed on screen.
- **τ accumulated frame by frame.** Seeks and parallel renders disagree. Build the table from params.
- **A sound hit keyed to action time inside a window.** It lands at a shifted output time. Put hits on window edges, where τ = t.

## See also

- [speed-ramps](speed-ramps.md): ease-curve ramps on one move
- [effects-tied-to-motion](effects-tied-to-motion.md): the speed signal the remap feeds
- [reel-pacing](reel-pacing.md)
- [last-read-becomes-logo](last-read-becomes-logo.md): the hang before the logo snaps together
- Ramped camera legs to put inside a window: `motion-3d` → `assets/legs.ts`
- State as a pure function of time: `motion-3d` → `rules/pure-function-of-time.md`
