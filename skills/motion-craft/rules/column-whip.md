---
name: column-whip
description: Lay stages out in one column, whip the one camera between them on RAMP, and dip the camera scale from 1 to ~0.9 and back during each whip for a speed-ramp whoosh.
tags: [camera, transitions, reel, speed-ramp]
---

# The column whip

**Use when:** a product demo or reel moves between distinct stages (a UI screen, a canvas, a closing lockup) and the temptation is separate scenes joined by fades.

## How it works

Separate scenes joined by fades read as a slideshow, and each fade is a dead spot. Instead:

- **One scene, one camera.** Every stage lives in the same world at its own anchor, stacked in a single column (vertical by default). Space anchors more than a frame apart so the old stage scrolls fully off before the new one settles: 1100–1500px for a 1080px-tall frame.
- **RAMP between stages.** The camera lingers, whips, settles. Content scrolls off with the camera; nothing fades out.
- **A synced scale dip.** During the whip, the camera pulls back from 1 to ~0.9 and returns. The dip bottoms out at the whip's midpoint, which is where RAMP peaks at 6.7× its average speed, so the frame breathes out exactly when it moves fastest. That is the whoosh.
- **Incoming content enters once the whip passes its midpoint,** from the midpoint, on OUT. It is already arriving while the camera settles, so there is no empty frame.
- **Same direction every time.** Down, then down again. A sideways stage reads as a different video.

## Recipe

```ts
import {RAMP, IN_OUT, OUT, seg} from './curves';

const WHIP = 0.85, DIP = 0.9;
function whip(t: number, at: number, fromY: number, toY: number) {
  const p = seg(t, at, WHIP);
  return {
    y: RAMP(p, fromY, toY),
    scale: p < 0.5 ? IN_OUT(p / 0.5, 1, DIP) : OUT((p - 0.5) / 0.5, DIP, 1),
  };
}
// The incoming stage starts arriving at the whip's midpoint.
const stageIn = (t: number, at: number) => OUT(seg(t, at + WHIP / 2, 0.5));
```

Canvas Commons, with the built-in `Camera` component. It pans and zooms around the focal point, so the two overlapping tweens stay centred; on a plain wrapper node the same overlap drifted about 53px off centre in a measured render. In 0.4.0 a zoom below 1 pulls back.

```ts
yield* all(
  overlay().opacity(0, 0.4, OUT),                       // anything done clears in the same block
  camera().centerOn([0, STAGE_2_Y], 0.85, RAMP),
  camera().zoom(0.9, 0.42, IN_OUT).to(1, 0.43, OUT),
  chain(waitFor(0.42), stage2().opacity(1, 0.5, OUT)),
);
```

GSAP, tweening the camera state that one writer applies:

```ts
tl.addLabel('whip2', 12.0)
  .to(cam, {y: STAGE_2_Y, duration: 0.85, ease: RAMP, onUpdate: writeCamera}, 'whip2')
  .to(cam, {scale: 0.9, duration: 0.42, ease: IN_OUT}, 'whip2')
  .to(cam, {scale: 1, duration: 0.43, ease: OUT}, 'whip2+=0.42')
  .fromTo(stage2, {opacity: 0}, {opacity: 1, duration: 0.5, ease: OUT}, 'whip2+=0.42');
```

## Values

| parameter | tuned value | range |
|---|---|---|
| whip duration | 0.85s | 0.7–0.9s |
| dip scale | 0.9 | 0.88–0.92 |
| dip down, back up | 0.42s IN_OUT, 0.43s OUT | half the whip each |
| incoming content starts | 0.42–0.45s into the whip | at the midpoint |
| anchor spacing (1080p frame) | 1140px | 1100–1500px |

## Pitfalls

- **Fading the outgoing stage before the whip.** The frame empties mid-move. Let the camera carry it off (exit-is-the-transition).
- **RAMP on the dip.** Two ramps fight. The dip goes down on IN_OUT and back on OUT.
- **Incoming content waiting for the camera to land.** The settle then shows an empty stage. Start it at the midpoint.
- **Using it for a hype or personal reel.** Stop, show, whip, stop still reads as a slideshow there. Use one continuous flight (continuous-over-cut, `motion-3d`).
- **Every whip identical.** Vary lengths and what arrives (vary-the-move); keep the direction.

## See also

- [speed-ramps](speed-ramps.md)
- [camera-locked-to-leader](camera-locked-to-leader.md)
- [exit-is-the-transition](exit-is-the-transition.md)
- [one-background](one-background.md): the background stays outside the camera
