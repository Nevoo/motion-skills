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
leg  verb      axis      dur   roll    fov kick  lands on
1    push      -z        0.50  +0.04   +7°       word 2
2    swoop     -z,-y     0.45  -0.04   +7°       word 3
3    punch     -z        0.30   0      +5°       word 4   (short, fast)
4    arc       x around   0.80  +0.03   0         the stack, turned
5    pull      +z        1.10  -0.08   0         final frame
```

Alternate the roll sign between consecutive legs. Vary durations: a fast punch between two longer flights reads as rhythm, not repetition. Reserve the biggest move (longest pull, widest swoop) for the last one or two legs.

## Values

| Dimension | Vary between legs by |
|---|---|
| Duration | noticeably (e.g. 0.3 → 0.45 → 0.8 s); equal durations only for a deliberate group, such as three names in a row. By class: stage push or punch 0.5–0.9 s; 3D stack punch 0.38–0.45 s; push through a word inside a continuously creeping 3D flight 0.3–0.6 s; stage-to-stage whips 0.7–0.9 s |
| Roll | sign flip, or 0 ↔ ±0.03–0.04 rad |
| fov kick | 0 / +5 / +8° |
| Path shape | straight vs arc vs descending |

## Pitfalls

- **Varying only the content, not the move.** New words on the same push still feel like the same beat repeated.
- **Direction reversals.** Flying forward, then back along the same axis, reads as an undo. Use a pull only as a reveal or an ending.
- **Every leg a hero.** If every leg has a roll, a kick and a swoop, nothing stands out. Keep one or two plain pushes as the baseline.
- **Easing by class.** Stage push or punch: OUT or IN_OUT. 3D stack punch: RAMP. Push through a word inside a continuously creeping 3D flight: RAMP, RAMP_LONG or OUT. Repositioning (arc, truck): IN_OUT or GLIDE. Camera curves are OUT, IN_OUT, RAMP, RAMP_LONG, GLIDE; ACCEL only as the exit side of a velocity-matched cut; never BOUNCE or spring/back on a camera.

## See also

- [flight-paths.md](flight-paths.md)
- [camera-position-and-target.md](camera-position-and-target.md)
- The `motion-craft` skill: named curves, pacing and seams

*Idea adapted from HyperFrames (Apache-2.0).*
