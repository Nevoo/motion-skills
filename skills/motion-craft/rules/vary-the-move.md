---
name: vary-the-move
description: A journey of identical camera moves reads as a slideshow; keep the grammar (direction, one camera, curve family) but vary the verbs and lengths from leg to leg. Camera curves are OUT, IN_OUT, RAMP, RAMP_LONG and GLIDE, never spring or back.
tags: [camera, variety, pacing]
---

# Vary the move

**Use when:** a piece has three or more camera legs, stage changes or transitions.

## How it works

Four identical pushes, each the same length on the same curve, read as a slideshow. After two, the viewer has learned the rhythm and stops feeling travel. Keep the grammar consistent: one direction of travel, one camera, velocity-matched seams, the same curve family for the same kind of move. Vary the verbs.

| verb | what the camera does | good for |
|---|---|---|
| push in | travels toward a subject; it grows | focus, "look closer" |
| pull back | travels away; the frame widens | context, arrival of something bigger |
| whip | fast move between stages | the next stage, energy |
| fly through | passes through a plane of content | hype transitions (`motion-3d`) |
| rise or drop | a vertical crane | a conclusion, a step up |
| orbit or tilt | turns around the subject | depth, dimensionality |
| drift | near-still, a slow GLIDE | a read moment that stays alive |
| rack | holds its position and re-aims at a new target | handing attention to a subject at another depth (`motion-3d`) |

Vary the lengths as well. A long build next to a short whip makes both read; equal lengths are a metronome.

Keep the transition vocabulary small: two or three transition types per piece, repeated. Variety comes from the verbs and lengths inside that vocabulary, not from a new transition type at every seam.

**Reserve the strong verbs.** If a pull-back means "something bigger arrives", don't spend it as filler between two ordinary stages.

**No spring, back or elastic on a camera.** An overshooting camera swings the whole frame past its mark and back, which looks unsteady and, in 3D, can make viewers queasy. Camera curves are OUT, IN_OUT, RAMP, RAMP_LONG and GLIDE (GLIDE for drifts and for moves that flow on from a previous one). BOUNCE never; ACCEL only as the exit side of a velocity-matched cut (seams-and-vectors), never on a leg that has to land.

## Recipe

Write the legs down as data, then lint them before animating.

```ts
import type {CurveName} from './curves';

type Leg = {verb: string; at: number; dur: number; ease: CurveName};
const legs: Leg[] = [
  {verb: 'pull-back', at: 0.0, dur: 1.4, ease: 'RAMP_LONG'},
  {verb: 'whip', at: 2.2, dur: 0.85, ease: 'RAMP'},
  {verb: 'push-in', at: 3.6, dur: 0.6, ease: 'OUT'},
  {verb: 'rise', at: 5.0, dur: 0.9, ease: 'IN_OUT'},
];

// Flag back-to-back legs that repeat the same verb at the same length.
const repeats = legs.filter((leg, i) =>
  i > 0 && leg.verb === legs[i - 1].verb && Math.abs(leg.dur - legs[i - 1].dur) < 0.1);
const cameraCurves: CurveName[] = ['OUT', 'IN_OUT', 'RAMP', 'RAMP_LONG', 'GLIDE'];
const badCurves = legs.filter(leg => cameraCurves.indexOf(leg.ease) < 0);
```

## Values

| leg | curve | duration |
|---|---|---|
| stage push or punch | OUT or IN_OUT | 0.5–0.9s |
| 3D stack punch (`motion-3d`, punch through a stack) | RAMP | 0.38–0.45s |
| push through a word inside a continuously creeping 3D flight (`motion-3d`, vary the leg) | RAMP, RAMP_LONG or OUT | 0.3–0.6s |
| pull back, reveal | RAMP_LONG or IN_OUT | 1.2–2s |
| whip | RAMP | 0.7–0.9s |
| drift between legs | GLIDE | the whole hold |

## Pitfalls

- **Variety as noise.** A different transition type at every seam reads as a template showcase.
- **The same leg length everywhere.** Even with different verbs, equal durations tick.
- **Spring easing on the camera.** Never; keep overshoot for small landing scales.
- **ACCEL on a camera leg that lands.** It arrives at full speed and stops dead.
- **Variety that breaks the grammar.** A sideways leg in a vertical piece is not variety, it is a different video.

## See also

- [continuous-over-cut](continuous-over-cut.md)
- [column-whip](column-whip.md)
- [named-curves](named-curves.md)
- [reel-pacing](reel-pacing.md)

*Idea adapted from HyperFrames (Apache-2.0).*
