# motion-3d rules

One technique or principle per file. Read the architecture pair first. It's what makes every other rule seekable and renderable.

## Architecture

- [state-apply-architecture](state-apply-architecture.md) — time drives one state object; ONE apply() writes it to three.js; the host only owns time. *architecture, state, host*
- [pure-function-of-time](pure-function-of-time.md) — every value from t alone; what breaks seeking and the seek-safe replacement for each. *architecture, determinism, rendering*

## Camera

- [camera-position-and-target](camera-position-and-target.md) — position + target (+ roll, fov), written in a fixed order; move both to translate, one to swing. *camera, rig*
- [frame-by-fill](frame-by-fill.md) — place the camera by fill fraction with distFor / distForW, never a hand-picked Z. *camera, framing*
- [flight-paths](flight-paths.md) — one continuous flight as a monotone keyed spline; arrive → slow drift → next; no key is a full stop. *camera, flight, continuity*
- [landing-poses-baked](landing-poses-baked.md) — author, tune and bake landing poses as constants; never measure per frame. *camera, workflow, determinism*
- [vary-the-leg](vary-the-leg.md) — a different verb, axis or lens per leg; repeating one move turns a flight into a carousel. *camera, pacing, flight*

## Entrances and transitions

- [depth-pop](depth-pop.md) — elements rush forward from behind their rest depth while growing and fading in. *entrance, depth, typography*
- [punch-through-stack](punch-through-stack.md) — the camera punches card-to-card down a stack as each card pops. *camera, typography, stack*
- [pull-back-through-text](pull-back-through-text.md) — reveal the next line by dollying back through it while the front content shrinks away. *transition, camera, typography, reveal*
- [depth-dissolve](depth-dissolve.md) — fade planes by view depth so flying through one reads as punching through it. *depth, flight, fade*
- [door-split](door-split.md) — letters part like doors as the camera pushes through a word. *typography, flight, transition, per-letter*

## Objects and set pieces

- [stacked-gradient-cards](stacked-gradient-cards.md) — overlapping word cards, each with its own gradient; the base of 3D counts and wordmarks. *typography, layout, stack*
- [playful-tilt](playful-tilt.md) — life without lights: resting leans, unwinding pops, a group turn that straightens for the payoff. *typography, life, materials*
- [tunnel](tunnel.md) — items on a tightening spiral down the flight axis, visible only in a window ahead, flown with a barrel roll. *flight, sequence, depth*
- [drum-ratchet](drum-ratchet.md) — a 3D slot drum of names that slows on each name but never stops. *list, rotation, typography*
- [path-through-depth](path-through-depth.md) — a line that draws itself through depth, with nodes popping as the head passes. *line, process, depth*

## Text, layering, worlds

- [text-as-texture](text-as-texture.md) — bake type big into a CanvasTexture (mipmaps, sRGB, anisotropy); per-letter atlases. *typography, textures, fonts*
- [sticker-vs-depth-layering](sticker-vs-depth-layering.md) — paint-order layering vs true occlusion; pick one per overlapping group. *layering, materials, depth*
- [px-space-world](px-space-world.md) — a world in screen pixels: z=0 maps 1:1 to the 2D layout; builders that never animate themselves. *camera, compositing, layout*
- [compositing-3d-and-2d](compositing-3d-and-2d.md) — 2D under and over a transparent WebGL layer; same-frame hand-offs at matched size. *compositing, layering, host*

## Look

- [speed-driven-fx](speed-driven-fx.md) — zoom blur, chromatic aberration, FOV kick and trails from normalised camera speed; blur discipline. *fx, post, camera, blur*
- [lighting-and-materials](lighting-and-materials.md) — unlit by default; when to move to matcap or standard materials; colour space and tone mapping. *materials, lighting, colour*
