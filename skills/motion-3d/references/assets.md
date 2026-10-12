# Asset API reference

The four files in [../assets/](../assets/) are copy-in TypeScript. `depth.ts` and `camera-path.ts` have no imports and run anywhere, including Node for numeric checks. `makeLabelTexture.ts` needs a DOM and three.js r152+. `Three.ts` is the Canvas Commons bridge (npm `@canvas-commons/2d` 0.4.0, pinned). Its tsconfig must enable `experimentalDecorators`, which extending `@canvas-commons/2d/tsconfig.project.json` does.

## camera-path.ts

Keyed camera flight as a pure function of time. Every channel (position x/y/z, target x/y/z, roll, fov) is its own monotone cubic (PCHIP) through the keys that define it. Between two keys a channel never overshoots either value, and velocity is continuous through every key. See [../rules/flight-paths.md](../rules/flight-paths.md).

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
