# Asset API reference

The six files in [../assets/](../assets/) are copy-in TypeScript. `legs.ts`, `camera-path.ts`, `timing-audit.ts` and `depth.ts` have no imports and run anywhere, including Node for numeric checks. `makeLabelTexture.ts` needs a DOM and three.js r152+. `Three.ts` is the Canvas Commons bridge (npm `@canvas-commons/2d` 0.4.0, pinned). Its tsconfig must enable `experimentalDecorators`, which extending `@canvas-commons/2d/tsconfig.project.json` does.

## legs.ts

The kinetic camera, for reels, launches, hype and identity pieces: baked landings joined by legs on named curves, over a constant drift, as a pure function of time. See [../rules/flight-paths.md](../rules/flight-paths.md). Curves are passed in, so the `motion-craft` skill's `assets/curves.ts` plugs in directly. The returned object has the `CameraPath` shape, so `applyCamera`, `findStops` and `normalisedSpeed` from `camera-path.ts` take it unchanged.

| Export | Signature | What it does |
|---|---|---|
| `legPath` | `(landings: Landing[], legs: LegSpec[], opts?: LegPathOptions) => LegPath` | Builds the flight. Needs exactly one leg fewer than landings. Leg k ends at landing k+1's time and starts `dur` earlier, never before landing k. |
| `LegPath.at` | `(t) => CamState` | Pose at t. Pure: any t, any order. Outside the first and last landing, the hold's drift carries on. |
| `LegPath.velocity` / `.speed` | `(t) => V3` / `(t) => number` | d(position)/dt and its length, in world units per second. Exactly the landing's drift during a hold. Inside a leg it is analytic in poses and drift, with the curve's slope taken by a ±0.0005 difference in leg progress. |
| `LegPath.start` / `.end` | `number` | First landing time; `opts.end`, else the last landing time. `findStops` and `normalisedSpeed` scan this range by default. |
| `LegPath.landings` | `number[]` | Landing times, for audits. |
| `LegPath.legs` | `{start, end, arc}[]` | Each leg's window, for audits and for placing events. |
| `LegPath.progress` | `(leg, t) => number` | Leg k's eased progress `e`: 0 before it, 1 after it. Key events tied to the sweep on this, not on linear time. |
| `LegPath.legAt` | `(t) => number` | Index of the leg running at t, or −1 during a hold. |
| `driftToward` | `(from: V3, to: V3, speed) => V3` | A drift of `speed` units per second pointing from `from` to `to`, e.g. along the next leg. |

Types:

- `Landing {t, pos, tgt, drift?, roll?, fov?}`. `drift` is a velocity in units per second applied to position and target together (default `opts.drift`, else none). `roll` (radians, default 0) and `fov` (degrees, default `opts.fov`) are the resting values the leg bumps return to.
- `LegSpec {dur, curve, arc?, roll?, fov?}`. `curve` is an `Ease` `(t, from?, to?) => number`. `arc` interpolates `pos − tgt` in spherical coordinates (azimuth about y, elevation, distance) the shorter way round. `roll` and `fov` are bump peaks, `peak · 4e(1 − e)`, added to the resting values blended by `e`.
- `LegPathOptions {drift?, fov?, end?}`. `end` is where the last landing's drift is scanned to.

Behaviour:

- Position and velocity are continuous at every leg boundary when the curve has zero slope at both ends. Measured on a five-pose plan (GLIDE, an arc on RAMP_LONG, two RAMP punches) that peaks at 132 units/s: across a 1e-7 s probe, position jumps stay below 2e-7 units and velocity jumps below 0.005 units/s at every boundary after the first frame.
- It throws when a leg's curve leaves 0..1 (the camera would pass its landing), when it leaves with a jump in speed (start slope above 0.05; above 1 on a leg 0 that starts at the first landing, so GLIDE at 0.4 passes there and OUT at 6.25 never does), when it doesn't settle at zero slope, and when a leg starts before its landing. Of the `motion-craft` named curves, RAMP, RAMP_LONG, IN_OUT and DRAG pass on any leg, GLIDE only on leg 0 from the first frame, and OUT, BOUNCE and ACCEL nowhere.
- It also throws when some landing sets `fov`, or some leg has a non-zero `fov` kick, while another landing has no `fov` and `opts.fov` is unset. With `opts.fov` set, or no FOV anywhere, it never throws for this.
- It does not check drift direction. A drift against a neighbouring leg makes the camera stop and reverse or overshoot; `findStops` at half the drift speed and 1000 Hz finds it.

## camera-path.ts

The calm-piece camera (explainers, ambient), plus the camera helpers both flights share (`applyCamera`, `findStops`, `normalisedSpeed`). A keyed flight as a pure function of time. Every channel (position x/y/z, target x/y/z, roll, fov) is its own monotone cubic (PCHIP) through the keys that define it. Between two keys a channel never overshoots either value, and velocity is continuous through every key. A leg peaks at about 1.4× its average speed, so it glides and never whips; kinetic pieces use `legs.ts`. See [../rules/flight-paths.md](../rules/flight-paths.md).

| Export | Signature | What it does |
|---|---|---|
| `cameraPath` | `(keys: CamKey[], defaults?: CameraPathDefaults, opts?: PchipOptions) => CameraPath` | Builds the flight. Key times must strictly increase. A channel with no keys uses `defaults` (pos `[0,0,0]`, tgt `[0,0,-1]`, roll 0, fov unset). |
| `CameraPath.at` | `(t) => CamState` | Pose at time t. Pure: any t, any order. |
| `CameraPath.velocity` / `.speed` | `(t) => V3` / `(t) => number` | Analytic d(position)/dt and its length, in world units per second. |
| `CameraPath.start` / `.end` | `number` | First and last key time. |
| `applyCamera` | `(camera: CameraLike, s: CamState) => void` | Writes position, then lookAt, then roll (`rotateZ`), then fov (only if it differs from the camera's current fov), then `updateMatrixWorld()`. A three.js `PerspectiveCamera` satisfies `CameraLike`. |
| `findStops` | `(path, {minSpeed, from?, to?, hz?}) => Stop[]` | Intervals `{from, to, speed}` where the camera moves slower than `minSpeed`. Empty means it never rests. |
| `normalisedSpeed` | `(path, {floor?, curve?, from?, to?, hz?}) => (t) => number` | Speed mapped to 0..1 against the path's fastest moment. `floor` is treated as zero (use the cruise speed); `curve` above 1 keeps FX off longer. |
| `sectionTimes` | `(start, legs: {fly, drift}[]) => {arrive, leave}[]` | Key times for fly → arrive → drift → next-fly sections. |
| `pchip` | `(points: [x, y][], opts?) => Track` | One monotone channel. `Track(x)` is the value, `Track.slope(x)` the derivative (0 outside the keyed range). |

Types: `CamKey {t, pos?, tgt?, roll?, fov?}` (roll in radians, applied after lookAt; fov vertical, in degrees). `CamState {pos, tgt, roll, fov}`, where `fov` is `undefined` when nothing sets it. `PchipOptions {ends?: 'secant' | 'zero'}`: `'secant'` (default) starts and ends already moving, `'zero'` starts and ends at rest.

A key whose value is a local extreme gets slope 0 in that channel, and repeated values make a flat run. The camera only stops if every position channel does that at one moment. `findStops` detects exactly that.

## timing-audit.ts

The pause test as numbers, run before any render is shown. A camera that creeps and background dots that drift can pass a pause test by eye, yet the viewer sees no movement. This audit counts only the copy being read while it animates, and a camera moving at a visible speed. See the `motion-craft` skill → `rules/continuous-over-cut.md` and `rules/reel-pacing.md`. No imports; runs in Node.

| Export | Signature | What it does |
|---|---|---|
| `auditTiming` | `(o: TimingAuditOptions) => TimingAudit` | Samples `camera.speed(t)` every `step` from `start` to `end`; reports dead spots and read gaps. `ok` is true when there are none. |
| `formatTimingAudit` | `(audit, unit?) => string` | Plain-text report: threshold, copy spans, exempt spans, dead spots, read gaps, then `TIMING PASS` or `TIMING FAIL: …`. `unit` labels speeds (default `'units/s'`). |
| `VISIBLE_SHARE` | `0.15` | Default threshold as a share of the piece's peak camera speed. |

| Option | Default | Meaning |
|---|---|---|
| `end` | required | last second audited |
| `start` | 0 | first second audited |
| `camera` | required | anything with `speed(t)`: a `CameraPath`, a `legPath`, or your own on-screen measure |
| `copy` | required | `{name, from, to}[]`: when the copy being read visibly animates (word builds, lifts, morphs, draws). End each span where its ease has covered about 95% of its travel, not at the tween's nominal end: an ease-out tail barely moves and would hide a dead spot |
| `reads` | `[]` | `{name, lastWordAt}[]`: when the last word of each read lands. For a word that never animates and arrives with the camera, use the arrival key time |
| `exempt` | `[]` | `{from, to, why}[]`: spans allowed to rest, e.g. the final lockup hold |
| `visibleSpeed` | `visibleShare` × peak | camera speed at or above which the camera counts as moving |
| `visibleShare` | 0.15 | used when `visibleSpeed` is not given |
| `maxDead` | 0.3 | longest allowed stretch with nothing counted as moving (s) |
| `maxReadGap` | 0.3 | longest allowed time from a read's last word until the camera reaches `visibleSpeed` (s) |
| `step` | 1/240 | sampling interval (s); span edges are refined by bisection |

Result: `deadSpots: {from, to, dur, cameraMedian}[]`, `readGaps: {name, lastWordAt, moveAt, gap, ok, exempt?}[]`, `ok`, plus what it used: `peakSpeed`, `visibleSpeed`, `visibleShare` (`null` when set by hand), `maxDead`, `maxReadGap`, `copy`, `exempt`.

- A **dead spot** is a maximal stretch longer than `maxDead` where the camera is slower than `visibleSpeed`, no `copy` span is active and no `exempt` span covers it. Dust, particles and slow drift are not inputs, so they cannot make it pass. `cameraMedian` shows how slowly the camera was drifting.
- A **read gap** runs from `lastWordAt` to `moveAt`, the first moment the camera reaches `visibleSpeed`. If the camera is already moving, `moveAt` is that same moment. If it never moves again, `moveAt` is `null` and the gap runs to `end`. A gap over `maxReadGap` fails unless `lastWordAt` lies in an `exempt` span, which `exempt` then names. The gap ends at visible speed, not at a leg's start, so a ramped leg's slow linger counts toward it ([../rules/flight-paths.md](../rules/flight-paths.md)).
- The 15% default falls between drift and travel on a fly → arrive → drift camera. In the `cc-flight` example the drift legs peak at 2.04 units/s, the slowest real move (the opening truck) never drops below 2.88, and 15% of the 18.02 peak is 2.70. One extreme whip lifts the threshold for everything else; pass `visibleSpeed` then.
- `CameraPath` and `legPath` speeds measure position only, so a pure pan, roll or zoom counts as still. Pass your own `{speed(t)}` if the piece moves that way.

```ts
import {auditTiming, formatTimingAudit} from './timing-audit';

const audit = auditTiming({
  end: T.end,
  camera: path,
  copy: [{name: 'title builds', from: 0, to: 0.49}, {name: 'drum turns', from: 4.1, to: 5.05}],
  reads: [{name: 'title', lastWordAt: 0.49}, {name: '05', lastWordAt: T.tunnel.arrive}],
  exempt: [{from: 8.38, to: T.end, why: 'final lockup hold'}],
});
console.log(formatTimingAudit(audit));
process.exitCode = audit.ok ? 0 : 1;
```

The runnable version is [../examples/cc-flight/scripts/audit-timing.mjs](../examples/cc-flight/scripts/audit-timing.mjs) (`npm run audit`), which derives every span from the scene's own cues.

## depth.ts

Framing and depth maths. FOV arguments are vertical, in degrees. See [../rules/frame-by-fill.md](../rules/frame-by-fill.md), [../rules/depth-dissolve.md](../rules/depth-dissolve.md) and [../rules/px-space-world.md](../rules/px-space-world.md).

| Export | Signature | What it does |
|---|---|---|
| `distFor` | `(height, fill, fovDeg) => number` | Camera distance at which `height` world units fill `fill` (0..1) of the frame height. |
| `distForW` | `(width, fill, fovDeg, aspect) => number` | The same against the frame width. |
| `distToFit` | `(width, height, fill, fovDeg, aspect) => number` | The larger of the two: fills `fill` of whichever axis binds first. |
| `pxDistance` | `(viewH, fovDeg) => number` | Distance at which the z=0 plane maps 1 world unit to 1 screen px. |
| `pxToWorld` / `worldToPx` | `(px, dist, fovDeg, viewH)` / `(size, dist, fovDeg, viewH)` | Convert sizes between screen px and world units at a camera distance. |
| `apparentScale` | `(camZ, z) => number` | `camZ / (camZ − z)`: magnification of an object at depth z vs z=0, for a camera on +z looking toward −z. |
| `viewDepth` | `(point, camPos, camForward) => number` | Signed depth along the view axis (positive = in front). `camForward` must be unit length, e.g. from `camera.getWorldDirection(v)`. Accepts any `{x, y, z}`. |
| `depthFade` | `(depth, {nearStart, nearEnd, farStart?, farEnd?}) => number` | Near fade (0 at the lens) times an optional far fade. |
| `windowFade` | `(depth, ahead, soft) => number` | 1 inside `ahead − soft`, 0 at `ahead`: shows only what is just in front of the camera. |
| `smoothstep`, `smooth01`, `clamp01`, `lerp`, `halfTan`, `DEG` | | GLSL-order smoothstep (edges may be reversed), helpers, degree-to-radian factor. |

## makeLabelTexture.ts

Text, optionally on a pill, baked into a `CanvasTexture` that stays crisp at any distance. See [../rules/text-as-texture.md](../rules/text-as-texture.md).

| Export | Signature | What it does |
|---|---|---|
| `makeLabelTexture` | `(text, opts?: LabelOptions) => LabelTexture` | Bakes the label. Returns `{texture, canvas, aspect, padFracX, repaint(text?), ready}`. Size planes as `(h * aspect) × h`. |
| `makeLabelPlane` | `(text, worldHeight, opts?: LabelPlaneOptions) => {mesh, material, label}` | A plane `worldHeight` units tall carrying the label. Rebuilds its geometry if the loaded font changes the size. |
| `loadFonts` | `(specs: string[]) => Promise<void>` | `document.fonts.load` for every CSS font shorthand, then `document.fonts.ready`. |
| `fontString` | `(weight, px, family) => string` | CSS font shorthand. |

`LabelOptions` (all optional):

| Option | Default | Meaning |
|---|---|---|
| `fontFamily` | `'system-ui, sans-serif'` | CSS family list |
| `fontWeight` | 700 | number or CSS keyword |
| `fontPx` | 300 | bake size in canvas px; bake big, and mipmaps keep it sharp when small |
| `ink` | `'#ffffff'` | text colour, or `[top, bottom]` vertical gradient |
| `pill` | `null` | pill colour or `[top, bottom]` gradient; `null` = no pill |
| `padX`, `padY` | pill: 0.42 / 0.33 em, else 0.14 / 0.12 em | padding in canvas px at `fontPx` |
| `tracking` | 0 | letter spacing in em |
| `box` | `'line'` | `'line'` = em box + padding (consistent heights); `'ink'` = tight to the glyph ink |
| `sizeText` | | measure this string instead of `text` (reserve width for a typewriter) |
| `minAspect` | 1 | pills only: width at least `minAspect` × height (1 makes short words circles) |
| `anisotropy` | 8 | texture anisotropy |
| `maxTexturePx` | 4096 | longest canvas side; larger bakes are scaled down |
| `onResize` | | called with the new aspect when the loaded webfont changes the measured size |

`LabelPlaneOptions` adds `layering: 'sticker' | 'depth'` (default `'sticker'`: depthTest and depthWrite off), `align: 'center' | 'left' | 'right'` (which edge of the text sits at the mesh origin) and `opacity` (default 1; apply() normally writes it every frame).

Behaviour: the texture is sRGB, mipmapped and anisotropic. `ready` resolves once the face has loaded and the label has repainted with it. If the size changed, the GPU texture is disposed (its storage is immutable once uploaded) so the next upload uses the new size, and `onResize` fires.

## Three.ts (Canvas Commons)

A `Layout` node that renders a three.js scene into an offscreen `WebGLRenderer` and blits it into the 2D canvas, sized to the node's box. 2D children draw on top. See [../hosts/canvas-commons.md](../hosts/canvas-commons.md).

```tsx
view.add(<Three scene={scene} camera={camera} quality={2} width={1920} height={1080} />);
useScene().lifecycleEvents.onBeginRender.subscribe(() => apply(clock()));
```

| Prop | Default | Meaning |
|---|---|---|
| `scene`, `camera` | `null` | plain three.js objects; rendered as they are at draw time |
| `quality` | 2 | supersample factor: buffer = quality × node box, downsampled on blit |
| `background` | `null` | CSS colour for `scene.background`; `null` keeps the buffer transparent and leaves a background you set yourself alone |
| `zoom` | 1 | `OrthographicCamera` only: visible world height; width follows the node's aspect |
| `composer` | `null` | post chain `{setSize, render}` (e.g. `EffectComposer` built on `renderer`), rendered as `composer.render(0)` instead of `renderer.render` |

Public `renderer` (for capabilities or an `EffectComposer`). Behaviour:

- The camera aspect or ortho frustum is locked to the node box every frame.
- `setSize` runs only when the buffer size differs from the canvas's current size.
- The composer is resized when the composer or the buffer size changes.
- `dispose()` frees the WebGL context on every scene reset.
- The composer delta is always 0, so passes that change over time must read t from a uniform set in apply().
