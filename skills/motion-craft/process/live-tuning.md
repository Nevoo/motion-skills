# Live tuning: the human drags, the agent builds the panel

**Use when:** a moment has to feel right (a stretch, a whip, a crash, spacing, timing) and the next move would be guessing numbers or rendering frames to judge them.

## Why

The agent cannot judge motion feel from rendered frames. Frames are stills; feel lives in timing and acceleration, and in the human's taste. A render-and-eyeball loop costs minutes per cycle, erodes trust and still lands wrong, while a live slider panel converges in minutes. So split the jobs: the human owns taste; the agent owns correctness and tooling. That means the piece compiles and runs, the facts check out ([verify-facts](verify-facts.md)), and every magic number is exposed.

Start sliders only after the concept and the variant are chosen ([variant rounds](variant-rounds.md)); sliders refine, they don't explore.

## Principles

**1. One params object.** Every magic number lives in one object of defaults, and the scene reads everything from it, with no literals buried in scene code. The panel persists only the difference from the defaults, so the defaults stay the source of truth.

```ts
export const DEFAULTS = {WHIP_SECS: 0.85, DIP: 0.9, STAGGER: 0.1, MAX_STRETCH: 10};
export const P = {...DEFAULTS, ...loadOverrides()};    // persisted diff only
```

**2. Live versus structural.** Live parameters are read every frame (shape, size, opacity, pivot, trail), so a drag repaints at once, even while paused. Structural parameters are read once when the scene is built (counts, layout pitch, durations and curves baked into a prebuilt timeline), so changing them needs a rebuild. Mark structural sliders visibly so nobody wonders why a drag did nothing. When every value depends on t and nothing else (the architecture in `motion-3d`), almost everything is live, which is a strong reason to build that way.

**3. The paused frame repaints.** A slider that only takes effect on the next play is useless for comparing. A change must invalidate and redraw the current frame. How depends on the engine: a player repaint request in Canvas Commons, a `render(t)` call for a pure-function renderer.

**4. Metadata per parameter:** min, max, step, group, a plain-language label, and the live or structural flag. Group by what the eye sees ("camera", "headline", "trail"), not by code structure.

```ts
type Param = {
  key: keyof typeof DEFAULTS; label: string;
  min: number; max: number; step: number; group: string; structural?: boolean;
};
const PARAMS: Param[] = [
  {key: 'WHIP_SECS', label: 'whip length (s)', min: 0.4, max: 1.6, step: 0.01, group: 'camera', structural: true},
  {key: 'DIP', label: 'pull-back during whip', min: 0.7, max: 1, step: 0.005, group: 'camera'},
];
```

**5. Plain-language labels.** Name controls after what the person sees or does: "loop from / loop length / play loop", not "beat start / beat len". Every keyboard shortcut also gets a visible button.

**6. Reset and Copy.** Reset clears the overrides. Copy puts the current values on the clipboard as JSON.

**7. Copy back to the defaults before rendering.** Headless renders run in a fresh browser profile with empty storage, so they only ever see the defaults. The flow: the human tunes, clicks Copy and pastes the JSON back; the agent bakes it into `DEFAULTS`; then the render matches what the human saw. A render shown to the human gets judged as the piece, so it only ever carries baked, final values ([verify-facts](verify-facts.md), "Final timing only").

**8. The panel never reaches the render.** It is an overlay outside the captured canvas, or hidden in render mode.

## Where the mechanics live

- Canvas Commons: the drop-in panel and the paused-frame repaint, in `canvas-commons`.
- A paused GSAP or HyperFrames timeline driving a state object, or any `render(t)` host: `motion-3d` → `hosts/hyperframes.md`, section "Live tuning".
