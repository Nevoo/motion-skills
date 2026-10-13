---
name: vary-the-leg
description: Give each camera leg a different verb (push, truck, swoop, roll, pull) and change its axis, speed or lens. Repeating the same move turns a flight into a carousel.
tags: [camera, pacing, flight]
---

# Vary the leg

**Use when:** a piece has three or more camera moves in a row.

## How it works

Four identical pushes make the viewer predict the fifth, and prediction turns motion into a carousel. Each leg should change at least one dimension of the move, so the space keeps revealing itself. Keep the direction of travel through the world consistent. Reversing it reads as rewinding.

## The verbs

| Verb | What moves | Reads as | Good for |
|---|---|---|---|
| Push | position along the view axis, target ahead | approach, intent | arriving at a word or object |
| Punch | fast push + reframe as the element pops | snap to attention | stepping through a stack |
| Pull | position back along the axis | reveal, context | showing the whole, endings |
| Truck / pedestal | position + target sideways or vertically, together | scroll through a layout | rows, columns, timelines |
| Swoop | descending arc: y drops while z advances | dramatic arrival | entering a new section below |
| Arc / orbit | position around a fixed target | the object is real 3D | revealing depth of a stack or logo |
| Roll | roll peaks mid-leg, returns to 0 | speed, tunnel energy | fly-throughs |
| Rack | target only | a glance | redirecting attention without travel |
| Through | push that passes the plane itself | breaking into the next space | transitions (see [depth-dissolve.md](depth-dissolve.md)) |

## Recipe

Write the leg plan before keying anything. One line per leg:

```
leg  verb      axis       curve      dur   roll    fov kick  lands on
1    push      -z         RAMP       0.75  +0.04   +7°       word 2
2    swoop     -z,-y      RAMP       0.85  -0.04   +7°       word 3
3    punch     -z         RAMP       0.40   0      +5°       word 4   (short, fast)
4    arc       x around   IN_OUT     0.90  +0.03   0         the stack, turned
5    pull      +z         RAMP_LONG  1.15  -0.08   0         final frame (the one reveal)
```

Each line becomes one `legPath` leg (`{dur, curve, arc, roll, fov}`) and one landing ([flight-paths.md](flight-paths.md)). Alternate the roll sign between consecutive legs. Vary durations: a fast punch between two longer flights reads as rhythm, not repetition. Reserve the biggest move (longest pull, widest swoop) for the last one or two legs.

## Values

| Dimension | Vary between legs by |
|---|---|
| Duration | noticeably (e.g. 0.4 → 0.75 → 1.15 s); equal durations only for a deliberate group, such as three names in a row. Kinetic flight: punch or push through a word ≈ 0.4 s, whip 0.7–0.9 s, the one reveal up to ≈ 1.15 s; exception: a tunnel leg, read during the flight, replaces the reveal at 1.5–2 s. Calm spline: 0.8–1.75 s. Stage push or punch outside a flight 0.5–0.9 s; 3D stack punch 0.38–0.45 s |
| Roll | sign flip, or 0 ↔ ±0.03–0.04 rad |
| fov kick | 0 / +5 / +8° |
| Path shape | straight vs arc vs descending |

## Pitfalls

- **Varying only the content, not the move.** New words on the same push still feel like the same beat repeated.
- **Direction reversals.** Flying forward, then back along the same axis, reads as an undo. Use a pull only as a reveal or an ending.
- **Every leg a hero.** If every leg has a roll, a kick and a swoop, nothing stands out. Keep one or two plain pushes as the baseline.
- **Easing by class.** Flight legs leave a drifting hold, so their curve must start and end at zero slope: RAMP for punches and whips, RAMP_LONG for the reveal or a long pan, IN_OUT for a soft reposition (arc, truck). GLIDE only on leg 0 when the camera moves from the first frame; never OUT, which leaves at full speed. Tweened stage moves outside a flight: OUT or IN_OUT for a push, RAMP between stages. ACCEL only as the exit side of a velocity-matched cut; never BOUNCE or spring/back on a camera.

## See also

- [flight-paths.md](flight-paths.md)
- [camera-position-and-target.md](camera-position-and-target.md)
- The `motion-craft` skill: named curves, pacing and seams

*Idea adapted from HyperFrames (Apache-2.0).*
