---
name: door-split
description: As the camera pushes through a word, its letters part like doors (outer letters swing out, centre letters lift), so the camera flies through the word instead of into it.
tags: [typography, flight, transition, per-letter]
---

# Door split (fly through a word)

**Use when:** frame-filling words sit along the camera's path and each push should break through the word on screen into the one waiting behind it.

**Optional look, not a default.** The door split is a set piece, like [tunnel.md](tunnel.md), [drum-ratchet.md](drum-ratchet.md) and [path-through-depth.md](path-through-depth.md). A piece uses at most two, each chosen because the subject calls for it: here, a run of single words the camera breaks through. A flight with no set piece is complete.

## How it works

Each word is baked into a per-letter atlas, with one plane per letter ([text-as-texture.md](text-as-texture.md)). A split value `s` (0 → 1) runs over the push that flies through the word. For each letter, by its horizontal offset `cx` from the word centre:

- **outer letters** slide outward and swing on a vertical hinge (`ry`), like double doors opening toward the camera;
- **centre letters** (|cx| small) lift and tip back (`rx`) instead, so nothing blocks the middle of the lens;
- every letter moves toward the camera a little (z) and fades out late in the split.

The camera passes through the gap the letters open, and the next word is already depth-popping in behind. Pair it with [depth-dissolve.md](depth-dissolve.md) as a safety net for anything near the lens.

## Recipe

```ts
interface Door { x: number; y: number; z: number; rx: number; ry: number; }
// E = the word's size unit (world height of its cap height); cx = letter centre offset from word centre.
function door(cx: number, s: number, E: number): Door {
  const ax = Math.abs(cx);
  const reach = s * (1.6 * E + 0.9 * ax);              // outer letters travel further
  if (ax < 0.15 * E) return {x: cx, y: reach, z: 1.2 * s, rx: 1.1 * s, ry: 0};
  const side = Math.sign(cx);
  return {x: cx + side * reach, y: 0, z: 1.2 * s, rx: 0, ry: -side * 1.1 * s};
}

import {DRAG, seg} from './curves';   // the motion-craft skill's assets/curves.ts

// In apply(), per letter L of word k:
const s = DRAG(seg(t, PUSH[k].start, PUSH[k].dur));   // split 0 → 1 over the push through word k
const d = door(L.cx, s, word.E);
mesh.position.set(d.x, L.cy + d.y, d.z);
mesh.rotation.set(d.rx, d.ry, popLean);
mesh.material.opacity = state.appear[k][L.i] * (1 - smoothstep(0.55, 0.95, s)) * nearFade;
```

The split runs from 0 to 1 over the same window as the push through word k, on DRAG (cubic-bezier 0.72, 0, 0.18, 1, from the `motion-craft` skill's curves asset). DRAG holds the doors shut until the camera is close, then bursts them open. Evaluate it from t as above, or tween a state field with it in a host.

## Echo ghosts (optional, seek-safe)

During the split, draw two or three faint copies of each letter at the poses it had a few milliseconds earlier. Compute them from the split curve at `t − k/240`, not from stored frames. Add the camera's travel over that interval so the ghosts trail in screen space. Show them only while the letter is actually moving (displacement above ~0.03 units). Opacities around 0.16 / 0.09 / 0.05. This is a motion-blur substitute that stays pure in t.

## Values

| Parameter | Value |
|---|---|
| Split duration | the push duration (push through a word inside a continuously creeping 3D flight: 0.3–0.6 s) |
| Centre band | abs(cx) < 0.15 E lifts instead of swinging |
| Reach | s × (1.6 E + 0.9 abs(cx)) |
| Hinge angle at s = 1 | 1.1 rad |
| Fade out | between s = 0.55 and 0.95 |

## Pitfalls

- **Splitting a whole-word plane.** It can only fade or scale. Doors need one plane per letter.
- **Split starting before the push.** Letters part while the word is still being read. Start the split with the push, and let the curve hold the doors shut for the first third.
- **Final words.** Don't split the word the piece lands on. Its push ends on it.
- **Ghosts from history buffers** break seeking. Derive them from the pure split curve.

## See also

- [flight-paths.md](flight-paths.md) (a straight run: equal drift on every landing, RAMP pushes), [depth-pop.md](depth-pop.md)
- [speed-driven-fx.md](speed-driven-fx.md)
