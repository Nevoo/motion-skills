---
name: one-moment-one-block
description: Everything that should read as one moment starts together in one block; delayed reactions are offsets inside it, pauses sit between blocks, and an effect starts the moment its cause lands.
tags: [pacing, timeline, structure]
---

# One moment, one block

**Use when:** structuring a timeline: deciding what runs in parallel, what follows, and where the reading pauses go.

## How it works

Viewers group motion by when it starts. Motions that start together read as one event; a chain of small sequential steps reads as a list of beats with a stop between each. So:

- **One block per coherent moment.** The primary motion and its delayed reactions live in the same block, with reactions offset by small delays inside it.
- **Pauses go between blocks,** never inside a camera path. A short read pause after a block is fine; a hold in the middle of the camera's move while other things keep moving decouples the camera from the content and the hold feels dead.
- **Cause and effect are adjacent.** A click, a tap, an impact: what it triggers starts on the release frame. A 0.3s gap makes the effect read as an unrelated event.
- **Only the touched element reacts.** During a click the rest of the frame stays still: no dim, no pulse, no flash.
- **Name the moments.** Moments get names (time events, labels) so they can be re-timed against narration or music without code edits. Offsets inside a moment are fixed micro-timing.

## Recipe

Engine-agnostic: a moment is a start time plus tracks with offsets, each computed from t alone.

```ts
import {IN_OUT, OUT, seg, lerp} from './curves';

const MAP = 4.0;                                     // the moment's start
const map = (t: number) => ({
  cameraY: IN_OUT(seg(t, MAP, 3.5), 0, -1840),       // primary
  lineEnd: IN_OUT(seg(t, MAP, 3.5)),                 // primary, locked to the camera
  card1: OUT(seg(t, MAP + 1.72, 0.45)),              // reaction, offset inside the moment
  card2: OUT(seg(t, MAP + 1.95, 0.45)),
});
```

The same moment in each host:

```ts
// Canvas Commons: one all() per moment, reactions as chain(waitFor(x), ...)
yield* all(
  camera().position.y(-1840, 3.5, IN_OUT),
  connector().end(1, 3.5, IN_OUT),
  chain(waitFor(1.72), card1().opacity(1, 0.45, OUT)),
  chain(waitFor(1.95), card2().opacity(1, 0.45, OUT)),
);

// GSAP: one label per moment, reactions at label-relative positions
tl.addLabel('map', 4.0)
  .to(cam, {y: -1840, duration: 3.5, ease: IN_OUT}, 'map')
  .to(line, {end: 1, duration: 3.5, ease: IN_OUT}, 'map')
  .to(card1, {opacity: 1, duration: 0.45, ease: OUT}, 'map+=1.72')
  .to(card2, {opacity: 1, duration: 0.45, ease: OUT}, 'map+=1.95');
```

The reaction offsets (1.72s, 1.95s) are where the line's tip reaches each card on the IN_OUT curve, computed from the curve, not from linear time. See synced-events-from-curve.

## Values

| gap | calm explainer | kinetic reel |
|---|---|---|
| read pause between moments | ~0.4s | 0.2–0.3s |
| cause to effect | 0 | 0 |
| title fade after its camera move starts | ~0.3s in | ~0.3s in, or at the whip midpoint |

## Pitfalls

- **A sequence of tiny blocks.** One motion becomes N beats. Merge them into one block with offsets.
- **Effects "shortly after" their cause.** Start them on the causing frame.
- **Hard-coded absolute times for every step.** Re-timing one moment then means editing every later number. Offsets inside a moment, names for the moments.
- **Everything at offset 0.** One block does not mean no rhythm; stagger reactions inside it.

## See also

- [continuous-over-cut](continuous-over-cut.md)
- [synced-events-from-curve](synced-events-from-curve.md)
- [reel-pacing](reel-pacing.md)
- [stagger-waves](stagger-waves.md)
