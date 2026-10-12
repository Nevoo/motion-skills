# cc-flight

One continuous three.js camera flight inside Canvas Commons, about 10 s at 1920×1080, 60 fps (592 frames). The camera never rests. A layered "idea" title pops in depth and the camera flies through it, a spiral tunnel of numbers counts down to 05, a drum ratchets through words, and a line draws through depth to v1.0. Then the camera pulls back and a 2D "to launch." lockup lands over the 3D world.

![contact sheet](preview.jpg)

## Rules it demonstrates

| Rule | Where |
|---|---|
| `motion-3d` → `rules/pure-function-of-time.md` | `src/scenes/flight.tsx:48`: one linear clock, everything derived from it |
| `motion-3d` → `rules/state-apply-architecture.md` | `src/scenes/flight.tsx:199`: the only writer; camera, objects, fades, FX in that order |
| `motion-3d` → `rules/flight-paths.md` | `src/flight.ts:11`: fly, arrive, drift, next fly |
| `motion-3d` → `rules/vary-the-leg.md` | `src/flight.ts:49`: truck, through with roll, arc, drop, pull |
| `motion-3d` → `rules/depth-pop.md` | `src/scenes/flight.tsx:68`: title layers rush forward from behind their rest depth |
| `motion-3d` → `rules/tunnel.md` | `src/scenes/flight.tsx:86`: numbers on a tightening spiral, shown only in a window ahead of the camera |
| `motion-3d` → `rules/drum-ratchet.md` | `src/scenes/flight.tsx:105`, `src/flight.ts:86`: one GLIDE, a ratchet for the per-word rhythm |
| `motion-3d` → `rules/path-through-depth.md` | `src/scenes/flight.tsx:134`: one progress value draws the line and pops the nodes |
| `motion-3d` → `rules/depth-dissolve.md` | `src/scenes/flight.tsx:207`: planes dissolve as the camera passes through them |
| `motion-3d` → `rules/speed-driven-fx.md` | `src/lens.ts:4`, `src/flight.ts:79`, `src/scenes/flight.tsx:166`: zoom blur and colour fringe ride the camera's speed, strong only on the hero punch |
| `motion-craft` → `rules/effects-tied-to-motion.md` | `src/scenes/flight.tsx:223` |
| `motion-3d` → `rules/compositing-3d-and-2d.md` | `src/scenes/flight.tsx:234`: a veil dims the world, the 2D lockup lands and keeps pushing in |
| `canvas-commons` → `references/live-panel.md` | `src/scenes/flight.tsx:35`: sliders and three variants |

## Run it

Needs Node 20.19+ (or 22.12+), system Chrome and `ffmpeg` on the PATH.

```bash
npm install            # or once at the repo root, which serves every example
npm start              # editor at http://localhost:9102, with the live slider panel
npm run smoke          # headless pre-flight: page errors, Render button, WebGL
npm run render         # output/project.mp4 + output/project-sheet.jpg
node scripts/check-path.mjs   # speed per leg; fails if the camera ever stops
```
