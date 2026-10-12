---
name: state-apply-architecture
description: The spine of every 3D piece. Time drives one state object, and ONE apply() writes it to the three.js scene. The host engine only owns time.
tags: [architecture, state, host]
---

# Time → state → one apply()

**Use when:** building any three.js motion piece, in any host. Read this first.

## How it works

Three layers, each with one job:

1. **Time.** The host (Canvas Commons, HyperFrames, a plain render loop) owns the clock and nothing else. It hands you `t` in seconds.
2. **State.** A plain object that describes the whole frame: camera pose, per-element entrance values, fades, FX amounts. Either the host tweens its fields (Canvas Commons signals, a GSAP proxy), or a pure `stateAt(t)` computes it. Usually it's a mix of both.
3. **apply().** One function reads the state and writes every three.js object: camera, meshes, materials, uniforms. It runs once per frame, just before the render.

three.js objects never animate themselves. No `mesh.rotation.y += 0.01`, no tween library pointed at `mesh.position`, and no `onUpdate` per object. If a value moves, it lives in state, and only apply() copies it across.

Why: one writer means one place to look when a frame is wrong. Any frame can be rebuilt from `t` alone, so the host can scrub, seek backwards or render frames in parallel, and every frame still comes out identical. It also lets a live panel, the editor timeline and the renderer all drive the same piece.

## Recipe

Engine-agnostic core:

```ts
import {applyCamera, cameraPath} from './camera-path';

interface State { appear: number[]; fade: number; }
const state: State = {appear: WORDS.map(() => 0), fade: 1};   // tweened by the host
const path = cameraPath(CAM_KEYS);                             // computed from t

function apply(t: number) {
  applyCamera(camera, path.at(t));
  WORDS.forEach((w, i) => {
    const a = state.appear[i];
    meshes[i].visible = a > 0.001;
    meshes[i].position.z = w.z - 0.95 * (1 - a);
    meshes[i].material.opacity = Math.min(1, a * 1.4) * state.fade;
  });
}
```

Each host only supplies `t` and calls `apply(t)`.

Canvas Commons: the state fields are signals, and a wrapper calls apply() on the begin-render lifecycle event. The event passes the 2D context to subscribers, so wrap the call rather than subscribing apply itself.

```ts
const clock = createSignal(0);
const appear = WORDS.map(() => createSignal(0));   // apply() reads appear[i]() instead of state.appear[i]
useScene().lifecycleEvents.onBeginRender.subscribe(() => apply(clock()));
apply(clock()); // the opening pose exists before frame 0
```

HyperFrames: a paused timeline tweens a plain proxy, and `render()` calls `apply(tl.time())`, then draws. See [../hosts/hyperframes.md](../hosts/hyperframes.md).

## Rules of the single writer

- **One apply per scene.** Split it into helper functions, but call them all from one place, in a fixed order: camera first (fades need its pose), then objects, then FX uniforms.
- **Every frame ends in exactly the state t dictates.** A write may be skipped only when the test compares the new value with the destination's current value (`camera.fov === s.fov`), or with a cache keyed purely by inputs derived from t (the string already painted, the buffer size already allocated). Skipping because of a remembered previous frame ("nothing moved since last frame", "the tween is finished") is unsafe. Seeks jump arbitrarily, and the skipped write leaves a stale value.
- **Call apply() once at build time,** so frame 0 and any first seek show the authored opening pose, not three.js defaults.
- **Derived values are computed inside apply()** from state and `t`, never stored back into state.
- **Visibility is state too.** Set `visible = opacity > ε` so culled objects cost nothing.

## Pitfalls

- Observed failure: per-mesh subscriptions scattered through a scene. Two of them wrote the same material, and the result depended on subscription order.
- A tween library aimed straight at a three.js property moves outside the host's timeline. Scrubbing and the live panel stop seeing it.
- Builder modules that start their own `requestAnimationFrame` loop. Builders return objects and setters, and the scene's apply() calls the setters.

## See also

- [pure-function-of-time.md](pure-function-of-time.md): what "computed from t" forbids
- [camera-position-and-target.md](camera-position-and-target.md): the camera part of apply()
- [../hosts/canvas-commons.md](../hosts/canvas-commons.md), [../hosts/hyperframes.md](../hosts/hyperframes.md)

*Idea adapted from HyperFrames (Apache-2.0).*
