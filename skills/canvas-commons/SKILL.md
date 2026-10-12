---
name: canvas-commons
description: Canvas Commons (Motion Canvas fork) engine idiom, checked against npm @canvas-commons/* 0.4.0. Covers setup from npm, signals, master signals, generator timelines, flexbox layout, waitUntil time events, the Camera component, @signal components, Txt and glyph transform gotchas, a live slider panel that repaints the paused frame, and a headless render pipeline (system Chrome, Metal or SwiftShader, MP4, exact frame counts, contact sheet). Use when writing, reviewing, debugging or rendering Canvas Commons or Motion Canvas code. Triggers include "canvas commons", "motion canvas", "makeScene2D", "Motion Canvas yield* timeline", "Canvas Commons createSignal", "Motion Canvas waitUntil event", "Txt scales off-centre", "Txt anchor vs offset", "Camera centerOn", "render a Canvas Commons project to mp4", "Canvas Commons smoke check", "Canvas Commons live slider panel", "requestRender paused frame".
---

# Canvas Commons engine idiom

How to write, tune and render Canvas Commons scenes the way the engine wants, with every engine claim checked against the published 0.4.0 packages ([references/verified-0.4.0.md](references/verified-0.4.0.md)).

This skill is the engine layer. Motion taste (named curves, pacing, camera grammar, seams, kinetic type principles, the tuning process) lives in the `motion-craft` skill. Real 3D (three.js inside a scene, camera rigs, WebGL readiness) lives in `motion-3d`, including its Canvas Commons host doc. Use them together.

## Cardinal rules

1. **Pin `@canvas-commons/*` to 0.4.0 and import from package roots.** Deep `lib/...` paths from older guides no longer resolve; the editor package is `@canvas-commons/editor`.
2. **Every beat that someone might move is `waitUntil('name')`.** The editor turns it into a draggable pill stored in `.meta`. Literal seconds (`waitFor`) only for micro-timing inside a beat.
3. **Signals before imperative state.** Bind properties to functions once; tween one master signal and let everything derived follow.
4. **Flexbox for repeated or structured content, hand positions for stages.** Nudge a flex child with `translate`; take free elements out with `layout={false}`.
5. **`Camera` when pan and zoom overlap.** Tween `zoom`, never `scale`; keep the background before the camera so it never pans.
6. **A block written twice becomes a component.** Subclasses use `@initial` above `@signal`, root imports, and `getCacheBBox()` whenever `draw()` paints.
7. **Glyph pivots: `anchor`, not `offset`.** A `Txt` scales about its line-box centre, so transform a wrapper `Node` pinned at the measured ink centre.
8. **Every magic number goes in a params object behind the live panel.** Bindings read `tick()`; tuned values are copied back to `DEFAULTS` before any render.
9. **Smoke after every edit; render to check facts.** Trust the `RESULT` line's exact frame counts and the contact sheet, not "render complete". Both scripts are verified end to end on real 0.4.0 projects.
10. **When behaviour surprises you, read the installed engine source.** Do not trust memory or older guides.

## Quick start

```bash
cp -R <this skill>/templates/project my-piece
mkdir -p my-piece/scripts && cp <this skill>/scripts/render.mjs <this skill>/scripts/smoke.mjs my-piece/scripts/
cd my-piece && npm install
npm start          # editor at http://localhost:9000
npm run smoke      # headless pre-flight: page errors, Render button, WebGL
npm run render     # output/<project>.mp4 + output/<project>-sheet.jpg
```

## When to read what

| question | read |
|---|---|
| New project, versions, imports, fonts, background, what changed in 0.4.0? | [references/setup.md](references/setup.md) |
| Which claims were checked, and how? Re-checking after an upgrade? | [references/verified-0.4.0.md](references/verified-0.4.0.md) |
| Signals, derived values, master signal, `DEFAULT`, effects, the tick | [references/signals.md](references/signals.md) |
| Flexbox, `layout={false}`, `translate`, animated add/remove, freeze/thaw | [references/layout.md](references/layout.md) |
| `waitUntil`, `useDuration`, dragging pills, narration sync | [references/time-events.md](references/time-events.md) |
| `Camera` vs a `Node` wrapper, `centerOn`, `zoom`, `followCurve`, locking to a draw | [references/camera.md](references/camera.md) |
| Function components, Node subclasses, decorators, `tween()`, `clampRemap`, frame hooks | [references/custom-components.md](references/custom-components.md) |
| A glyph grows off-centre, `offset` errors, pivots, a title loses a word or wraps, per-glyph `split()` | [references/txt-gotchas.md](references/txt-gotchas.md) |
| A slider panel that repaints the paused frame; live vs structural params; copy back | [references/live-panel.md](references/live-panel.md) |
| Headless MP4, GPU modes and timings, exporters, frame-count checks, failures | [references/rendering.md](references/rendering.md) |
| DotBurst, Cursor and palette wiring | [references/components.md](references/components.md) |

## Assets (copy into `src/`)

- [assets/live-panel.ts](assets/live-panel.ts): zero-dependency slider panel with `capturePlayerPlugin()`, `mountPanel()` and `requestRender()`; loop controls, variant buttons (keys 1-9), copy, reset, reload, all with plain-language labels.
- [assets/DotBurst.tsx](assets/DotBurst.tsx): ring, contract, starburst; one `progress` signal.
- [assets/Cursor.tsx](assets/Cursor.tsx): pointer component with `moveCursor` and `clickCursor`.
- [assets/palette.ts](assets/palette.ts), [assets/palette-reel.ts](assets/palette-reel.ts): calm and kinetic palettes, one role per colour.

## Scripts (copy into the project's `scripts/`)

- [scripts/render.mjs](scripts/render.mjs): starts the project's Vite server and system Chrome, probes the GPU (Metal, falls back to SwiftShader), boots the editor (reloading through cold-start 504s), loads fonts, renders through the editor's renderer, stitches or collects the MP4, verifies frame counts exactly ((to − from) + 1, inclusive of the last frame), fails on console errors or missing WebGL, and writes a contact sheet (`--sheet-at` for chosen moments). `--help` lists flags.
- [scripts/smoke.mjs](scripts/smoke.mjs): boots headless and fails on page errors, console errors, a missing Render button or no WebGL; `--stills` writes full-size frames.

Both resolve `playwright` and `vite` from the project they run in, or from a shared `node_modules` above it. Measured timings are in [references/rendering.md](references/rendering.md).

## Template

[templates/project/](templates/project/) is a minimal pinned 0.4.0 project with `start`, `smoke` and `render` scripts, the WebCodecs exporter registered, and one tiny scene showing a master signal, a flex layout and a time event. Its `src/ease.ts` is a two-curve stand-in; replace it with the full curve set from `motion-craft`.

## Examples

- [examples/explainer-2d/](examples/explainer-2d/): a 2D product explainer with typing, a pointer click, a field-to-pill morph, a count-up, column whips with the `Camera`, and a kinetic headline. Its README names the rules it demonstrates.

The 3D examples live in `motion-3d`.
