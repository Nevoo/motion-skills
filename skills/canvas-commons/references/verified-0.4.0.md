# Engine facts, checked against npm `@canvas-commons/*` 0.4.0

Every engine claim in this skill was checked against the published 0.4.0 packages, not against memory or an older checkout. Use this page to see how each claim was checked, and to re-check after an upgrade.

## How a claim was checked

| level | meaning |
|---|---|
| **source** | read in the published package (`npm pack @canvas-commons/<pkg>@0.4.0`, then read `lib/` or `src/`) |
| **types** | compiled with TypeScript 5.9.3 against the 0.4.0 typings; `@ts-expect-error` lines prove an API is absent |
| **browser** | measured in headless system Chrome 155 on macOS (Apple silicon) |
| **runtime** | ran inside a real 0.4.0 project (macOS, Apple M4 Pro, Chrome 155), measured from rendered pixels or the engine's own counters |

## Gotchas from older guides

| claim | 0.4.0 | checked | where |
|---|---|---|---|
| The pivot signal is `anchor`; there is no `offset` signal | holds | source, types | `2d/src/lib/components/Layout.ts` (`@vector2Signal('anchor')`) |
| A `Txt` scales about its line-box centre, not the ink centre of its glyphs | holds; text is now measured with canvas font metrics, not a DOM box | source, runtime (a 3x scale moved the ink centre from 26 to 78.5 px below the box centre) | `Layout.localToParent`, `text/lineMetrics.ts` `lineBaselineOffset` |
| `position` on a `layout={false}` child of a layout parent is ignored | **0.1.0 already respects `x`/`y` on a `layout={false}` node; the older guidance claiming it was ignored was wrong**: `layout={false}` makes the node its own layout root and `x`/`y` read its own signal | source (0.4.0 and 0.1.0), types, runtime (rendered at the set position) | `Layout.ts` `layoutEnabled`, `isLayoutRoot`, `getX`/`getY` |
| Camera API: `centerOn`, `zoom`, `reset`, `followCurve` | holds; also `followCurveReverse`, `followCurveWithRotation(Reverse)`, `Camera.Stage` | source, types | `2d/src/lib/components/Camera.ts` |
| `waitUntil` takes an event name (string) | holds; `waitUntil(3.9)` is a type error | source, types | core `waitUntil(event: string, after?)` |
| Plugin `player` hook + `requestRender()` repaints a paused frame | holds | source, types, runtime (paused canvas unchanged after a param change without it, repainted through the panel) | editor calls `plugins.forEach(p => p.player?.(player))`; `Player.run` re-dispatches render when paused and a render was requested |
| `useScene().lifecycleEvents.onBeginRender` | holds; also `onBeforeRender`, `onFinishRender`, `onAfterRender` | source, types | core `LifecycleEvents` |
| `@signal()` / `@initial()` decorators | holds; `@initial` must sit above `@signal` or the engine logs "Missing property decorator" | source, types | `2d/src/lib/decorators/signal.ts` |
| `createSignal`, `tween`, `clampRemap`, `sequence`, `chain`, `all`, `waitFor`, `DEFAULT`, `useDuration`, `createEffect`, `createDeferredEffect`, `createComputed` | holds, all root exports of `@canvas-commons/core` | types | core `lib/index.d.ts` |
| Deep imports such as `@canvas-commons/2d/lib/components` or `@canvas-commons/core/lib/tweening` | **removed**: both packages ship one bundled `lib/index.js` behind an `exports` map | source | each `package.json` `exports` |
| Editor package `@canvas-commons/ui` | **renamed** to `@canvas-commons/editor` | source | npm (404 for `ui`), official scaffolder template |
| Render button `#render`, `data-rendering` while busy | holds; it sits in the Video Settings pane, the default sidebar tab | source, runtime (`render.mjs --exporter project` clicks it) | editor `dist/main.js` |
| Dragging a time event shifts later events; SHIFT-drag moves only that one | holds | source | editor calls `timeEvents.set(name, offset, shiftKey)` |

## New in 0.4.0 (worth knowing)

| fact | checked | where |
|---|---|---|
| The editor exposes `window.commons = {project, meta, renderer, presenter, player, playback, selected}` (`selected` is the node picked in the inspector, or null) | source, runtime | editor `main.js` bootstrap |
| `?render` in the editor URL starts a render on load | source | editor `main.js` bootstrap |
| FFmpeg exporter is deprecated; the scaffolder recommends `@canvas-commons/webcodecs` | source | `@canvas-commons/create` `index.js` |
| The FFmpeg exporter writes one frame short: it limits output to `-t (to - from) / fps` while `(to - from) + 1` frames are exported | source | `ffmpeg/lib/server/index.js` (output options), core `Renderer.run` (`exporter.start(sounds, to - from)`) |
| The WebCodecs exporter encodes frames `from` to `to - 1` and skips the last exported frame, so its MP4 lasts exactly `(to - from) / fps` | source, runtime (122 exported, 121 in the MP4; 67 and 66) | `webcodecs/lib/client/index.js` `handleFrame` (`frame >= duration`) |
| WebCodecs can encode avc / hevc / vp9 / av1 in headless Chrome on `localhost`, with Metal and with SwiftShader | browser | `VideoEncoder.isConfigSupported` in headless Chrome 155 on a `localhost` page; `VideoEncoder` is absent on `about:blank` (not a secure context) |
| Layout is computed by yoga; `layoutSelf`, `layoutChildren`, `translate`, `freezeLayout()`, `thawLayout()`, `transitionTo()`, `morphTo()`, and `add`/`insert`/`remove` with a duration | source, types | `Layout.ts`, `Node.ts` |
| `Txt.textGlyphs()`, `textWords()`, `textLines()`, `split()`, `fitFontSize()`, `canvasFont()` | source, types | `Txt.ts` |
| JSX is compiled by Vite 8's `oxc`; dev server port defaults to 9000 | source | `vite-plugin` `config()` |
| Image sequence lands in `output/<project>/NNNNNN.png`; MP4 exporters write `output/<project>.mp4` | source, runtime | `ImageExporter`, `exporterPlugin`, webcodecs server |
| The frame count equals what the engine reports it exported. For Canvas Commons 0.4.0 that is (to − from) + 1 frames, inclusive of the last frame. It does not follow duration x fps: `waitFor(2)` gave 121 frames at 60 fps and 60 at 30 fps; a 2 s tween gave 122 and 61; `waitFor(1.1)` gave 66 and 33 | source, runtime | core `Renderer.run`; PNG count and MP4 frames matched the engine in every render |
| `renderer.renderFrame(settings, t)` converts `t` with the fps of the previous call (30 on a fresh page) | source, runtime (first call at 1 s landed on frame 30 at 60 fps, the second on 60) | core `Renderer.renderFrame` |
| The default `Txt` font is Roboto, and the editor's stylesheet imports Roboto and JetBrains Mono from Google Fonts, so unstyled text needs the network | source, runtime | `View2D` `@defaultStyle('Roboto')`, editor `dist/style.css` |
| The ink-centre formula in txt-gotchas.md, and `moveOffset` keeping a glyph in place while its pivot moves | runtime | predicted 26.2 px, rendered 26 px; the ink centre stayed at 26 px through a 3x scale |
| With `node_modules` above the project (a shared install), Vite refuses to serve the editor's files until that folder is in `server.fs.allow` | runtime | `style.css` 403 and `@canvas-commons/2d/editor` 404 without it; the template's `vite.config.ts` adds it |
| `tsc` on the project preset reports errors inside 0.4.0's own typings (`chroma-js`, `project.d.ts`, `@types/dom-webcodecs`) | runtime (TypeScript 5.9.3) | fixed by `skipLibCheck: true` in the template's `tsconfig.json` |
| A `Txt` with the default `textWrap` and auto width wraps at a space when `letterSpacing` is negative (set or tweened); `textWrap={false}` keeps it on one line | runtime | stills of four variants; the template's title lost its second word until `textWrap={false}` was set |
| `PathProps.data` is required, so a component that supplies its own path must take `Omit<PathProps, 'data'>` | types | `2d` `Path.ts` |

## Re-checking after an upgrade

```bash
mkdir -p /tmp/cc-src && cd /tmp/cc-src
for p in core 2d editor vite-plugin webcodecs; do npm pack @canvas-commons/$p@<version>; done
for f in *.tgz; do mkdir -p "${f%.tgz}" && tar xzf "$f" -C "${f%.tgz}"; done
grep -rn "vector2Signal('anchor')" canvas-commons-2d-*/package/src/lib/components/Layout.ts
```

Then run `npm run smoke` and one `npm run render` in a project pinned to the new version.
