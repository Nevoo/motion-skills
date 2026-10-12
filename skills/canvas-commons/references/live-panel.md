# Live slider panel: the engine mechanics

Motion feel is judged by the person watching, not by an agent reading frames. So expose every magic number as a slider and let them drag while the paused frame repaints. The process (pitch a range, variant rounds, live sliders, bake the winner) is in the `motion-craft` skill. This file covers how the engine side works and how to wire [`assets/live-panel.ts`](../assets/live-panel.ts).

The asset has no dependencies. It is a plain DOM overlay: the exporter captures the canvas, never the page, so the panel never appears in renders.

## Wiring (three steps)

**1. Capture the player** in `src/project.ts`:

```ts
import {makeProject} from '@canvas-commons/core';
import {capturePlayerPlugin} from './live-panel';
import piece from './scenes/piece?scene';

export default makeProject({scenes: [piece], plugins: [capturePlayerPlugin()]});
```

**2. One params object** next to the scene, with plain-language labels:

```ts
// src/scenes/piece-params.ts
import type {ParamSet} from '../live-panel';

export const DEFAULTS = {WHIP_SECS: 0.85, DIP: 0.9, DOT_SIZE: 120, DOT_COUNT: 5};

export const params: ParamSet<typeof DEFAULTS> = {
  values: {...DEFAULTS},
  meta: {
    WHIP_SECS: {min: 0.4, max: 1.6, step: 0.01, label: 'whip length (s)', group: 'camera', structural: true},
    DIP: {min: 0.7, max: 1, step: 0.005, label: 'pull-back during whip', group: 'camera'},
    DOT_SIZE: {min: 20, max: 400, step: 1, label: 'dot size', group: 'dots'},
    DOT_COUNT: {min: 1, max: 20, step: 1, label: 'dot count', group: 'dots', structural: true},
  },
};
```

**3. Read through a tick** in the scene, and mount the panel:

```tsx
import {Camera, Circle, makeScene2D} from '@canvas-commons/2d';
import {createRef, createSignal} from '@canvas-commons/core';
import {IN_OUT as ease} from '../ease'; // the template's stand-in; motion-craft's curves.ts exports the same names
import {mountPanel} from '../live-panel';
import {params} from './piece-params';

export default makeScene2D(function* (view) {
  const P = params.values;
  const tick = createSignal(0);
  mountPanel('piece', params, {
    onChange: () => tick(tick() + 1),
    loop: {from: 1.2, length: 1.5},
    variants: [
      {label: 'soft', values: {DIP: 0.96}},
      {label: 'deep', values: {DIP: 0.84}},
      {label: 'long whip', values: {WHIP_SECS: 1.1}},
    ],
  });

  const camera = createRef<Camera>();
  view.add(<Camera ref={camera}>{/* stages */}</Camera>);
  view.add(<Circle size={() => (tick(), P.DOT_SIZE)} fill={'#E0306E'} />); // live: re-read on every repaint
  const count = P.DOT_COUNT; // structural: read once while the scene builds

  // zoom above 1 magnifies, so a pull-back dips below 1: 1, then DIP, then 1
  const whip = createSignal(0); // 0 at rest, 1 at the deepest point
  camera().zoom(() => (tick(), 1 - (1 - P.DIP) * whip())); // DIP stays live
  yield* whip(1, P.WHIP_SECS / 2, ease).to(0, P.WHIP_SECS / 2, ease); // WHIP_SECS is structural
});
```

A value passed straight to a tween, as in `camera().zoom(P.DIP, 0.2, ease)`, is read once when the tween starts, so it is structural. To keep such a value live, tween a 0-to-1 signal instead and bind the property to a function that reads the param and `tick()`, as `DIP` does above.

## API

| export | what it is |
|---|---|
| `capturePlayerPlugin()` | a `Plugin` for `makeProject({plugins})` that keeps the editor's `Player` |
| `requestRender()` | repaints the current frame (no-op until the player is captured) |
| `mountPanel(title, params, options)` | builds the panel once per page; later calls re-bind it. `options` may also be just the `onChange` function |
| `ParamSet<T>` | `{values: T, meta: {[key]: ParamMeta}}`; the scene reads `values`, the panel writes it |
| `ParamMeta` | `min`, `max`, `step`; `label` (plain words, defaults to the key); `structural` (`true` = read once when the scene builds, applies after "reload to apply"); `group` (heading) |
| `PanelOptions` | `onChange` (invalidate bindings, e.g. bump `tick`); `variants` (up to 9 `{label, values}` overrides on top of the defaults); `loop` (`{from, length}` in seconds) |

## Why each piece is needed

| piece | why |
|---|---|
| `capturePlayerPlugin()` | The editor hands the `Player` to every plugin's `player(player)` hook (0.4.0 editor bootstrap). Nothing else exposes it to scene code. |
| `requestRender()` | When paused, the player's run loop redraws only after a seek or when `requestRender()` was called (`Player.run` on 0.4.0). Without it, a slider moves and the frame stays stale until you scrub. Measured on 0.4.0, with the player paused: changing a param and bumping `tick` left the canvas byte-identical; the same change through the panel slider repainted it. |
| the `tick` signal | `P` is a plain object, not a signal, so changing `P.DOT_SIZE` invalidates nothing. Every binding that reads `P` also reads `tick()`; the panel bumps `tick` and then requests the render. |
| live vs structural | A **live** param is read inside a binding, so it updates on repaint. A **structural** param is read once when the generator runs: node counts, tween durations, timing functions, layout pitch, and values passed straight to a tween as its target. The panel marks those with `*` and lights up "reload to apply"; localStorage keeps the value across the reload. |

## What the panel gives the person tuning

All labels are plain words, and every keyboard shortcut has a visible button.

- One row per param: label, range slider, number box. Groups become headings.
- **loop from (s)**, **loop length (s)**, **loop playback**, **play loop**: replays one stretch while they drag.
- **variants**: one button per named variant (keys 1-9 press the same buttons). A button whose variant changes a `*` setting carries a small **reload** badge before you click it, and after switching, **reload to apply** turns orange. A variant is a named set of overrides on top of the defaults. **replay loop when switching** restarts the loop on every switch, because comparing motions needs the same moment replayed instantly.
- **copy values**, **reset to defaults**, **reload to apply**, **hide panel**.

Overrides persist in the tuner's localStorage as a diff from the defaults, keyed by panel title. `mountPanel` is safe to call on every scene run: it builds the DOM once per page, then re-binds to the newest params object and `onChange`.

## Closing the loop: copy back to DEFAULTS

Headless renders start a fresh browser profile with empty localStorage, so they render the **defaults**, not what the person tuned. Every time:

1. They press **copy values** (when the clipboard is blocked, the values go to the console and the panel says so).
2. You paste the JSON into `DEFAULTS` in the params file.
3. They press **reset to defaults** (clears the stored diff), and you render.

Observed failure: a render "ignored" an hour of tuning because the tuned values only existed in one browser's localStorage.

## Pitfalls

- **A binding that reads `P` without `tick()`** updates only on scrub. Wrap every such read: `() => (tick(), P.X)`.
- **Structural values used live.** Reading `P.DOT_COUNT` inside a binding that creates nodes does not work; nodes are created once. Mark it `structural: true`.
- **Tuning by rendering.** A render costs minutes and its frames cannot show feel. Render to check facts (fonts, layout, completeness); tune by slider.
