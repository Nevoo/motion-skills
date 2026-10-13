---
name: motion-craft
description: Engine-agnostic motion design doctrine for premium, kinetic, cinematic animation in any engine (Canvas Commons/Motion Canvas, GSAP/HyperFrames, Remotion, CSS, three.js). Eight named cubic-bezier curves and a pairing rule, speed ramps (curves and time remaps) and whips, reel pacing, camera grammar, velocity-matched seams and transitions, stagger waves, morphs instead of crossfades, kinetic type, signature motifs, endings where the last line becomes the logo, effects tied to motion, plus a pitch, variant-round and live-slider process and fact checks for renders. Use when asked to make an animation feel premium, kinetic, cinematic, snappier or less like a slideshow; when choosing easing, cubic-bezier or speed-ramp curves; when pacing a reel or explainer; when designing a transition, seam, whip, camera move or morph; or when reviewing motion that feels cheap, choppy, slow or floaty.
---

# Motion craft

Engine-agnostic doctrine for motion that feels premium: which curve, how long, how things hand off, where the camera goes, what to leave out. It holds whatever renders the frames. Rules are opinions with reasons; when one says "never", it means it.

Engine how-to lives in the sibling skills:

- `canvas-commons`: Canvas Commons / Motion Canvas idiom, components, the live panel, the render pipeline.
- `motion-3d`: 3D motion graphics (time to state to a single apply, camera rigs, WebGL rendering) and the Canvas Commons and HyperFrames hosts.

## Cardinal rules

1. **Every tween uses one of the eight named curves** in `assets/curves.ts`: never engine presets, never linear for a visible move. The one sanctioned composite is the nudge, a three-phase member of the speed-ramp family, used only for group repositioning ([speed-ramps](rules/speed-ramps.md)).
2. **Pair curves by property.** Physical properties share one curve and duration; colour, weight and opacity ride IN_OUT or OUT at the same duration. BOUNCE only lands the scale of small things: never on position, camera or text.
3. **One moment, one block.** What should feel like one motion starts together, with reactions as offsets inside it. An effect starts on the frame its cause lands.
4. **Continuous over cut.** No move-hold-move, every hand-off overlapped, morphs instead of crossfades, no jump-cut re-layouts. Freeze any frame and the copy being read or the camera is visibly moving; drift and background dots don't count.
5. **The camera is locked to its leader:** same curve, same duration, same start. One camera state, one writer.
6. **Seams carry velocity.** The exit still moves at the cut, the entry arrives mid-flight on the same axis and direction, and nothing dissolves. The transition is the exit.
7. **Reel pacing and ramps:** element tweens 0.3–0.5s, read pauses 0.2–0.3s; camera whips (0.7–0.9s) and the final lockup are the planned exceptions. RAMP is reserved for camera whips and whole-frame morphs, so it still whips. Whole-frame time remaps (fast, slow-motion hang, snap) are optional: at most three, only on the hero moments.
8. **One hero per frame, one background, one signature motif.** The motif's elements persist, and the last thing read re-forms into the logo. No HUD chrome. Effects only when motion drives them.
9. **Taste lives with the human.** The agent cannot judge feel from frames: go wide before deep, then expose every magic number as a live slider with a plain-language label.
10. **Verify facts, not feel, and show only final timing:** a timing audit, frame count, contact sheets at phase boundaries, onion skins, motion assertions, a frozen check. A test render gets judged as the piece, so nothing reaches the human before the premium review and the audits pass.

## When to read what

| Question | Read |
|---|---|
| Which curve here? Why is this one wrong? | [named-curves](rules/named-curves.md) |
| One element changes size, colour and weight at once | [curve-pairing](rules/curve-pairing.md) |
| Whips, a speed-ramp curve on one move, a group sliding to make room | [speed-ramps](rules/speed-ramps.md) |
| An edit-style ramp: the whole frame runs fast, hangs in slow motion, snaps | [time-remap-ramps](rules/time-remap-ramps.md) |
| A drift, spinner, typewriter or count-up looks cheap | [linear-reads-cheap](rules/linear-reads-cheap.md) |
| "The card should appear as the dot passes it" | [synced-events-from-curve](rules/synced-events-from-curve.md) |
| What runs in parallel, what follows, where pauses go | [one-moment-one-block](rules/one-moment-one-block.md) |
| It feels choppy, like a slideshow, "correct but amateur" | [continuous-over-cut](rules/continuous-over-cut.md) |
| How long should things take? It feels slow | [reel-pacing](rules/reel-pacing.md) |
| Cards, rows or words arriving as a group | [stagger-waves](rules/stagger-waves.md) |
| The camera follows a moving element | [camera-locked-to-leader](rules/camera-locked-to-leader.md) |
| Moving between stages of a demo or reel | [column-whip](rules/column-whip.md) |
| Several camera legs feel samey | [vary-the-move](rules/vary-the-move.md) |
| A hard cut between two passages | [seams-and-vectors](rules/seams-and-vectors.md) |
| Should content animate out before the next part? | [exit-is-the-transition](rules/exit-is-the-transition.md) |
| One element turns into another | [morph-not-crossfade](rules/morph-not-crossfade.md) |
| Full frame to split screen, panel resize, grid reflow | [no-jump-cut-relayouts](rules/no-jump-cut-relayouts.md) |
| Headlines, titles, taglines | [kinetic-headlines](rules/kinetic-headlines.md) |
| Stretching or smearing real glyphs, a comet trail | [kinetic-glyph-stretch](rules/kinetic-glyph-stretch.md) |
| A reel feels like noise; it needs a spine | [signature-motif](rules/signature-motif.md) |
| Scattered elements converge into a ring or logo | [formation-by-bearing](rules/formation-by-bearing.md) |
| The ending, the logo lockup, the end card | [last-read-becomes-logo](rules/last-read-becomes-logo.md) |
| A frame is busy, generic, template-like | [one-hero-per-frame](rules/one-hero-per-frame.md) |
| Demoing a real product | [faithful-product-ui](rules/faithful-product-ui.md) |
| Corner labels, step counters, progress rules | [no-hud-chrome](rules/no-hud-chrome.md) |
| Blur, chromatic aberration, flashes, bloom | [effects-tied-to-motion](rules/effects-tied-to-motion.md) |
| Sections want different background colours | [one-background](rules/one-background.md) |

All rules with tags: [rules/INDEX.md](rules/INDEX.md).

## Process

| Stage | Read |
|---|---|
| Open brief, no concept chosen | [pitch-range](process/pitch-range.md): five angles, the low-probability gate |
| Concept chosen, its motion not found yet | [variant-rounds](process/variant-rounds.md): 3 concepts, then a 3×3 axis grid, then sliders |
| A moment must feel right | [live-tuning](process/live-tuning.md): params object, live versus structural, plain labels, copy back to defaults |
| Before showing the human anything | [verify-facts](process/verify-facts.md): final timing only, after the premium review and the timing audit (dead spots, read gaps before camera moves) |
| After a render, before saying "done" | [verify-facts](process/verify-facts.md): frame count, contact sheet, onion skin, assertions, frozen check |

## Assets

- [assets/curves.ts](assets/curves.ts): the eight named curves as one engine-agnostic `Ease` type, which works directly as a Canvas Commons `TimingFunction` and as a GSAP ease. Also `CURVE_POINTS` and `cssEase()` for CSS `cubic-bezier()`, `timeAt()` to invert a curve, and the `seg`, `lerp` and `clamp01` helpers every recipe uses. No imports; copy it into the project. Exports and usage in Canvas Commons, GSAP, CSS and a raw render loop: [named-curves, "Using curves.ts"](rules/named-curves.md#using-curvests).
- [assets/time-warp.ts](assets/time-warp.ts): edit-style speed ramps as a whole-frame time remap. `makeTimeWarp(windows)` takes ramp windows (start, length, the slow-motion hang, its slow rate, a 0–1 strength) and returns `tau(t)`, the action time every value is evaluated at; `rate(t)`, the remap rate effects multiply into on-screen speed; and `ramps`, each window's solved fast level. Each window is time-neutral (τ = t at its edges and outside it), and the table depends on the windows alone, so it seeks correctly. No imports. Usage: [time-remap-ramps](rules/time-remap-ramps.md).

## How recipes are written

Recipes are engine-agnostic TypeScript: each value is computed from the time `t` in seconds and nothing else, using `seg(t, start, duration)`, `lerp` and the named curves. Short host snippets (Canvas Commons, GSAP, CSS) are labelled as such. State that depends on t alone seeks correctly, renders the same in any frame order and makes almost every parameter live-tunable.

## Review: "it doesn't feel premium"

Required for every piece, 3D included, before the human sees anything. Walk it in order.

1. Engine presets or linear motion anywhere visible? [named-curves](rules/named-curves.md), [linear-reads-cheap](rules/linear-reads-cheap.md)
2. BOUNCE on a position, camera or text? Swap to OUT or IN_OUT.
3. Camera moving with a leader but not sharing curve, duration and start? [camera-locked-to-leader](rules/camera-locked-to-leader.md)
4. Move, hold, move; or fades between stages? [continuous-over-cut](rules/continuous-over-cut.md), [column-whip](rules/column-whip.md)
5. A crossfade posing as a morph, or a hard re-layout? [morph-not-crossfade](rules/morph-not-crossfade.md), [no-jump-cut-relayouts](rules/no-jump-cut-relayouts.md)
6. Events timed from linear time on an eased move? [synced-events-from-curve](rules/synced-events-from-curve.md)
7. In a reel, element tweens over 0.5s, or read pauses over 0.3s between moments? (Camera whips and the final lockup are exempt.) [reel-pacing](rules/reel-pacing.md)
8. Exit animations before transitions, dissolves at cuts? [exit-is-the-transition](rules/exit-is-the-transition.md), [seams-and-vectors](rules/seams-and-vectors.md)
9. Every camera leg the same verb and length? [vary-the-move](rules/vary-the-move.md)
10. Halos, chrome, flashes, effects with no motion behind them? [one-hero-per-frame](rules/one-hero-per-frame.md), [no-hud-chrome](rules/no-hud-chrome.md), [effects-tied-to-motion](rules/effects-tied-to-motion.md)
11. Background or palette switching mid-piece? [one-background](rules/one-background.md)
12. Does the pause test pass only on drift or background dots, with the copy and the camera still? [continuous-over-cut](rules/continuous-over-cut.md)
13. More than three time-remap ramps, or a ramp off the key moments? [time-remap-ramps](rules/time-remap-ramps.md)
14. Is the ending built from new material, or does the camera travel from the text to a separate logo? [last-read-becomes-logo](rules/last-read-becomes-logo.md)

## Before animating anything

Decide, in this order:

- **The register:** calm explainer or kinetic reel. It sets durations, density and palette ([reel-pacing](rules/reel-pacing.md)).
- **For a reel, the signature motif:** the spine everything orbits, found in the subject's own material first ([signature-motif](rules/signature-motif.md)).
- **The ending:** which last line breaks into the motif and re-forms as the logo ([last-read-becomes-logo](rules/last-read-becomes-logo.md)).
- **Optionally, time-remap ramps:** which hero moments, if any, get one; at most three ([time-remap-ramps](rules/time-remap-ramps.md)).
- **The structure:** stages in a column with whips, or one continuous flight (`motion-3d`) for hype and personal reels.
- **The focal element of each moment.** It leads the camera.
- **Where the eye must be when each move lands.** The camera frames that, not the leader's endpoint.
- **Every cut, as a row in the vector ledger** ([seams-and-vectors](rules/seams-and-vectors.md)).
- **Which numbers become sliders.** Put them in the params object from the start ([live-tuning](process/live-tuning.md)).

Runnable examples that demonstrate these rules live in the `examples/` folders of the sibling skills `motion-3d` (3D) and `canvas-commons` (2D).
