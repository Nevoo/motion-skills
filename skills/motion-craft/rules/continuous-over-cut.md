---
name: continuous-over-cut
description: Premium motion reads as one continuous thing; replace move-hold-move, chained stops and fades with one glide, overlapped hand-offs and morphs, and pass the pause test.
tags: [pacing, continuity, camera, transitions]
---

# Continuous over cut

**Use when:** a piece feels choppy, like a slideshow, or "correct but amateur".

## How it works

The biggest lever between amateur and premium motion is whether it reads as one continuous thing or as a sequence of discrete beats. Every full stop is a moment where the eye has nothing to follow, and the sense of one connected space breaks.

Five habits keep motion continuous:

1. **No move, hold, move on the camera.** One glide that shares the leading element's duration (camera-locked-to-leader). If the audience needs a read pause, put a short one after the block, not inside the camera path.
2. **Overlap every hand-off.** The next content starts entering before the previous one finishes leaving. Start a title's fade ~0.3s into the camera move that brings it.
3. **One tween over a whole distance** instead of two chained ones. Chained tweens have a velocity seam at the join unless the slopes are matched by hand.
4. **Morph instead of crossfading; tween layout changes instead of cutting them.** See morph-not-crossfade and no-jump-cut-relayouts.
5. **Keep one direction of travel.** Continuations move the same way (down, then down again). A change of direction reads as "a different thing now".

**The pause test.** Freeze playback on any frame you like. Something that matters should still be in motion: content arriving, the camera on its way somewhere, a number climbing. If everything has been still for longer than a read pause, that frame sits in a dead spot.

## Choosing the structure

How far to take continuity depends on the piece:

| piece | default structure |
|---|---|
| calm explainer | stages in one column, IN_OUT glides, ~0.4s read pauses |
| product demo reel | stages in one column, RAMP whips with a scale dip (column-whip) |
| hype or personal reel | one continuous 3D camera flight that never rests |

For a hype or personal reel, stop, show, whip, stop still reads as a slideshow: viewers stop feeling a continuous space. Default to one continuous camera flight through a 3D world. The camera never rests, content depth-pops in along the path, and the camera flies through planes of content instead of cutting to them. The architecture for that lives in `motion-3d`.

## Recipe

```ts
import {GLIDE, OUT, seg} from './curves';

// Entry and pan as ONE tween: an internal stop is impossible.
const worldX = (t: number) => GLIDE(seg(t, ENTER_AT, ENTRY_DUR + PAN_DUR), X_START, X_END);

// Overlapped hand-off: the next title starts 0.3s into the move that brings it.
const titleOpacity = (t: number) => OUT(seg(t, MOVE_AT + 0.3, 0.45));
```

## When a cut is right

A cut is right when the next content is a different thing in a different place and the jolt is the point. Even then, cut mid-motion with matched velocity (seams-and-vectors), never with a dissolve, and let the transition carry the outgoing content away (exit-is-the-transition).

## Pitfalls

- **Long holds as "breathing room".** In a reel a hold is 0.2–0.3s. Reading happens during builds.
- **Fixing choppiness with crossfades.** A crossfade is a softer cut, still a cut.
- **Fades between stages.** Every fade is a dead spot. Move the camera instead.
- **A camera that rests while the leading element keeps travelling.** The two decouple and the frame feels unanchored. (A camera parked at a stage while its content builds in place is fine; see column-whip.)

## See also

- [one-moment-one-block](one-moment-one-block.md)
- [column-whip](column-whip.md)
- [seams-and-vectors](seams-and-vectors.md)
- [vary-the-move](vary-the-move.md)

*Idea adapted from HyperFrames (Apache-2.0).*
