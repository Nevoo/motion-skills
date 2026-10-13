# Rendering: headless MP4, smoke check, failure modes

Canvas Commons renders in the browser. The editor's renderer plays the timeline as fast as it can and hands each frame to an exporter. There is no CLI renderer. [`scripts/render.mjs`](../scripts/render.mjs) runs that same renderer in headless system Chrome; [`scripts/smoke.mjs`](../scripts/smoke.mjs) is the pre-flight that takes about 5 s. Both are copied into the project's `scripts/` and run from the project directory ([setup.md](setup.md)).

**Verified on 0.4.0.** Both scripts ran end to end on real 0.4.0 projects (macOS, Apple M4 Pro, Chrome 155): a 2 s scene with a three.js plane, and the template's 2D scene. Each went through smoke, both GPU modes, both exporters, `--sheet-at` and stills, with matching frame counts and clean sheets. Engine facts are listed with their evidence in [verified-0.4.0.md](verified-0.4.0.md).

```bash
npm run smoke                                   # after every edit
npm run render                                  # MP4 + contact sheet in output/
npm run render -- --gpu software                # force SwiftShader (no GPU, CI)
npm run render -- --exporter webcodecs          # MP4 straight from the browser, no PNGs
npm run render -- --sheet-at 0.6,1.4,2.2,3.0    # sheet sampled where each beat lands
npm run smoke -- --stills 0.6,1.4,2.2           # full-size stills at the same moments
```

Needs: `playwright` and `vite` in the project's devDependencies, resolved from the current directory upward, so a `node_modules` shared by several projects higher up also works. Also Google Chrome installed (Playwright's `channel: 'chrome'`, so no browser download), and `ffmpeg`/`ffprobe` on PATH for the default exporter and the checks. With a shared `node_modules` above the project, Vite must be allowed to serve it; the template's `vite.config.ts` does this (see Failure modes).

## What `render.mjs` does

1. Resolves `playwright` and `vite` from the project (`createRequire` on its `package.json`), so the script works as a copy or when run by path.
2. With `--fresh`, deletes `node_modules/.vite`. Starts Vite with the project's own `vite.config.ts` (port 9000 unless taken; the real URL is read back).
3. **GPU probe** (see the table below). With no WebGL context in either mode it stops, unless `--allow-no-webgl` says the project is 2D only.
4. **Boots the editor**. Waits for `window.commons` and the `#render` button, then checks that the page stays put for 1.5 s. Vite's startup scan does not see the editor page's imports or anything behind a `?scene` import. When the browser asks for one of those, Vite re-bundles; it can then answer 504 "Outdated Optimize Dep" for a module and force a full reload. On any 5xx from the dev server, or an unstable page, it waits and reloads, up to four times, and logs the first failing URL of each attempt. Errors from an abandoned attempt are discarded. The cure is `optimizeDeps.include` in `vite.config.ts` ([setup.md](setup.md)). Measured on 0.4.0 with Vite 8.3.4: in three cold starts without that list, Vite re-bundled after startup for the editor and the WebCodecs client, plus `three` in the three.js project; none of those runs happened to hit a 504. With them listed (a three.js project, `--fresh`), Vite bundled them all at startup, before the browser asked, and the editor booted on the first attempt with no 504.
5. **Fonts**. Calls `load()` on every declared font face, awaits `document.fonts.ready`, then pauses (`--settle`, 1500 ms) before frame 0.
6. **Renders** by calling `window.commons.renderer.render({...meta.getFullRenderingSettings(), name})`, the same call the Render button's click handler makes in the 0.4.0 editor source, with the chosen exporter swapped in. `--exporter project` clicks `#render` instead and uses the exporter saved in `project.meta`. Progress comes from `renderer.onFrameChanged`, the result (success, error, aborted) from `renderer.onFinished`. The progress line divides by the player's estimate from the preview, while pass or fail uses the engine's exported count, so a line such as `frame 36/121` followed by `exported 122` is expected.
7. **Makes the MP4.** For PNG frames: `ffmpeg -framerate <fps> -i %06d.png -c:v libx264 -crf 17 -pix_fmt yuv420p -movflags +faststart`, scaled to even dimensions. For WebCodecs it picks up `output/<project>.mp4`.
8. **Verifies**, writes the contact sheet, prints one `RESULT {json}` line, and exits 0 (ok), 1 (error) or 2 (a check failed). It always closes the browser and the dev server.

## Flags

| flag | default | meaning |
|---|---|---|
| `--gpu auto/hardware/software` | `auto` | GL backend; see GPU modes |
| `--exporter image/webcodecs/project` | `image` | see Exporters |
| `--out <file.mp4>` | `output/<project>.mp4` | MP4 destination; the sheet is `<name>-sheet.jpg` beside it |
| `--sheet-at <s,s,...>` | 12 evenly spaced | contact-sheet frames at these times (seconds) |
| `--fps <n>` | project's | override the render frame rate (ignored with `project`) |
| `--crf <n>` | 17 | x264 quality for the PNG stitch |
| `--lenient` | off | accept console errors instead of failing |
| `--allow-no-webgl` | off | render even without a WebGL context (2D-only projects) |
| `--fresh` | off | clear `node_modules/.vite` first |
| `--settle <ms>` | 1500 | pause after fonts, before frame 0 |
| `--timeout <min>` | 30 | give up and clean up |
| `--port <n>` | 9000 | dev server port |

## Exporters

| exporter | how | MP4 frames |
|---|---|---|
| `image` (default) | PNG sequence to `output/<project>/NNNNNN.png`, stitched by system ffmpeg at CRF 17 | equal to the frames exported |
| `webcodecs` | `@canvas-commons/webcodecs` encodes H.264 in the page (preset "very high"); the dev server writes `output/<project>.mp4` | **one fewer**: it encodes frames `from` to `to - 1` and skips the last one by design, so the clip lasts exactly `(to - from) / fps` |
| `project` | presses the editor's Render button | depends on the exporter saved in `project.meta` |

**Not offered: `@canvas-commons/ffmpeg`.** It is deprecated in 0.4.0, downloads an ffmpeg binary at install, and comes out one frame short: its server writes `-t (to - from) / fps` while the renderer exports `(to - from) + 1` frames (read from `ffmpeg/lib/server/index.js` and `Renderer.run`). `render.mjs` refuses it, including when `project.meta` selects it.

WebCodecs needs a secure context: `VideoEncoder` exists on `http://localhost` but not on `about:blank`. Measured in headless Chrome 155: avc, hevc, vp9 and av1 encoders are all available with Metal and with SwiftShader. Measured on 0.4.0: renders that exported 122 and 67 frames gave WebCodecs MP4s of 121 and 66 frames.

## GPU modes

Chrome flags per mode and platform, as `render.mjs` and `smoke.mjs` pass them:

| mode | platform | Chrome flags | checked |
|---|---|---|---|
| `hardware` | macOS | `--use-gl=angle --use-angle=metal --ignore-gpu-blocklist` | measured (Chrome 155, Apple silicon) |
| `hardware` | Linux, Windows | `--ignore-gpu-blocklist` (Chrome picks its default backend) | unverified on Linux/Windows |
| `software` | all | `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist` | measured on macOS |

How `auto` decides. Launch with the `hardware` flags, create a WebGL2 (else WebGL) context on a blank page, and read the renderer string (`UNMASKED_RENDERER_WEBGL` when `WEBGL_debug_renderer_info` is available, otherwise `gl.RENDERER`). Relaunch with the `software` flags when there is no context, or when the string matches this case-insensitive pattern:

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

Measured on an Apple M4 Pro with Chrome 155, headless Chrome already picked Metal with no flags at all. Playwright adds `--enable-unsafe-swiftshader` to every launch but never `--disable-gpu`, so it only allows the fallback.

### Measured cost

Real Canvas Commons 0.4.0 renders on an Apple M4 Pro with headless Chrome 155, 1920x1080 at 60 fps. Render time runs from the start of the render to the renderer's finished event; the total includes Vite start, editor boot, fonts and the stitch.

| scene | mode | exporter | frames | render | per frame | total |
|---|---|---|---|---|---|---|
| 2 s, three.js plane (2x supersample) + text | Metal | image | 122 | 2.0 s | 16 ms | 7.6 s |
| same | SwiftShader | image | 122 | 14.7 s | 120 ms | 22.3 s |
| same | Metal | WebCodecs | 122 (MP4 121) | 4.5 s | 37 ms | 9.7 s |
| template, 2D only, 1.1 s | Metal | image | 67 | 1.0 s | 15 ms | 6.3 s |
| same | SwiftShader | image | 67 | 2.6 s | 39 ms | 9.7 s |
| same | Metal | WebCodecs | 67 (MP4 66) | 3.5 s | 52 ms | 8.6 s |

With a WebGL layer, SwiftShader costs about 7x per frame; with 2D only, about 2.5-3x (2.6x and 3.1x in two runs; those 2D renders lasted only about 1 s, so treat that ratio as rough). Forcing it everywhere "to be safe" therefore only buys a slower render. Use `software` where there is no GPU (CI, containers), or as the fallback when a hardware render crashes. SwiftShader can also rasterise text slightly differently; compare a still from each mode before mixing them in one project. For these short pieces, PNG plus stitch was faster than WebCodecs. The smoke check took about 5 s wall time.

## Verify every render

**Frame count.** The frame count equals what the engine reports it exported. For Canvas Commons 0.4.0 that is (to − from) + 1 frames, inclusive of the last frame. `from` is the first frame of the range, and `to` is the renderer's own recalculated duration in frames, capped by the range end.

Do not predict the count from duration x fps. Measured on 0.4.0, the engine's count depends on how the timeline ends:

| scene | 60 fps | 30 fps |
|---|---|---|
| `waitFor(2)` | 121 | 60 |
| a 2 s signal tween | 122 | 61 |
| `all(tween, waitFor)`, both 2 s | 122 | 61 |
| `waitFor(1.1)` | 66 | 33 |

In every case, the PNGs on disk and the stitched MP4 matched the engine's `(to − from) + 1` exactly.

`render.mjs` checks these numbers exactly and exits 2 on any mismatch:

| number | source | must equal |
|---|---|---|
| expected | `(to - from) + 1`, with `to` read from the renderer after the render (a private field; if it cannot be read, the player's estimate is used with a tolerance of 1 and a warning) | exported |
| exported | the highest frame the renderer reported, minus `from`, plus 1 | expected |
| PNGs on disk | files in `output/<project>/` | exported |
| MP4 frames | `ffprobe -count_frames` on the result | exported (PNG stitch) or exported − 1 (WebCodecs) |
| page / console errors | Playwright `pageerror` and console `error` events (the engine logs scene errors to the console) | 0, unless `--lenient` for console errors |

Then look, once, at the right things:

1. **The contact sheet** (`<name>-sheet.jpg`). The default of 12 evenly spaced frames shows completeness: nothing blank, nothing clipped, one background. For a verification sheet, pass `--sheet-at` with the times where each beat has landed, the boundaries between phases, so every tile shows a settled layout instead of a frame halfway into a move.
2. **Full-size stills at the same times**: `npm run smoke -- --stills <t1,t2,...>` writes PNGs to `output/still/<project>/` with the engine's own `renderFrame`. Check fonts (no fallback face), 3D present, text not clipped.

Frames verify facts: layout, fonts, completeness. They cannot verify feel; that is what the live panel is for ([live-panel.md](live-panel.md)).

## The smoke check

`smoke.mjs` boots the editor headless and waits for the player to recalculate, which runs every frame of every scene, so runtime errors in later beats surface too. It passes only when all of these hold:

- the editor booted (`window.commons` present) and `#render` exists;
- WebGL reads back a version and renderer string (printed); `--allow-no-webgl` waives this for 2D-only projects;
- zero `pageerror`s;
- zero console errors. Offline, the editor's own stylesheets fail to load and count: highlight.js from `unpkg.com`, and Roboto plus JetBrains Mono imported from Google Fonts. An unreachable font host of your own counts too. `--lenient` skips this check;
- every requested still was written.

It also reports, without failing: every 504 from the dev server, with its URL and the boot attempt it hit; and, from Vite's own log, the dependencies Vite had to re-bundle after startup (`late deps:`), with the hint to add them to `optimizeDeps.include`. A 504 names the request that arrived with a stale bundle version, which is not always the module that was found late, so add the `late deps:` list. The last line carries the count, e.g. `SMOKE PASS {...} 504s=0`. `render.mjs` reloads through the same 504s but logs only the first failing URL of each attempt.

It prints the project name, duration, render fps, size, exporters and loaded font families (the editor's own Roboto and JetBrains Mono always appear). Run it after every edit; it takes about 5 s, a render longer.

`renderFrame(settings, t)` converts `t` to a frame with the fps of its previous call (30 on a fresh page). Measured on 0.4.0: on a fresh page, a 60 fps project's first `renderFrame` at 1 s landed on frame 30, and the second on frame 60. `smoke.mjs` primes it with a still at 0 s first.

## Failure modes

| symptom | likely cause | fix |
|---|---|---|
| fewer frames than expected, renderer said success | stale Vite dependency cache (observed on older releases) | `--fresh`, render again |
| editor blank or 504 on first load; smoke prints `504s` above 0 or a `late deps:` line | Vite found a package after startup (an editor-page import, or one behind a `?scene` import such as `three`) and re-bundled | add each module on the `late deps:` line to `optimizeDeps.include` in `vite.config.ts`, then `npm run smoke -- --fresh`. Meanwhile the harness reloads up to 4 times; if it persists, kill stray servers (`lsof -ti tcp:9000` then `xargs kill`) and use `--fresh` |
| editor blank in smoke or render; `style.css` 403, `@canvas-commons/2d/editor` 404, then "Easing may not be the empty string" | `node_modules` sits above the project (a shared install) and outside Vite's `server.fs.allow` | the template's `vite.config.ts` adds that folder to `server.fs.allow`; copy it into older projects |
| "ResizeObserver loop completed with undelivered notifications" in the terminal | the editor's own panels, echoed by Vite's client | harmless; Playwright does not report it as a page or console error |
| `npm run build` fails with type errors inside `node_modules` (`chroma-js`, `project.d.ts`, `@types/dom-webcodecs`) | 0.4.0's published typings with TypeScript 5.9 | `skipLibCheck: true` (set in the template's `tsconfig.json`) |
| console errors fail the render while offline | the editor's unpkg and Google Fonts stylesheets, or your own font host, are unreachable | go online, or `--lenient` once you have checked the errors are only these |
| "no WebGL context in either GPU mode" (render), or smoke fails its WebGL check | no GPU and no SwiftShader | for a 2D-only project, pass `--allow-no-webgl` to both `render.mjs` and `smoke.mjs`; otherwise run on a machine with Chrome's SwiftShader |
| first frames in the wrong font | face not loaded before frame 0, or never declared | declare it (stylesheet link or `@font-face`); check the sheet; raise `--settle` |
| 3D layer blank or black | no WebGL context in this mode | `npm run smoke` shows the renderer string; try `--gpu software` |
| page crashes mid-render | GPU memory (huge supersample buffers) | `--gpu software`, or lower the 3D node's supersample |
| render ignores tuned values | fresh browser profile: defaults only | copy values back into `DEFAULTS` ([live-panel.md](live-panel.md)) |
| "exporter ... is not registered" | its plugin is missing from `vite.config.ts` | add `webcodecs()` |
| "exporter @canvas-commons/ffmpeg is deprecated ..." | `project.meta` selects the ffmpeg exporter | switch to image or WebCodecs in the editor, or pass `--exporter image` |
| MP4 background is black | transparent frames | set a background ([setup.md](setup.md)) |
| MP4 shorter than the PNG count | a missing PNG: ffmpeg's numbered-sequence input stops at the first gap | re-render; the frame-count check reports it (exit code 2) |
| a word missing from a title, or the title on two lines | negative `letterSpacing` with the default `textWrap` | `textWrap={false}` on single-line text ([txt-gotchas.md](txt-gotchas.md), section 6) |
| a still lands at the wrong time | `renderFrame` fps quirk | use `smoke.mjs --stills`, which primes it |
| "could not start Google Chrome" | Chrome not installed | install Chrome, or `npx playwright install chrome` |

## Scaling up (not implemented)

The renderer honours the `range` setting, and the image exporter names files by absolute frame number, so several browsers could each render a slice of the timeline into the same folder before one stitch. Untested on 0.4.0.

*Idea adapted from HyperFrames (Apache-2.0).*
