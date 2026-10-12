---
name: punch-through-stack
description: The camera punches card-to-card down a vertical stack, reframing each one as it depth-pops in. This is the core move of 3D kinetic counts and wordmarks.
tags: [camera, typography, stack]
---

# Perspective punch through a stack

**Use when:** a short list of words or cards ("one / two / three", "a / new / way / to") should land one at a time, each filling the frame, before a reveal of the whole.

## How it works

The stack is real planes in 3D ([stacked-gradient-cards.md](stacked-gradient-cards.md)). For each card `i`, the camera:

- slides vertically to the card's y (position **and** target, so the view translates, not swings);
- re-frames its distance so that card fills a chosen fraction ([frame-by-fill.md](frame-by-fill.md));

while the card depth-pops in a beat into the move ([depth-pop.md](depth-pop.md)). One coherent moment: the camera and the card arrive together.

Each punch is a RAMP move: it lingers, whips, then settles. Between punches, a short gap keeps the rhythm crisp.

## Recipe

Canvas Commons (signals as state; apply() copies them to the camera):

```ts
function* punchTo(i: number, fill: number) {
  const z = WORDS[i].z + distFor(WORDS[i].h, fill, FOV);
  yield* all(
    camY(Y[i], 0.42, RAMP),
    tgtY(Y[i], 0.42, RAMP),
    camZ(z, 0.42, RAMP),
    chain(waitFor(0.06), appear[i](1, 0.34, OUT)),   // pop a beat into the move
  );
}
yield* appear[0](1, 0.34, OUT);   // camera already framing card 0
yield* waitFor(0.12);
yield* punchTo(1, 0.58);
yield* waitFor(0.1);
yield* punchTo(2, 0.6);
```

Engine-agnostic (a pure function of t): the punches become keyed segments.

```ts
const punch = (t: number, t0: number, from: Pose, to: Pose, dur = 0.42) =>
  lerpPose(from, to, RAMP(clamp01((t - t0) / dur)));
```

## Values

| Parameter | Value |
|---|---|
| Punch duration | 0.38–0.45 s, RAMP (the 3D stack punch class; not a stage push or punch, 0.5–0.9 s, nor a stage-to-stage whip, 0.7–0.9 s) |
| Pop delay into the punch | 0.04–0.08 s |
| Pop duration | 0.3–0.36 s, OUT |
| Gap between punches | 0.08–0.12 s; with the RAMP settle tail the word reads for ≈ 0.22–0.27 s, inside the 0.2–0.3 s read pause |
| Fill sequence | 0.46 → 0.58 → 0.60 (grow slightly per step for escalation) |
| Opening state | stack turned rotY ≈ 0.13, rotX ≈ 0.05 rad (see [playful-tilt.md](playful-tilt.md)) |

## Pitfalls

- **Moving only `camY`.** Without `tgtY` the camera tilts toward the old target, and each card arrives skewed.
- **Long holds between punches** turn rhythm into a slideshow. Keep gaps at 0.1 s and let the reveal carry the pause.
- **Every punch the same fill.** Escalate slightly. The last card should feel biggest.
- **Pops that start before the move.** The card appears in a frame that hasn't arrived yet, and reads as pre-placed.

## See also

- [pull-back-through-text.md](pull-back-through-text.md): the usual payoff after the last punch
- [vary-the-leg.md](vary-the-leg.md)
