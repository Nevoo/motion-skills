---
name: morph-not-crossfade
description: When A becomes B, keep one element alive and tween every shared property instead of fading A out and B in; stage new parts at the old part's spot and fire the morph on its cause.
tags: [morph, transitions, continuity]
---

# Morph, don't crossfade

**Use when:** one element turns into another (a search field becomes a tag, a button becomes a panel, a dot becomes a label), or one element changes state.

## How it works

A crossfade shows two unrelated elements briefly sharing a spot; the viewer loses the thread that this is the same thing. A morph keeps one element alive and tweens every property it shares with the target at once: size, corner radius, fill, text size, weight, position. The eye follows the object through the change.

The ingredients:

1. **One block, one master progress.** All properties are driven together and paired by curve (curve-pairing): physical properties on OUT or BOUNCE, intangibles on IN_OUT, all at one duration.
2. **New parts start at the old part's spot.** If B has a part A lacks (a dot where A had an icon), the new part appears exactly where the old part was, then rides the parent's change to its rest. It reads as "the icon became the dot".
3. **Parts with no future dissolve fast,** about 0.18s on OUT, inside the same block.
4. **Cause first, morph immediately.** If a click causes the morph, it starts on the release frame. The pointer fades out during the morph: it was the cause and its job is done.
5. **The camera may reframe in the same block,** running slightly longer than the morph (0.65s against 0.5s) so it settles after the shape lands.
6. **Only the touched element reacts.** The rest of the frame stays still: no dim, no pulse, no flash.

## Recipe

```ts
import {BOUNCE, OUT, IN_OUT, seg, lerp} from './curves';

const MORPH = 0.5;
function fieldToTag(t: number, at: number) {
  const m = seg(t, at, MORPH);
  const phys = BOUNCE(m), text = OUT(m), soft = IN_OUT(m);
  const dotP = OUT(seg(t, at + 0.08, MORPH - 0.08));
  return {
    box: {w: lerp(820, 164, phys), h: lerp(116, 54, phys), radius: lerp(58, 27, phys)},
    fillMix: soft,                                          // surface colour into ink
    label: {size: lerp(36, 22, text), x: lerp(-300, -50, text), weight: lerp(420, 600, soft)},
    icon: {opacity: 1 - OUT(seg(t, at, 0.18))},             // no future: dissolves fast
    dot: {opacity: OUT(seg(t, at + 0.08, 0.22)), x: lerp(ICON_X, 50, dotP)},  // born at the icon
    pointer: {opacity: 1 - OUT(seg(t, at, 0.18))},          // the cause leaves with the effect
  };
}
```

If the label's words change as well, crossfade only the text run inside the morphing container, over the first third of the morph. The container carries the continuity.

## When not to morph

Morph when A and B are the same thing in a different state. When they are different things in different places, move the camera or cut with matched velocity (seams-and-vectors).

| change | do |
|---|---|
| search input becomes a city tag | morph |
| results page becomes a map view | camera move or cut |
| the value in card A becomes the value in card B | morph only if they occupy the same slot |

## Values

| part | curve | timing |
|---|---|---|
| shape size and radius | BOUNCE (small end state) or OUT | 0.5s |
| text size and position | OUT | 0.5s |
| colour, weight, letter-spacing | IN_OUT | 0.5s |
| parts with no future | OUT | 0.18s |
| new part fade-in | OUT | 0.22s, starting 0.08s in |
| camera reframe | IN_OUT | 0.65s |

## Pitfalls

- **Two elements with matched fades** presented as a morph.
- **A gap between the click and the morph.** It reads as an unrelated event.
- **A new part that appears at its final position.** The "became" link is lost.
- **The whole UI reacting to a click.** A click is an interaction, not a mood.

## See also

- [curve-pairing](curve-pairing.md)
- [no-jump-cut-relayouts](no-jump-cut-relayouts.md)
- [one-moment-one-block](one-moment-one-block.md)
- [signature-motif](signature-motif.md): shape multiply and merge morphs
