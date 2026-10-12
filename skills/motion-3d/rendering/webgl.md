# Rendering WebGL to video

Getting three.js pixels out of a headless browser: correct, sharp, identical every run, and fast. These points apply to any host. The host-specific harnesses live in the `canvas-commons` skill and the official HyperFrames skills.

## 1. Get a GPU, or a known fallback

Depending on platform and version, headless Chrome may get a GPU, no GPU, a blocklisted GPU, or a silent software fallback. Chrome 155 on Apple silicon picked Metal with no flags at all, while containers usually have no GPU. Pin the flags explicitly, and probe before rendering. The `canvas-commons` skill's `scripts/render.mjs` and `scripts/smoke.mjs` implement this probe; use that harness rather than writing your own.

This table, the pattern and the renderer-string table mirror `canvas-commons` → `references/rendering.md`, the canonical source. Update both together.

| mode | platform | Chrome flags | checked |
|---|---|---|---|
| `hardware` | macOS | `--use-gl=angle --use-angle=metal --ignore-gpu-blocklist` | measured (Chrome 155, Apple silicon) |
| `hardware` | Linux, Windows | `--ignore-gpu-blocklist` (Chrome picks its default backend) | unverified on Linux/Windows |
| `software` | all | `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist` | measured on macOS |

The probe: launch with the `hardware` flags, create a WebGL2 (else WebGL) context on a blank page, and read the renderer string (`UNMASKED_RENDERER_WEBGL` when `WEBGL_debug_renderer_info` is available, otherwise `gl.RENDERER`). Relaunch with the `software` flags when there is no context, or when the string matches this case-insensitive pattern:

```js
/swiftshader|llvmpipe|software|basic render/i
```

| renderer string contains | what it is |
|---|---|
| `ANGLE Metal Renderer: <GPU>` | hardware, macOS (measured: `ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version)`) |
| `SwiftShader` | Chrome's software rasteriser (measured: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0) ...), SwiftShader driver)`) |
| `llvmpipe` | Mesa software GL on Linux (unverified on Linux/Windows) |
| `Software` / `Basic Render` | Microsoft Basic Render Driver (WARP) on Windows (unverified on Linux/Windows) |
| no context | WebGL unavailable: 3D layers render blank |

Use the system Chrome (`channel: 'chrome'` in Playwright) when the tool's own browser downloads aren't installed.

**SwiftShader is a fallback, not a default.** It's CPU rasterisation: about 7× slower per frame with a three.js layer (120 vs 16 ms per frame at 1920×1080 with 2× supersampling) and about 2.6× with 2D only, measured on Canvas Commons 0.4.0 renders on an Apple M4 Pro with Chrome 155. Text also rasterises differently. Compare a still from each mode before mixing them in one project. Use it where there is no GPU (CI, containers) or as the fallback when a hardware render crashes. On a Mac, render with Metal.

**Parallel workers.** Because frames depend on t and nothing else, a long render could in principle be split into frame ranges across several browser instances, with the outputs concatenated. That's the idea only: it isn't implemented in the canvas-commons harness and is untested on 0.4.0. History-dependent state makes the ranges disagree at the seams.

## 2. Supersample and pin the pixel ratio

- Render the WebGL buffer at **2×** the output size and let the downsample anti-alias it. Keep `antialias: true` as well. This is what keeps baked text and tilted card edges clean. 3× rarely pays for itself.
- **`renderer.setPixelRatio(1)`, always.** The supersample factor is the only multiplier. `window.devicePixelRatio` differs between a laptop preview and a headless renderer, so the same piece would come out at different sharpness and different line widths.
- Call `setSize` only when the size actually changes. It reassigns `canvas.width/height`, which reallocates and clears the buffer. The Canvas Commons bridge node guards this.
- Fat lines and anything with a `resolution` uniform get the **drawing-buffer** size, not the CSS size.

## 3. Fonts and readiness before the first frame

1. Declare webfonts with `font-display: block`, so text never paints in a fallback face.
2. `await document.fonts.load('<weight> <size> "<family>"')` for every face and weight you bake, then `await document.fonts.ready`.
3. Only then bake textures and measure widths. Camera distances computed from widths (`distForW`) depend on the real face.
4. Finish building (geometry, materials, a first `render()` to compile shaders) before signalling ready to the host.
5. The harness waits for that readiness, and for `document.fonts.ready`, before capturing frame 0.

A smoke check before every full render pays for itself. Load the page headless, assert that the WebGL renderer string is the one you expect, that there were zero page errors, and that a sampled frame isn't blank. Then render.

## 4. Why history-dependent post passes break seeking

A post pass that reads the previous frame works only when frames arrive in order, from the start, in one process. Examples: afterimage or feedback trails, temporal anti-aliasing accumulation, motion blur from a previous-frame buffer, and auto-exposure that adapts over time. A renderer that seeks, replays from a reset or splits ranges across workers feeds such a pass the wrong history. The result is trails from frames that never happened, missing blur on the first frame of each range, and flicker at range seams.

Rebuild such effects from t instead: zoom blur and chromatic aberration from the camera's analytic speed, trails from positions at `t − Δ`, grain reseeded by frame index ([../rules/speed-driven-fx.md](../rules/speed-driven-fx.md)). If an effect truly needs history, render its own sub-frames inside the current frame from t.

The same applies to the post chain's clock. Call `composer.render(0)`. Without an argument, three's EffectComposer computes a wall-clock delta between calls, which differs between preview, render and every seek. Any pass that changes over time must read t (or the frame index) from a uniform set in apply(), never the delta. Stock passes that integrate the delta (FilmPass's `time`) or count frames (GlitchPass) need their uniforms set from t, or replacing.

## 5. Checks after a render

- The frame count equals what the engine reports it exported. Canvas Commons 0.4.0 exports (to − from) + 1 frames, including the last frame. Engine and frames on disk must agree; an image-sequence MP4 matches them; a WebCodecs MP4 holds exported − 1 (that exporter skips the last frame; measured exports of 122 and 67 frames gave MP4s of 121 and 66). Don't predict the count from duration × fps: on 0.4.0 it depends on how the timeline ends (at 60 fps a `waitFor(2)` scene exports 121 frames, a 2 s signal tween 122). A silent short render usually means a stale bundler cache or a crashed worker.
- Contact sheet at phase boundaries: text is the real face, nothing is clipped, nothing is blank.
- Re-render one frame in isolation and compare it with the same frame from the full render. They must match.

*Idea adapted from HyperFrames (Apache-2.0).*
