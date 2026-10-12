# Project setup from npm (0.4.0)

A Canvas Commons project is a Vite app. `npm start` serves the editor at `http://localhost:9000`, where you scrub, tune time events and press Render. There is no CLI renderer: headless renders drive that same editor in Chrome (see [rendering.md](rendering.md)).

## Scaffold

Pick one.

**A. Copy this skill's template** (pinned versions, render and smoke scripts wired):

```bash
SKILL=<path to this skill>
cp -R "$SKILL/templates/project" my-piece
mkdir -p my-piece/scripts && cp "$SKILL/scripts/render.mjs" "$SKILL/scripts/smoke.mjs" my-piece/scripts/
cd my-piece && npm install
npm start            # editor on :9000
npm run smoke        # headless pre-flight
npm run render       # MP4 in output/
```

**B. The official scaffolder**, without prompts:

```bash
npm create @canvas-commons@0.4.0 -- --name my-piece --path my-piece --language ts --plugins webcodecs
```

It writes `package.json` with caret ranges (`^0.4.0`). Pin them to `0.4.0` exactly, then add `playwright` and the two scripts as in A. Also add the two settings the template carries (next section): `"skipLibCheck": true` under `compilerOptions` in `tsconfig.json`, or `npm run build` fails inside 0.4.0's own typings; and, when the project shares a `node_modules` higher up, the `server.fs.allow` entry in `vite.config.ts`, or the editor never boots.

## What is in a project

```
package.json          pinned @canvas-commons/* 0.4.0, vite 8, playwright (for the scripts)
vite.config.ts        canvasCommons() plus exporter plugins, e.g. webcodecs(); allows a shared node_modules
tsconfig.json         extends @canvas-commons/2d/tsconfig.project.json (JSX, decorators); skipLibCheck
src/project.ts        makeProject({scenes: [...], plugins: [...]})
src/project.meta      written by the editor: resolution, fps, exporter, background
src/scenes/*.tsx      one generator per scene, imported as './scenes/name?scene'
src/scenes/*.meta     written by the editor: time events, random seed
src/canvas-commons.d.ts   /// reference for the '?scene' import types
scripts/              render.mjs, smoke.mjs (copied from this skill)
output/               renders (git-ignored)
```

Commit the `.meta` files: they hold the time-event durations you dragged in the editor.

## Versions that work together

| package | version | note |
|---|---|---|
| `@canvas-commons/core`, `2d` | 0.4.0 | runtime |
| `@canvas-commons/editor`, `vite-plugin` | 0.4.0 | the editor was `@canvas-commons/ui` in older releases |
| `@canvas-commons/webcodecs` | 0.4.0 | in-browser MP4 exporter, the scaffolder's default |
| `@canvas-commons/ffmpeg` | 0.4.0 | deprecated; downloads an ffmpeg binary at install and writes one frame short, so `render.mjs` refuses it |
| `vite` | 8.3.4 | the plugin configures JSX through Vite 8's `oxc` |
| `typescript` | 5.9.3 | the project preset uses legacy `experimentalDecorators` |
| `playwright` | 1.64.0 | only for the scripts; drives system Chrome, no browser download |

## Imports: package roots only

0.4.0 ships each package as one bundled `lib/index.js` behind an `exports` map. Older guides import from deep paths; those no longer resolve.

```ts
// works on 0.4.0
import {Node, Txt, Layout, Camera, initial, signal, computed, makeScene2D} from '@canvas-commons/2d';
import {createSignal, tween, clampRemap, all, chain, waitFor, waitUntil} from '@canvas-commons/core';

// broken on 0.4.0: subpaths are not exported
// import {Node} from '@canvas-commons/2d/lib/components';
// import {easeInOutCubic} from '@canvas-commons/core/lib/tweening';
```

## Project file

```ts
import {makeProject} from '@canvas-commons/core';
import {capturePlayerPlugin} from './live-panel'; // optional, see live-panel.md
import intro from './scenes/intro?scene';

export default makeProject({
  scenes: [intro],
  plugins: [capturePlayerPlugin()],
});
```

Two settings in the template come from running 0.4.0 for real:

- **`server.fs.allow`** in `vite.config.ts` includes the folder that holds `@canvas-commons/editor`. When several projects share one `node_modules` higher up (a monorepo, or this skill's examples), Vite otherwise refuses to serve the editor's stylesheet and the 2D editor plugin, and the editor never boots. In a project with its own `node_modules` the line changes nothing.
- **`skipLibCheck: true`** in `tsconfig.json`. With TypeScript 5.9, `tsc` reports errors inside 0.4.0's own typings (`chroma-js` has no types, `project.d.ts` uses `export =`, and `@types/dom-webcodecs` collides with `lib.dom`), so `npm run build` would fail on code you did not write.

Several scenes play back to back. For a piece that should feel like one continuous space, prefer one scene with one camera and move between stages inside it (the `motion-craft` skill covers why).

## Fonts

Text is measured and drawn on a canvas. A webfont that has not loaded when a frame is drawn renders in the fallback face, and the layout is measured with the wrong metrics.

- Load the face in `project.ts` before the scenes run, for example by appending a stylesheet `<link>` (Google Fonts) or declaring an `@font-face` with a local file in `public/`.
- `render.mjs` calls `load()` on every declared face, awaits `document.fonts.ready`, then pauses before frame 0. The renderer re-measures the scenes when it starts, so text laid out with fallback metrics in the preview is corrected in the render.
- Anything that bakes text into a texture (three.js labels) must repaint when `document.fonts.ready` resolves. See the `motion-3d` skill.
- The palettes here default to a system stack, which needs no loading and renders the same in the editor and headless.
- Set a font explicitly. The 0.4.0 default `Txt` font is Roboto, which the editor's own stylesheet imports from Google Fonts: unstyled text renders in Roboto online and in a fallback face offline.

## Background colour

Set the background in the editor (Video Settings, General, background), or draw a full-frame `Rect` as the first child of the view, outside any camera. Without either, PNG frames are transparent and the MP4 stitch turns them black.

## Reading the engine instead of guessing

When behaviour surprises you, read the installed source rather than trusting memory or older guides: `node_modules/@canvas-commons/2d/src/lib/components/*.ts` ships with the package, and core's bundled `lib/index.js` is readable. [verified-0.4.0.md](verified-0.4.0.md) lists what changed from older releases.
