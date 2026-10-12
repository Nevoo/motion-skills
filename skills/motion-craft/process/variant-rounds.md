# Variant rounds: range, then depth, then sliders

**Use when:** the concept is chosen and its motion has to be found: how hard the whip hits, how much secondary motion, what leads. Run this before any slider session.

## Why

Sliders explore a neighbourhood; they cannot tell you the neighbourhood is wrong. Starting a taste session by dragging sliders from one seed polishes a local maximum. Generate the spread, because systematic variation is what the agent is good at. Let the human pick, because taste is theirs.

## Round 1: range (3 variants)

Three variants that differ in kind, not in amount:

- what leads the motion: the camera, the elements, or a morph;
- which curve family carries the key move: the calm four or the speed ramps;
- what the focal element is.

Each one must be shippable. No strawmen built to make a favourite win.

## Round 2: depth (up to 3×3)

Inside the winning variant, choose two named perceptual axes, for example aggression (how hard the whip hits) and texture (how much secondary motion). Implement each axis as a meta-parameter from 0 to 1 that moves several raw parameters together, coherently:

```ts
import {lerp} from '../assets/curves';

const aggression = (k: number) => ({
  WHIP_SECS: lerp(1.2, 0.7, k),                 // faster
  WHIP_CURVE: k < 0.5 ? 'RAMP' : 'RAMP_LONG',   // harder linger
  DIP: lerp(0.95, 0.86, k),                     // deeper pull-back
});
const texture = (k: number) => ({
  STAGGER: lerp(0.14, 0.06, k),                 // denser waves
  TRAIL: lerp(0, 1, k),                         // more secondary motion
});

// The grid samples both axes at 0, 0.5 and 1. A cell is overrides merged onto the defaults.
const LEVELS = [0, 0.5, 1];
const cells = LEVELS.flatMap(b => LEVELS.map(a => ({...DEFAULTS, ...aggression(a), ...texture(b)})));
```

**Why axes, not nine arbitrary presets.** Motion can't be taken in at a glance like nine static mockups. Comparison is sequential, and people hold two or three motions in memory at once. A grid in which each step changes one named quality stays navigable at nine cells; nine unrelated presets don't.

**Name axes after what the eye sees** ("how hard it whips", "how busy it is"), not craft jargon.

## Round 3: polish

After a cell wins, the two axes become sliders: the human drags continuously between variants instead of between raw numbers. Raw-parameter sliders remain for the last few percent. See [live tuning](live-tuning.md).

## What the panel needs

- **A visible 3×3 grid of buttons** with the active cell highlighted. Number keys 1–9 can be a shortcut, never the only way in; keyboard-only variants go unnoticed.
- **Play the same moment on every switch.** Each switch seeks to the start of the passage under test and plays it as a 1–2s loop. Comparing motions without an instant same-moment replay is worthless. Plain labels: "loop from", "loop length", "play loop".
- **Rebuild flags.** Cells whose structural parameters differ from the current build are marked, because they need a rebuild to show.
- **Copy.** Dumps the current cell plus slider state as JSON, to bake into the defaults.

## Static tie-in

For spacing and composition (not feel), tile the same frame, or an onion skin of the same move, from all nine cells into one low-resolution contact sheet. Composition can be judged at a glance, so this kills obviously wrong cells before the human plays anything. Commands are in [verify-facts](verify-facts.md).

Range before depth is a product designer's discipline (as described by Josh Puckett), applied here to motion.
