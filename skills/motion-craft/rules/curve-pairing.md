---
name: curve-pairing
description: When one element changes several properties at once, physical properties share one curve and duration while colour, weight and opacity follow on IN_OUT or OUT at the same duration.
tags: [easing, morph, multi-property]
---

# Pairing curves across properties

**Use when:** one element changes more than one property in the same moment (a morph, a card landing, a button press), or a follower moves with a leader.

## How it works

Split the properties into two groups.

- **Physical landings:** position, size, scale, corner radius, font size. They share one curve and one duration, so they arrive together and any overshoot happens in unison. Usually OUT; BOUNCE only for the size or scale of a small element.
- **Intangibles:** colour, fill, opacity, font weight, letter-spacing. IN_OUT (or OUT) at the same duration, so they finish in step without trying to overshoot. An overshooting colour or weight reads as a flicker.

The eye reads properties that finish together as one object changing. Properties that finish at different times read as several things happening.

Three more pairings come up constantly:

- **Leader and follower.** Same duration; the leader on IN_OUT, the follower on DRAG. The follower lags through the middle and arrives with the leader without overshooting. Use it for text that a camera pan drags off the frame.
- **Pointers move on OUT,** never IN_OUT. A pointer should respond at once and land calmly; IN_OUT makes it feel floaty.
- **Arcs from mismatched axes.** Put a pointer's x on IN_OUT over a longer duration and its y on OUT over a shorter one. It drops in and slides over instead of running a flat diagonal.

## Recipe

```ts
import {OUT, IN_OUT, BOUNCE, lerp, seg} from './curves';

// One morph progress m, two curve groups.
function fieldToTag(m: number) {
  const phys = BOUNCE(m);     // size + radius snap together (small end state)
  const text = OUT(m);        // text size + position: physical, but text never bounces
  const soft = IN_OUT(m);     // every intangible
  return {
    w: lerp(820, 164, phys), h: lerp(116, 54, phys), radius: lerp(58, 27, phys),
    fontSize: lerp(36, 22, text), textX: lerp(-300, -50, text),
    fillMix: soft,                       // mix surface colour into ink in your engine
    fontWeight: lerp(420, 600, soft),
    letterSpacing: lerp(0, -0.3, soft),
  };
}
const state = (t: number) => fieldToTag(seg(t, MORPH_AT, 0.5));

// Pointer arc: x and y on different curves and durations.
const pointer = (t: number) => ({
  x: IN_OUT(seg(t, T0, 0.5), x0, x1),
  y: OUT(seg(t, T0, 0.42), y0, y1),
});
```

In Canvas Commons, set `textWrap={false}` on tracked display text (`canvas-commons` → `references/txt-gotchas.md`, negative letterSpacing).

## Values

| moment | physical | intangible | duration |
|---|---|---|---|
| UI morph (field to tag) | BOUNCE on size and radius of the small end state; OUT on text | IN_OUT | 0.5s |
| card landing | BOUNCE scale 0.9 to 1 | OUT opacity | 0.4–0.5s |
| bar fill inside a track | OUT width | none | ~0.6s |
| follower with leader | DRAG follower, IN_OUT leader | none | equal |
| click press, release | OUT to 0.88, OUT back to 1 | none | 0.07s, 0.16–0.18s |

The click is asymmetric on purpose: a fast press and a slower release feel tactile. During it only the pointer and the touched element react.

## Pitfalls

- **Different durations inside one group.** The radius lands before the size and the shape visibly pops at the end.
- **BOUNCE on font size.** Text size is physical but text never bounces; letters wobble and readability dies.
- **An intangible on BOUNCE.** Colour or opacity overshoot shows as a flash.
- **A follower on a different duration than its leader.** It stops being "dragged" and becomes a second move.

## See also

- [named-curves](named-curves.md)
- [morph-not-crossfade](morph-not-crossfade.md): the full morph recipe these pairings serve
- [camera-locked-to-leader](camera-locked-to-leader.md): the camera version of leader and follower
