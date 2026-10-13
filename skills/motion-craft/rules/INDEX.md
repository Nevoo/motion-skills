# motion-craft rules

## Curves and timing

- [named-curves](named-curves.md) — the eight named cubic-bezier curves, what each does, measured shape data, and what each is banned from. *easing, curves, foundations*
- [curve-pairing](curve-pairing.md) — physical properties share one curve and duration; colour, weight and opacity ride IN_OUT or OUT at the same duration. *easing, morph, multi-property*
- [speed-ramps](speed-ramps.md) — the RAMP family for linger-whip-settle moves, compared with the asymmetric wind-up, burst, long-settle nudge. *easing, speed-ramp, whip, reel*
- [time-remap-ramps](time-remap-ramps.md) — edit-style ramps that bend time for the whole frame (fast, slow-motion hang, snap); time-neutral and seek-safe, effects at on-screen speed, at most three per piece. *speed-ramp, time-remap, reel, effects*
- [linear-reads-cheap](linear-reads-cheap.md) — drifts glide, rotations arc once onto symmetry, typewriters step per character, counts ease. *easing, drift, rotation, typewriter, taste*
- [synced-events-from-curve](synced-events-from-curve.md) — fire events from the curve (with the inversion math) or key them off the swept value, never off linear time. *easing, timing, sync, math*

## Pacing and continuity

- [one-moment-one-block](one-moment-one-block.md) — one block per coherent moment, reactions as offsets inside it, cause and effect adjacent. *pacing, timeline, structure*
- [continuous-over-cut](continuous-over-cut.md) — no move-hold-move, overlapped hand-offs, one tween over a whole distance, and the pause test, passed by the copy or the camera, never by drift. *pacing, continuity, camera, transitions*
- [reel-pacing](reel-pacing.md) — concrete durations for the explainer and reel registers, plus a dead-spot audit. *pacing, timing, reel, explainer*
- [stagger-waves](stagger-waves.md) — stagger shorter than the item duration, one shared curve, a wave that travels from its cause. *stagger, pacing, reveal*

## Camera

- [camera-locked-to-leader](camera-locked-to-leader.md) — same curve, duration and start as the leading element; one camera state, one writer. *camera, framing, sync*
- [column-whip](column-whip.md) — stages in one column, RAMP whips between them, a synced 1 to 0.9 to 1 scale dip. *camera, transitions, reel, speed-ramp*
- [vary-the-move](vary-the-move.md) — identical legs read as a slideshow; keep the grammar, vary verbs and lengths, no spring on a camera. *camera, variety, pacing*

## Transitions and seams

- [seams-and-vectors](seams-and-vectors.md) — vector ledger, cut while both sides are moving, ACCEL into OUT for matched speed, never dissolve. *transitions, seams, cuts, velocity*
- [exit-is-the-transition](exit-is-the-transition.md) — content never animates itself out; the transition carries it away; only the end fades. *transitions, exits, continuity*
- [morph-not-crossfade](morph-not-crossfade.md) — keep one element alive and tween every shared property; new parts are born at the old part's spot. *morph, transitions, continuity*
- [no-jump-cut-relayouts](no-jump-cut-relayouts.md) — tween position, size and crop together for every layout change, even when a reference cuts. *layout, morph, transitions, taste*

## Type and motifs

- [kinetic-headlines](kinetic-headlines.md) — word-by-word builds with one accent word; type never bounces and lands sharp. *typography, kinetic-type, reel, stagger*
- [kinetic-glyph-stretch](kinetic-glyph-stretch.md) — stretch real glyphs about their measured optical centre; the comet trail from one moving value. *typography, kinetic-type, glyphs, comet*
- [signature-motif](signature-motif.md) — one repeating visual as a reel's spine, found in the subject's own material first; four proven motif concepts and the reel checklist. *reel, motif, structure, concept*
- [formation-by-bearing](formation-by-bearing.md) — converge elements into slots by bearing; spin as one arc ending on symmetry. *formation, choreography, rotation, convergence*
- [last-read-becomes-logo](last-read-becomes-logo.md) — the motif persists, and the last line read breaks and re-forms into the logo as one morph; never new material, never a camera trip to a separate logo. *ending, logo, morph, motif*

## Taste guardrails

- [one-hero-per-frame](one-hero-per-frame.md) — one hero per frame and card; hierarchy instead of halos, auras and glows. *hierarchy, design, taste, typography*
- [faithful-product-ui](faithful-product-ui.md) — rebuild the real product UI from its real tokens and copy; invented UI reads as fake. *product-demo, design, taste*
- [no-hud-chrome](no-hud-chrome.md) — no corner labels, counters or progress rules on kinetic edits; detail lives in the hero motion; overlays that track a build are content. *taste, reel, design*
- [effects-tied-to-motion](effects-tied-to-motion.md) — post effects driven by on-screen camera speed, time remap included; subtle on every whip, strong smear on 1–3 hero snaps; one hero light moment. *effects, post, motion-blur, shaders*
- [one-background](one-background.md) — one background colour and one palette per piece, background outside the camera. *colour, design, taste, continuity*
