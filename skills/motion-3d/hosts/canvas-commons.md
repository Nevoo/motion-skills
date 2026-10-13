# Host: Canvas Commons

How the time → state → apply() doctrine maps onto Canvas Commons (npm `@canvas-commons/*` 0.4.0, pinned). For engine idiom (project setup, signals, layout, the editor, the render harness and the live panel asset), see the `canvas-commons` skill. This page covers only the 3D bridge.

## What the host owns

Canvas Commons owns **time**. Its generator timeline and signals are the clock and the tween engine, its editor scrubs them, and its renderer asks for frames. three.js owns nothing but pixels. Everything that moves is a signal, or a pure function of a clock signal, and one apply() copies it into three.js.

## Setup

1. `npm i three` (and `@types/three` for TypeScript). Any recent three.js (r152+ for the `colorSpace` API).
2. Copy [../assets/Three.ts](../assets/Three.ts) into the project (e.g. `src/components/Three.ts`). It uses `@signal`/`@initial` decorators, so the tsconfig must extend `@canvas-commons/2d/tsconfig.project.json`, which turns on `experimentalDecorators`.
3. Copy [../assets/depth.ts](../assets/depth.ts), [../assets/legs.ts](../assets/legs.ts) (the kinetic camera), [../assets/camera-path.ts](../assets/camera-path.ts), [../assets/timing-audit.ts](../assets/timing-audit.ts) and [../assets/makeLabelTexture.ts](../assets/makeLabelTexture.ts) as needed. They're plain TypeScript with no Canvas Commons imports.
4. In `vite.config.ts`, add `three` and each `three/examples/jsm/...` module you import to `optimizeDeps.include`, next to the editor and the WebCodecs client (the `canvas-commons` skill → `references/setup.md`).

## Scene skeleton

```tsx
import {Rect, makeScene2D} from '@canvas-commons/2d';
import {all, chain, createSignal, linear, useScene, waitUntil} from '@canvas-commons/core';
import * as THREE from 'three';
import {Three} from '../components/Three';
import {applyCamera} from '../motion/camera-path';
import {legPath} from '../motion/legs';
import {OUT} from '../motion/curves';                 // the motion-craft skill's curves asset

export default makeScene2D(function* (view) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.05, 200);
  // ...build meshes once...

  const clock = createSignal(0);                       // time, for pure-function channels
  const appear = WORDS.map(() => createSignal(0));     // tweened state
  const path = legPath(LANDINGS, LEGS, {fov: FOV});    // a calm piece uses cameraPath(KEYS)

  const apply = (t: number) => {
    applyCamera(camera, path.at(t));
    WORDS.forEach((w, i) => { /* read appear[i]() → write mesh i */ });
  };
  // The event passes the 2D context to subscribers; the wrapper hands apply the clock instead.
  useScene().lifecycleEvents.onBeginRender.subscribe(() => apply(clock()));
  apply(clock());                                      // opening pose before the first frame

  view.add(<Rect size={[1920, 1080]} fill={BG} />);   // 2D background under the 3D
  view.add(<Three scene={scene} camera={camera} quality={2} width={1920} height={1080} />);

  yield* all(
    clock(END, END, linear),                           // linear TIME under everything, not linear motion
    chain(waitUntil('first word'), appear[0](1, 0.34, OUT)),   // named cues: drag them on the editor timeline
    chain(waitUntil('second word'), appear[1](1, 0.34, OUT)),
  );
});
```

Two state styles mix freely:

- **Tweened signals** (`camY(Y[i], 0.42, RAMP)`) suit discrete punches and pops, written as generator steps.
- **A linear clock plus pure functions** (`path.at(clock())`, `ratchet(drumS())`) suit continuous flights. To compute a whole state object at once, use `createComputed(() => stateAt(clock()))` and read it in apply().

**Cueing.** Beats a human might retime are named time events, `waitUntil('drum starts')`. They work inside `all()`, show on the editor timeline, and can be dragged there. Absolute times are fine only for values computed as pure functions of the linear clock: camera keys, and entrances locked to them such as `OUT(seg(clock(), key.t + 0.06, 0.34))`. A free event would let a drag pull the pop off its camera move.

## Engine facts the bridge relies on (checked on 0.4.0)

- `useScene().lifecycleEvents.onBeginRender` fires inside the scene's draw, right before the view tree renders. apply() therefore runs once per drawn frame, before the bridge node's `draw()` renders three.js.
- Lifecycle subscriptions are cleared on every scene reset, and the generator runs again, so subscribe inside the scene generator, never at module level.
- Seeking to an earlier frame resets the scene and replays the generator forward **without drawing** the skipped frames. apply() isn't called for them, so nothing may accumulate inside apply(). The bridge node is rebuilt on each reset, and its `dispose()` frees the old WebGL context.

## Live tuning

Keep every feel number in one params object `P` that apply() reads. The live panel (asset and mechanics in the `canvas-commons` skill) writes `P` and calls the player's `requestRender()`, which redraws the current frame even while paused. apply() runs on every draw (begin-render), so it picks up the new values by itself and needs no extra signal.

A `tick` signal matters only for reactive 2D node bindings computed from `P`, which otherwise keep their cached value. Read `tick()` inside those bindings, and bump it when the panel changes a value.

```ts
const apply = (t: number) => { /* reads P.* and state directly */ };
const tick = createSignal(0);                              // panel: P[key] = v; tick(tick() + 1); player.requestRender();
lockup().scale(() => (tick(), P.endScale));                // reactive binding: needs tick() to see P change
```

Structural values (counts, durations that shape the generator, geometry built once) need a rebuild. Mark them in the panel. Use plain-language labels ("loop from", "loop length", "tunnel camera spin"), and give every keyboard shortcut a visible button. Headless renders use the baked defaults, so copy tuned values back into the source.

## Fonts and rendering

The scene generator is synchronous and can't await fonts. Build labels anyway: `makeLabelTexture` repaints, and resizes if needed, once the face loads. The render harness must still wait for `document.fonts.ready` before the first captured frame. Headless WebGL needs the GPU flags in [../rendering/webgl.md](../rendering/webgl.md). The harness itself (smoke check, frame export, ffmpeg) is in the `canvas-commons` skill.

## Pitfalls

- `yield*`-ing a three.js property, or tweening it with another library. The editor can't see or scrub it.
- Forgetting `apply(clock())` at build: frame 0 shows three.js defaults until something moves.
- Building three.js objects inside apply(). Build once in the generator, and only write values in apply().
- A second `Three` node for the same scene. One node per scene, and post FX through its `composer` prop.
