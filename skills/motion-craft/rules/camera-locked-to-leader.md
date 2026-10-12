---
name: camera-locked-to-leader
description: When the camera follows a focal element, both share the same curve, duration and start time; pick the camera's travel by the final framing, and keep one camera state with one writer.
tags: [camera, framing, sync]
---

# Camera locked to its leader

**Use when:** a focal element travels (a dot riding a line, a pointer crossing the frame, a connector drawing) and the camera should go with it.

## How it works

The camera and the leading element share three things, every time:

1. the same curve,
2. the same duration,
3. the same start time.

Miss any one and they drift apart unpredictably; the camera looks like it is chasing.

**Same distance or not.** If camera and leader travel the same world distance, the leader stays pinned to one spot on screen. If the leader travels further, it drifts ahead predictably, which reads as the leader pulling the eye. Pick the camera's travel by where the viewer must be looking when the move lands, not by the leader's endpoint.

**Bind, don't duplicate.** Anything attached to the leader (a dot at a line's tip, a label on a pointer) is derived from the leader's progress, with the multiplier computed from the real geometry. A hard-coded multiplier that doesn't match the line's length makes the dot lag or float.

**One camera state, one writer.** Keep the camera as one state object (position, zoom, rotation) and write it to the scene from exactly one function. Extra motion such as a scale dip or a hold drift adds into that state; it never writes the transform itself. If two pieces of code each set the camera transform, they overwrite each other, and the frame shows whichever happened to run last: a jitter that changes with execution order and is hard to trace.

**The background sits outside the camera,** so it never pans or scales.

## Recipe

```ts
import {IN_OUT, OUT, seg, lerp} from './curves';

const START = 4.0, DUR = 3.5;
const lead = (t: number) => IN_OUT(seg(t, START, DUR));     // the ONE shared progress

const LINE_LEN = LINE_TO_Y - LINE_FROM_Y;                   // from geometry, never typed in
const drawEnd = (t: number) => lead(t);                      // the line draws 0..1
const tipY = (t: number) => LINE_FROM_Y + lead(t) * LINE_LEN;

const cam = {x: 0, y: 0, zoom: 1, dip: 0};
function writeCamera(t: number) {                           // the only writer
  cam.y = lerp(CAM_FROM_Y, CAM_TO_Y, lead(t));               // travel chosen by final framing
  applyCamera(cam.x, cam.y, cam.zoom * (1 - cam.dip));       // extras fold in here
}
```

**Punch-in on a click target:** zoom and position on the same curve and duration, while the pointer arcs in (x on IN_OUT, y on a shorter OUT; see curve-pairing).

```ts
const punch = (t: number) => ({
  zoom: IN_OUT(seg(t, CLICK_AT, 0.55), 1, 1.55),
  y: IN_OUT(seg(t, CLICK_AT, 0.55), CAM_Y, TARGET_Y),
});
```

## Values

| move | curve | duration |
|---|---|---|
| long linked glide (camera with a drawing line) | IN_OUT | 2.5–3.5s |
| stage push or punch, e.g. a punch-in on a click target (IN_OUT, zoom 1.4–1.6, ~0.55s) | OUT or IN_OUT | 0.5–0.9s |
| 3D stack punch (`motion-3d`, punch through a stack) | RAMP | 0.38–0.45s |
| push through a word inside a continuously creeping 3D flight (`motion-3d`, vary the leg) | RAMP, RAMP_LONG or OUT | 0.3–0.6s |
| pointer travel inside the frame | OUT | 0.4–0.6s |

The three push and punch classes are the same ones listed in [vary-the-move](vary-the-move.md).

## Pitfalls

- **Camera on IN_OUT, leader on OUT.** They agree at both ends and disagree in the middle, which is when the viewer is watching.
- **Measuring the leader per frame** (reading layout boxes during render) instead of deriving it from progress. It breaks seeking and parallel rendering.
- **Spring or back easing on the camera.** The whole frame sways past its mark and back.
- **Horizontal and vertical moves between stages in the same piece.** Keep one axis of travel.

## See also

- [column-whip](column-whip.md): the camera between stages
- [curve-pairing](curve-pairing.md): leader and follower, pointer arcs
- [continuous-over-cut](continuous-over-cut.md)
- Engine camera components: `canvas-commons`. 3D camera rigs (position plus target, frame by fill, keyed flights): `motion-3d`.

*Idea adapted from HyperFrames (Apache-2.0).*
