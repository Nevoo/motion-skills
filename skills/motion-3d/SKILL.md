---
name: motion-3d
description: 3D motion graphics with three.js for rendered video, in any engine. Time drives one state object, ONE apply() writes it to the scene, and every value is computed from t alone, so any frame can be seeked. Covers the camera rig (position + target, frame by fill fraction, continuous keyed flight paths that never stop), 3D kinetic type (depth-pop, stacked gradient cards, punch through a stack, pull back through text, door splits, tunnels, ratcheting drums), text baked to textures, depth dissolves, layering, pixel-space worlds, speed-driven post FX, lighting basics and WebGL rendering (GPU probe, SwiftShader fallback, supersampling, font readiness). Hosts are Canvas Commons and HyperFrames. Use for "3D motion graphics", "three.js video", "camera flight", "fly through", "kinetic 3D type", "pull back through text", "WebGL render", or a 3D intro, reel or title sequence.
---

# motion-3d

Engine-agnostic doctrine and drop-in code for 3D motion graphics rendered to video with three.js. The engine (the **host**) only owns time. Canvas Commons and HyperFrames are two hosts of the same doctrine. General motion taste (curves, pacing, seams, review process) lives in the `motion-craft` skill. Canvas Commons engine idiom lives in the `canvas-commons` skill.

## The doctrine in one breath

```ts
// host: gives t (seconds). state: tweened by the host or computed from t. apply: the only writer.
function apply(t: number) {
  applyCamera(camera, path.at(t));                       // camera from a keyed monotone spline
  items.forEach((it, i) => {
    const a = state.appear[i];                           // entrance 0..1, tweened by the host
    const d = viewDepth(it.worldPos, camera.position, forward);
    it.mesh.position.z = it.z - 0.95 * (1 - a);          // depth-pop
    it.mat.opacity = Math.min(1, a * 1.4) * depthFade(d, NEAR_FAR);  // dissolve as the camera passes
  });
  lens.uniforms.uZoom.value = lerp(0.025, 0.075, hero(t)) * speed(t);       // strong only on hero snaps
  lens.uniforms.uCaPx.value = 0.45 + lerp(2, 5.5, hero(t)) * speed(t);
}
// Canvas Commons: useScene().lifecycleEvents.onBeginRender.subscribe(() => apply(clock()));
// HyperFrames:    function render() { apply(tl.time()); renderer.render(scene, camera); }
```

## Cardinal rules

1. **Time → state → one apply().** three.js objects never animate themselves. Everything that moves lives in state, and one function writes it, once per frame.
2. **Every value is computed from t alone.** No wall clocks, `+=` accumulators, damping toward last frame, unseeded randomness, or post passes that need frame history. Renderers seek, replay and split frame ranges.
3. **The camera is position + target** (+ roll, fov), written in a fixed order. Move both to translate, and move one only when you mean to swing.
4. **Frame by fill fraction** (`distFor`, `distForW`), never by a hand-picked Z.
5. **Hype and identity pieces are one continuous flight.** Stop, show, whip, stop reads as a slideshow. The camera never rests, content depth-pops along the path, and the camera flies through planes instead of cutting to them. Product demos can keep discrete stages joined by RAMP glides.
6. **Vary the leg and bake the landings.** Each move gets a different verb, and each landing pose is authored once and stored as data.
7. **Copy lands frontal, sharp and framed.** FX ride the camera's speed, so they vanish at every landing. Every whip may get a subtle lens touch, but a strong smear is reserved for one to three hero snaps. No exposure flash on every beat, and no HUD chrome.
8. **Bake text big into textures** (mipmaps, sRGB, anisotropy), after the webfonts have loaded.
9. **Choose sticker or depth layering per overlapping group,** and never mix them by accident.
10. **Taste lives with the human.** Expose every feel number as a live slider. The agent verifies facts: frame count, real fonts, nothing clipped, the camera never stops (`findStops`).

## When to read what

| Question | Read |
|---|---|
| How should a 3D piece be structured? Who writes what? | [rules/state-apply-architecture.md](rules/state-apply-architecture.md), [rules/pure-function-of-time.md](rules/pure-function-of-time.md) |
| Camera moves: translate vs swing, roll, fov | [rules/camera-position-and-target.md](rules/camera-position-and-target.md) |
| How far should the camera be? | [rules/frame-by-fill.md](rules/frame-by-fill.md) |
| One continuous flight through a world | [rules/flight-paths.md](rules/flight-paths.md), [rules/vary-the-leg.md](rules/vary-the-leg.md), [rules/landing-poses-baked.md](rules/landing-poses-baked.md) |
| Elements appearing in depth | [rules/depth-pop.md](rules/depth-pop.md) |
| A 3D word count, tagline or wordmark | [rules/stacked-gradient-cards.md](rules/stacked-gradient-cards.md), [rules/punch-through-stack.md](rules/punch-through-stack.md), [rules/playful-tilt.md](rules/playful-tilt.md) |
| Transition to the next line without a cut | [rules/pull-back-through-text.md](rules/pull-back-through-text.md), [rules/depth-dissolve.md](rules/depth-dissolve.md), [rules/door-split.md](rules/door-split.md) |
| A timeline, list or process in 3D | [rules/tunnel.md](rules/tunnel.md), [rules/drum-ratchet.md](rules/drum-ratchet.md), [rules/path-through-depth.md](rules/path-through-depth.md) |
| Getting type into three.js | [rules/text-as-texture.md](rules/text-as-texture.md) |
| Overlaps flicker or sort wrong | [rules/sticker-vs-depth-layering.md](rules/sticker-vs-depth-layering.md) |
| 3D that lines up with a 2D layout; 2D over 3D | [rules/px-space-world.md](rules/px-space-world.md), [rules/compositing-3d-and-2d.md](rules/compositing-3d-and-2d.md) |
| Speed blur, chromatic aberration, FOV kick | [rules/speed-driven-fx.md](rules/speed-driven-fx.md) |
| Looks flat or muddy; lights; colour space | [rules/lighting-and-materials.md](rules/lighting-and-materials.md) |
| Blank, black, soft or wrong-font renders; GPU flags | [rendering/webgl.md](rendering/webgl.md) |
| Wiring it into Canvas Commons | [hosts/canvas-commons.md](hosts/canvas-commons.md) |
| Wiring it into HyperFrames | [hosts/hyperframes.md](hosts/hyperframes.md) |
| Asset signatures, options, behaviour | [references/assets.md](references/assets.md) |
| Curves (RAMP, OUT, GLIDE), pacing, seams, review process | the `motion-craft` skill |

The full rule list with tags is in [rules/INDEX.md](rules/INDEX.md).

## Assets

Copy them into the project. Signatures, options and behaviour: [references/assets.md](references/assets.md).

| File | What it gives you |
|---|---|
| [assets/camera-path.ts](assets/camera-path.ts) | `cameraPath(keys)`: per-channel monotone (PCHIP) flight with `.at(t)`, `.velocity(t)`, `.speed(t)`; `applyCamera` (fixed write order); `findStops` (does it ever rest?); `normalisedSpeed` (drives FX); `sectionTimes` (arrive / drift keys). No imports. |
| [assets/depth.ts](assets/depth.ts) | `distFor`, `distForW`, `distToFit`, `pxDistance`, `pxToWorld`, `worldToPx`, `apparentScale`, `viewDepth`, `depthFade`, `windowFade`, `smoothstep`. No imports. |
| [assets/makeLabelTexture.ts](assets/makeLabelTexture.ts) | `makeLabelTexture(text, opts)` and `makeLabelPlane(text, worldHeight, opts)`: font family, weight, ink, pill and gradients as options; repaints and resizes when the webfont lands. `loadFonts(specs)`. Needs three. |
| [assets/Three.ts](assets/Three.ts) | Canvas Commons bridge node: offscreen WebGLRenderer blitted into the 2D canvas, `quality` supersampling, `setSize` only on change, optional `composer` for post FX. |

## Examples

Runnable Canvas Commons projects. Each README names the rules it demonstrates with file and line. Copy one, render it, then adapt it.

- [examples/cc-flight/](examples/cc-flight/): one continuous flight with depth-pop title, tunnel, drum, path through depth, speed-driven lens FX and a 2D lockup over 3D.
- [examples/cc-card-stack/](examples/cc-card-stack/): stacked gradient cards with punch-through, then a pull back through the headline into 2D type.

## Reviewing a 3D piece

1. Does anything animate outside apply(), or depend on the previous frame? Re-render one frame in isolation and compare.
2. Is any camera distance a magic number? Express it as a fill fraction.
3. Does the camera rest anywhere it shouldn't? Run `findStops`.
4. Is every read frontal, sharp and long enough, with FX at zero?
5. Do several legs in a row share the same verb? Vary them.
6. Is any text in a fallback face, soft, or shimmering? Check font readiness, the bake size and mipmaps.
7. Do overlapping planes flicker? Choose the layering mode per group.
8. Is there one background colour throughout, and no HUD chrome?

*Idea adapted from HyperFrames (Apache-2.0).*
