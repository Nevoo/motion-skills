# Camera: the `Camera` component vs a `Node` wrapper

This file covers the engine mechanics. Where the camera should go and how it should move (one camera through stages, glide curves, locking to a leading element) is camera grammar in the `motion-craft` skill. Real 3D cameras live in `motion-3d`.

## Option A: the built-in `Camera` (default choice)

`Camera` renders its own scene node through the inverse of its transform, so overlapping pan, zoom and rotation compose correctly.

```tsx
import {Camera, Rect} from '@canvas-commons/2d';
import {createRef} from '@canvas-commons/core';

const camera = createRef<Camera>();
view.add(<Rect width={1920} height={1080} fill={BG} />); // background before the camera: never pans
view.add(<Camera ref={camera}>{/* every stage */}</Camera>);

yield* camera().centerOn(targetNode, 1, ease);   // pan to a node (zoom unchanged)
yield* camera().centerOn([0, 1140], 1, ease);    // or to a world point
yield* camera().zoom(1.55, 0.55, ease);          // zoom: never write .scale on a Camera
yield* camera().zoom(2, 1, ease).to(1, 0.8, ease);
yield* camera().reset(1, ease);                  // position, zoom and rotation back to defaults
yield* camera().followCurve(path(), 2.5, ease);  // ride a Curve (Line, Spline, CubicBezier, ...)
yield* camera().followCurveWithRotation(path(), 2.5, ease); // and turn with its tangent
```

Verified on 0.4.0: `centerOn(nodeOrPoint, seconds, timing?, interpolation?)`, `zoom` (a signal; tweening it interpolates in 1/zoom space), `reset(seconds, timing?)`, `followCurve`, `followCurveReverse`, `followCurveWithRotation`, `followCurveWithRotationReverse`. Default timing is `easeInOutCubic`; pass a named curve.

Sign convention: `camera.position` is the world point shown at the centre of the frame. To look at a stage at `(0, 1140)`, set the camera position to `(0, 1140)`.

Several viewports of one world: `Camera.Stage` returns a clipped `Rect` holding a camera that renders a shared `scene` node, for picture-in-picture or split screens.

## Option B: a plain `Node` wrapper

```tsx
const world = createRef<Node>();
view.add(<Node ref={world}>{/* every stage */}</Node>);

// look at world point (0, 1140): move the world the other way
yield* world().position([0, -1140], 1, ease);
```

The wrapper's position is the **negated** focal point, and zoom is `scale` about the wrapper's origin, which is the world origin, not the screen centre. That is fine for sequential moves that never overlap. Once pan and zoom overlap, or a zoom must happen about a point other than the world origin, switch to `Camera`.

## Locking a tip to a draw signal

When a line draws and something should ride its leading edge, bind the rider to the line's `end` signal rather than tweening both:

```tsx
const LENGTH = 1108; // compute from the line's points; a mismatch makes the rider lag or float
dot().position.y(() => y0 + line().end() * LENGTH);
yield* all(line().end(1, 3.5, ease), camera().centerOn([0, y0 + LENGTH * 0.6], 3.5, ease));
```

Same timing function, same duration, same start for the camera and the leading element; the `motion-craft` skill explains when to let them drift apart.

## Pitfalls

- **Writing `scale` on a `Camera`.** Use `zoom`; `scale` is the inverse internally.
- **The background inside the camera.** It pans and zooms with the world. Add it before the camera.
- **Mixed conventions.** A project that switches from the `Node` wrapper to `Camera` must flip every hard-coded camera position's sign.
- **Overlay UI inside the camera.** Anything that should stay fixed on screen (a cursor in screen space, a caption) goes outside the camera, after it.
