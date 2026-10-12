---
name: playful-tilt
description: Make unlit flat planes feel alive with tilt instead of lights. Use resting leans, a lean that unwinds on entrance, and a small group turn that straightens for the payoff.
tags: [typography, life, materials]
---

# Playful tilt (life without lights)

**Use when:** a scene uses unlit materials (baked gradients on planes) and looks like flat stickers floating in space.

## How it works

With no lights, three.js shading can't change as things move, so the life has to come from **angles**. The baked gradient catches the eye differently as a card leans. Perspective foreshortens a turned plane, which reads as a physical object. Three layers, from small to large:

1. **Resting lean.** Each card has its own in-plane tilt (`rotation.z`), alternating in sign. A list becomes a pile of objects.
2. **Unwinding pop.** The entrance value also drives an extra lean that unwinds to the resting one. The card spins into place as it lands.
3. **Group turn.** The whole stack holds a small 3D turn (`rotY`, `rotX`) during the sequence. Perspective shows that the cards have depth between them. Straighten it to 0 on the payoff, so the final read is frontal and clean.

## Recipe

```ts
import {DEG} from './depth';
const baseAngle = CARDS.map(k => k.angleDeg * DEG);
const popLean = CARDS.map((_, i) => (i % 2 ? -1 : 1) * 0.26);   // alternating extra lean, rad

// In apply():
group.rotation.y = state.turnY;          // 0.13 during the sequence, tweened to 0 on the reveal
group.rotation.x = state.turnX;          // 0.05, likewise
CARDS.forEach((_, i) => {
  const a = state.appear[i];
  meshes[i].rotation.z = baseAngle[i] + (1 - a) * popLean[i];   // unwinds as it pops
});
```

Per-letter variant (kinetic words): each letter gets `popR = (i % 2 ? -1 : 1) * 0.22 * (1 - a)`. A word can also hold a small turn (±0.1 rad) that unwinds over 0.6 s with OUT as it lands.

## Optional: one fake light moment

For a single hero beat, a sheen band can sweep across the landing word: a soft diagonal highlight injected into the material's fragment shader, moved by a 0→1 value over ~0.36 s with IN_OUT. Keep it to one moment per piece. A sheen on every landing becomes noise, like an exposure flash on every beat.

## Values

| Layer | Range |
|---|---|
| Resting lean | ±4–5° (0.07–0.09 rad), alternating |
| Pop lean | ±0.22–0.26 rad extra, unwinding with the entrance curve |
| Group turn | rotY 0.10–0.15, rotX 0.03–0.06 rad |
| Straighten duration | same as the reveal move, same curve (RAMP) |

## Pitfalls

- **Turns at the moment of reading.** A turned plane is harder to read and breaks fill maths. Straighten before or during the final reveal.
- **Same lean for all cards** reads as a rotated list, not a pile. Alternate the sign and vary the size.
- **Continuous wobble** (sine sway on every card) reads as cheap idle animation. Leans are poses, and they only move on entrance or reveal.
- **Real lights to fix flatness.** Lights on baked-gradient cards shift brand colours. Reach for tilt first. See [lighting-and-materials.md](lighting-and-materials.md).

## See also

- [stacked-gradient-cards.md](stacked-gradient-cards.md), [depth-pop.md](depth-pop.md)
- [pull-back-through-text.md](pull-back-through-text.md): where the straightening happens
