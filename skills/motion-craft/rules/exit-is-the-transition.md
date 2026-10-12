---
name: exit-is-the-transition
description: Content does not animate itself out before a transition; the whip, push, morph or cut carries it away. Only the final moment of a piece fades.
tags: [transitions, exits, continuity]
---

# The exit is the transition

**Use when:** a passage ends and the next begins.

## How it works

Playing an exit animation and only then the next entrance leaves a hole between them: the outgoing content is gone, the incoming content hasn't arrived, and for a beat the viewer is looking at an empty frame. The transition itself should do the leaving. The camera whips and the content scrolls off; a push slides it away; a morph turns it into the next thing.

- Until the transition begins, nothing about the outgoing content changes: no fade, no shrink, no slide.
- The move that carries the old content off is the move that brings the new content on, starting on the same frame.
- The one place a fade-out belongs is the very end of the piece, into the end card or to black.

Allowed exceptions, all inside the transition's own block:

- **Elements whose job is done.** The pointer fades as the morph it caused begins (~0.18s OUT); an overlay clears as the whip starts (~0.4s OUT).
- **Elements the transition drags off.** Text pulled out of frame by a camera pan on DRAG, same duration as the pan.

## Recipe

Engine-agnostic: both sides read the same transition progress.

```ts
import {RAMP, OUT, seg} from './curves';

const T = 6.0, WHIP = 0.85;
const transition = (t: number) => ({
  cameraY: RAMP(seg(t, T, WHIP), STAGE_1_Y, STAGE_2_Y), // carries stage 1 off, stage 2 on
  stage1Opacity: 1,                                     // never faded: the camera removes it
  stage2Opacity: OUT(seg(t, T + WHIP / 2, 0.5)),         // arrives during the second half
});
```

The same contrast in GSAP:

```ts
// Leaves an empty beat: fade out, gap, fade in.
tl.to(stage1, {opacity: 0, duration: 0.4}, 5.6)
  .fromTo(stage2, {opacity: 0}, {opacity: 1, duration: 0.4}, 6.0);

// The transition is the exit: one move at T carries stage 1 off and brings stage 2.
tl.to(cam, {y: STAGE_2_Y, duration: 0.85, ease: RAMP, onUpdate: writeCamera}, 6.0)
  .fromTo(stage2Content, {opacity: 0}, {opacity: 1, duration: 0.5, ease: OUT}, 6.42);
```

## Values

| element | treatment |
|---|---|
| outgoing content | untouched; the camera, push or morph removes it |
| finished pointer or overlay | 0.18–0.4s OUT, inside the transition block |
| incoming content | from the transition's midpoint, OUT |
| final passage | may fade out over the last ~0.5s |

## Pitfalls

- **Exit, then entrance.** The empty frame in between is what viewers notice.
- **An "outro" on every stage.** A slide-deck habit. Each one adds a dead spot.
- **Fading the outgoing content during a whip.** It leaves a hole mid-move; let the motion carry it.
- **Holding the incoming stage until the camera lands.** The settle then shows an empty stage.

## See also

- [column-whip](column-whip.md)
- [seams-and-vectors](seams-and-vectors.md)
- [morph-not-crossfade](morph-not-crossfade.md)
- [continuous-over-cut](continuous-over-cut.md)

*Idea adapted from HyperFrames (Apache-2.0).*
