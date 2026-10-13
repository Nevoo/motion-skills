# Host: HyperFrames

How the time → state → render() doctrine maps onto a HyperFrames composition with a three.js layer. HyperFrames basics (project setup, data attributes, the CLI, lint, check, preview and render) are covered by the official HyperFrames skills: start at `hyperframes`, then `hyperframes-core`, and the three.js adapter page in `hyperframes-animation`. This page covers only the integration contract for a seekable three.js hero layer.

## What the host owns

HyperFrames owns **time**. It seeks the composition to the time of each frame it captures, in any order and possibly in parallel browser workers. Your page owns a state object, one paused timeline that tweens it, and one `render()` that writes the state into three.js and draws.

## The contract

1. **Root element** carries the composition id, duration, fps and size as data attributes. Always set the duration explicitly: a three.js layer gives the host nothing to infer it from.
2. **One canvas** for WebGL, with CSS size equal to the composition and a drawing buffer at 2× (`width`/`height` attributes at double the size). Create the renderer on it with `setPixelRatio(1)` and `setSize(W * 2, H * 2, false)`, so device pixel ratio never leaks in. Use `preserveDrawingBuffer: true`, because the capture may read the canvas after your frame task ends.
3. **State** is a plain object. A **paused** GSAP timeline tweens its fields, with `onUpdate: render`. Register the timeline with the runtime under the composition id.
4. **Seek event.** Listen for the host's seek event: seek your timeline to the event's time, then call `render()`. Render on update **and** on seek, because a seek that lands on the current time may not fire an update.
5. **Readiness.** Build asynchronously: load fonts, bake textures, measure, calibrate, then create the timeline, seek it to 0 and render once. Register the build's promise with the runtime's readiness hook **synchronously**, in the same script that starts the build, under a key unique to the piece. The first capture waits for it.

The runtime names, as documented for HyperFrames 0.8.x (check the installed skill, because they're versioned):

| Hook | Name |
|---|---|
| Timeline registry | `window.__timelines[compositionId] = tl` |
| Seek event | `window` event `hf-seek`, time in `event.detail.time` (the three.js adapter also sets `window.__hfThreeTime`) |
| Readiness | `window.__hf.buildReady[uniqueKey] = buildPromise` |

## Recipe (illustrative shape)

```js
const state = {P: 0, fovKick: 0, words: WORDS.map(() => ({appear: 0, split: 0}))};
let tl = null;

function render() {
  if (!tl) return;                       // not built yet
  const t = tl.time();
  applyCamera(camera, path.at(t));       // pure-function channels read t
  // ...tweened channels read state; write meshes, uniforms...
  renderer.render(scene, camera);        // or composer.render(0): explicit delta, t reaches passes via uniforms
}

async function build() {
  await loadFonts(['700 100px "Inter"']);              // every face and weight used
  // bake labels, measure widths, calibrate camera distances (distForW), build meshes
  tl = gsap.timeline({paused: true, onUpdate: render});
  tl.fromTo(state.words[0], {appear: 0}, {appear: 1, duration: 0.42, ease: OUT, immediateRender: false}, 0.0);
  // ...all tweens, positioned absolutely...
  window.__timelines = window.__timelines || {};       // build() may run before the runtime creates the registry
  window.__timelines[COMPOSITION_ID] = tl;
  tl.seek(0);
  render();
}
window.__hf = window.__hf || {};
window.__hf.buildReady = window.__hf.buildReady || {};
window.__hf.buildReady['my-piece'] = build();           // synchronously, same script, unique key
window.addEventListener('hf-seek', e => {
  if (tl && typeof e.detail?.time === 'number') tl.seek(e.detail.time);
  render();
});
```

Easing functions from the `motion-craft` skill's curves asset have the signature `(t, from?, to?) => number`, matching `curves.ts`. GSAP calls an ease with progress only, so the defaults (0 → 1) apply and it can be passed directly as `ease`.

## Live tuning

Keep every feel number in one params object `P` that render() reads, the same discipline as the other hosts (process in the `motion-craft` skill). When a value changes: update `P`, rebuild or recompute whatever was derived from it, seek the timeline to its current time, and render.

```js
const P = {pushTime: 0.42, tunnelSpin: 0.35, endScale: 3.2};   // baked defaults
const STRUCTURAL = new Set(['pushTime']);                         // baked into tween durations

function setParam(key, value) {
  P[key] = value;
  if (STRUCTURAL.has(key)) rebuildTweens();   // tl.clear(), then add the tweens again from P
  recomputeDerived();                         // camera keys, distances, normalisedSpeed's maximum
  tl.seek(tl.time());                         // re-apply tween values at the same time
  render();
}
```

- Live values (read in render()) need only the seek and render. Structural ones need the rebuild. Keep the same timeline object, so its registration stays valid.
- Mount the panel only in preview (for example behind a `?tune` URL flag), so it never appears in captured frames.
- Use plain-language labels ("tunnel camera spin", not a variable name), give every keyboard shortcut a visible button, and include a "copy values" button. Renders use the baked defaults, so paste tuned values back into `P`.

## Velocity under GSAP

A GSAP tween can't report a property's value at an earlier time, but speed FX and trails need exactly that. Either:

- compute that channel from a pure function (a `legPath` or `cameraPath`, or a constant creep summed under eased moves from the first frame), or
- record every tween you add to a tracked channel (start, duration, from, to, ease) as you add it. A small `trackAt(name, t)` then replays the segments for any `t`.

Then `v(t) = (x(t + h) − x(t − h)) / 2h` works at any seek position. See [../rules/speed-driven-fx.md](../rules/speed-driven-fx.md).

## Pitfalls

- **Pinning versions.** Load three.js through an import map, and pin the same version for the core module and the addons path. Mixed versions fail silently.
- **CSS animations or `requestAnimationFrame` loops** next to the WebGL layer aren't driven by the seek. Put everything that moves on the one timeline.
- **`fromTo` without `immediateRender: false`** writes start values at build time, which clobbers earlier tweens on the same field.
- **Heavy work after the readiness promise resolves** (shader compiles on first render) leaves the first frames blank. Render once inside build, before resolving.
- **SwiftShader on macOS** runs about 7× slower per frame with a three.js layer (measured on an Apple M4 Pro, Chrome 155), and text rasterises differently. Render with the hardware GPU option. See [../rendering/webgl.md](../rendering/webgl.md).

*Idea adapted from HyperFrames (Apache-2.0).*
