import type {ParamSet} from './live-panel';

export const W = 1920;
export const H = 1080;
export const FONT = `'Inter Tight', system-ui, sans-serif`;
export const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;800&display=block';

export const BG = '#0D0E12';
export const INK = '#F3F1EA';
export const MUTED = '#7E828C';
export const ACCENT = '#FF6A3D';
export const GHOST = '#3A3E49';

export const STEPS = ['01', '02', '03', '04', '05'];
export const WORDS = ['design', 'build', 'test', 'ship'];
export const MILESTONES = ['v0.1', 'v0.5', 'v0.9', 'v1.0'];
export const PATH_POINTS: Array<[number, number, number]> = [
  [-3.8, -0.5, 0.9], [-1.9, -0.2, -0.9], [0, -0.6, 0.7], [1.9, -0.1, -0.9], [3.8, 0.4, 0.6],
];

// Ink widths per unit of label height, measured once with Inter Tight loaded (drum words: their mean); framing reads these, never the live bake.
export const MEASURED = {ideaW: 1.49, drumLeadW: 1.62, drumWordMeanW: 1.75};

type Pose = {pos: readonly [number, number, number]; tgt: readonly [number, number, number]};
// Baked landing poses: offsets from each section's anchor. Reading distances come from the fill sliders and are added to z.
export const POSES: Record<string, Pose> = {
  open: {pos: [-2.9, 0.9, 2.6], tgt: [-0.7, 0.25, 0]},
  title: {pos: [0.75, 0.15, 0], tgt: [0.35, -0.05, 0]},
  tunnel: {pos: [0, 0, 0], tgt: [0, 0, 0]},
  tunnelDrift: {pos: [0.12, -0.05, 0], tgt: [0.05, 0, -0.6]},
  drum: {pos: [0.35, -0.3, 0], tgt: [0, 0, 0]},
  drumDrift: {pos: [0.85, -0.4, 0], tgt: [0.15, 0, -0.4]},
  path: {pos: [0, 1.3, 0], tgt: [0, -0.3, 0]},
  pathDrift: {pos: [0.6, 1.25, 0], tgt: [0.45, -0.35, 0]},
  pulled: {pos: [2.6, 3.6, 0], tgt: [0.4, 2.3, 0]},
  end: {pos: [3.1, 3.9, 1.2], tgt: [0.4, 2.3, 0]},
};

// Entrance cues in seconds, relative to the camera key each one is locked to (negative = before it).
export const CUES = {
  pop: 0.55,
  titleAt: [0, 0.1, 0.18, 0.26],
  tunnelOn: 0.25,
  drumIn: -0.5,
  drumSpinFrom: -0.25,
  drumSpinTo: 0.1,
  drumLeadIn: -1.2,
  pathIn: -0.85,
  pathDraw: -0.6,
  nodeLead: 0.08,
  clear: -0.1,
  clearSecs: 0.5,
  lockAt: 0.45,
  lockSecs: 0.75,
  veilSecs: 0.5,
};

// Set-piece geometry that is built once. Sizes are in units of the piece's own label height.
export const TITLE = {y: -0.3, fromSize: 0.28, fromRise: 0.55, fromZ: 1.1, echoes: [0.45, 0.22], popScale: 0.75, popFade: 1.5};
export const TUNNEL = {firstZ: -4, passGap: 1.6, tighten: 0.45, angleStep: 1.15, angle0: 0.6, squash: 0.6, tilt: 0.09, windowSoft: 2.5};
export const DRUM = {bandLow: 0.3, bandSoft: 0.55};
export const PATH = {segments: 240, sides: 10, ghostRadius: 0.55, tagDrop: 0.45};
export const DUST = {inner: 2.2, outer: 8, squash: 0.75, spread: 3};
export const HAZE_OPEN = {near: 40, far: 120, share: 0.6};
export const LOCKUP = {fontSize: 220, tracking: -0.04, gap: 0.16, fadeLead: 3};
export const LENS_FPS = 60;

export const DEFAULTS = {
  introSecs: 1.5,
  tunnelFlySecs: 1.5,
  tunnelDriftSecs: 0.45,
  drumFlySecs: 0.9,
  drumDriftSecs: 1.0,
  pathFlySecs: 1.05,
  pathDriftSecs: 1.1,
  pullSecs: 1.25,
  endSecs: 1.1,
  pathDrawSecs: 1.1,

  fov: 38,
  titleFill: 0.5,
  tunnelFill: 0.46,
  drumFill: 0.62,
  pathFill: 0.68,
  endFill: 0.36,
  driftUnits: 0.5,
  tunnelRoll: 0.32,
  tunnelLensKick: 8,
  drumRoll: 0.035,
  pathRoll: -0.03,
  endRoll: -0.08,

  tunnelX: 1.4,
  tunnelEndZ: -20,
  drumX: 3.4,
  drumZ: -31,
  pathX: 5.4,
  pathY: -4.6,
  pathZ: -45,

  titleH: 2.4,
  stepH: 1.3,
  lastStepH: 2.1,
  nodeSize: 0.13,
  nodeLabelH: 0.32,
  lineRadius: 0.04,
  popTravel: 1.6,
  echoGap: 0.9,
  tunnelWindow: 7,
  tunnelSpiral: 1.5,
  drumH: 1.0,
  drumRadius: 1.25,
  drumTurn: 0.12,
  drumSnap: 0.7,
  drumStep: 0.85,

  dissolveNear: 0.5,
  dissolveFar: 2.3,
  hazeNear: 12,
  hazeFar: 30,
  dustSize: 0.045,

  speedFloor: 1.5,
  speedCurve: 1.35,
  blurSubtle: 0.025,
  blurHero: 0.075,
  fringeRest: 0.45,
  fringeSubtle: 2,
  fringeHero: 5.5,
  heroFrom: 0.1,
  heroTo: 0.95,

  veil: 0.6,
  endScale: 3,
  endCreep: 0.025,

  quality: 2,
  dustCount: 500,
};

export type Params = typeof DEFAULTS;

const s = (min: number, max: number, step: number, label: string, group: string, structural = false) => ({
  min, max, step, label, group, structural,
});

export const params: ParamSet<Params> = {
  values: {...DEFAULTS},
  meta: {
    introSecs: s(0.8, 3, 0.05, 'opening dolly (s)', 'timing', true),
    tunnelFlySecs: s(0.8, 3, 0.05, 'fly through numbers (s)', 'timing', true),
    tunnelDriftSecs: s(0.2, 1.2, 0.05, 'drift past 05 (s)', 'timing', true),
    drumFlySecs: s(0.4, 1.6, 0.05, 'fly to word drum (s)', 'timing', true),
    drumDriftSecs: s(0.5, 2, 0.05, 'word drum read (s)', 'timing', true),
    pathFlySecs: s(0.4, 1.6, 0.05, 'drop to path (s)', 'timing', true),
    pathDriftSecs: s(0.6, 2, 0.05, 'path read (s)', 'timing', true),
    pullSecs: s(0.6, 2.5, 0.05, 'final pull-back (s)', 'timing', true),
    endSecs: s(0.6, 2, 0.05, 'end title hold (s)', 'timing', true),
    pathDrawSecs: s(0.5, 1.6, 0.05, 'path draw (s)', 'timing'),

    fov: s(30, 55, 0.5, 'lens angle (deg)', 'camera'),
    titleFill: s(0.3, 0.8, 0.01, 'title width in frame', 'camera'),
    tunnelFill: s(0.25, 0.7, 0.01, '05 height in frame', 'camera'),
    drumFill: s(0.4, 0.9, 0.01, 'word drum width in frame', 'camera'),
    pathFill: s(0.5, 0.95, 0.01, 'path width in frame', 'camera'),
    endFill: s(0.15, 0.8, 0.01, 'path width at the end', 'camera'),
    driftUnits: s(0.1, 1.2, 0.05, 'drift after each landing', 'camera'),
    tunnelRoll: s(0, 0.8, 0.01, 'tunnel camera spin (rad)', 'camera'),
    tunnelLensKick: s(0, 14, 0.5, 'tunnel lens widen (deg)', 'camera'),
    drumRoll: s(-0.15, 0.15, 0.005, 'lean at word drum (rad)', 'camera'),
    pathRoll: s(-0.15, 0.15, 0.005, 'lean at path (rad)', 'camera'),
    endRoll: s(-0.3, 0.3, 0.01, 'lean at the end (rad)', 'camera'),

    tunnelX: s(-3, 4, 0.05, 'numbers sideways', 'world layout'),
    tunnelEndZ: s(-30, -14, 0.1, '05 distance', 'world layout'),
    drumX: s(-2, 8, 0.05, 'word drum sideways', 'world layout'),
    drumZ: s(-45, -24, 0.1, 'word drum distance', 'world layout'),
    pathX: s(-2, 10, 0.05, 'path sideways', 'world layout'),
    pathY: s(-10, 2, 0.05, 'path height', 'world layout'),
    pathZ: s(-60, -36, 0.1, 'path distance', 'world layout'),

    titleH: s(1.2, 3.5, 0.05, 'title size', 'set pieces', true),
    stepH: s(0.6, 2.5, 0.05, 'number size', 'set pieces', true),
    lastStepH: s(1, 3.5, 0.05, '05 size', 'set pieces', true),
    nodeSize: s(0.04, 0.3, 0.005, 'path dot size', 'set pieces', true),
    nodeLabelH: s(0.15, 0.7, 0.01, 'path label size', 'set pieces', true),
    lineRadius: s(0.01, 0.12, 0.002, 'path line thickness', 'set pieces', true),
    popTravel: s(0, 4, 0.05, 'pop-in depth travel', 'set pieces'),
    echoGap: s(0, 2, 0.05, 'title echo spacing', 'set pieces'),
    tunnelWindow: s(3, 14, 0.1, 'numbers visible ahead', 'set pieces'),
    tunnelSpiral: s(0, 3, 0.05, 'numbers spiral width', 'set pieces'),
    drumH: s(0.6, 1.6, 0.05, 'word drum size', 'set pieces', true),
    drumRadius: s(0.6, 2.5, 0.05, 'word drum radius', 'set pieces'),
    drumTurn: s(0, 0.4, 0.01, 'word drum turn (rad)', 'set pieces'),
    drumSnap: s(0, 0.95, 0.01, 'drum slow-down on each word', 'set pieces'),
    drumStep: s(0.4, 1.4, 0.01, 'drum angle between words (rad)', 'set pieces'),

    dissolveNear: s(0, 2, 0.05, 'gone at distance', 'depth'),
    dissolveFar: s(0.5, 5, 0.05, 'solid from distance', 'depth'),
    hazeNear: s(2, 30, 0.5, 'haze starts at', 'depth'),
    hazeFar: s(10, 60, 0.5, 'haze hides at', 'depth'),
    dustSize: s(0, 0.1, 0.001, 'dust size', 'depth'),

    speedFloor: s(0, 6, 0.1, 'blur starts above speed', 'speed blur'),
    speedCurve: s(0.5, 3, 0.05, 'blur onset curve', 'speed blur'),
    blurSubtle: s(0, 0.1, 0.001, 'blur on every move', 'speed blur'),
    blurHero: s(0, 0.2, 0.001, 'blur on the hero move', 'speed blur'),
    fringeRest: s(0, 2, 0.05, 'colour fringe at rest (px)', 'speed blur'),
    fringeSubtle: s(0, 6, 0.1, 'colour fringe, every move (px)', 'speed blur'),
    fringeHero: s(0, 12, 0.1, 'colour fringe, hero move (px)', 'speed blur'),
    heroFrom: s(-0.5, 1.5, 0.05, 'hero blur from (s into tunnel)', 'speed blur'),
    heroTo: s(0, 2, 0.05, 'hero blur to (s into tunnel)', 'speed blur'),

    veil: s(0, 1, 0.01, 'world dim behind end title', 'ending'),
    endScale: s(1, 6, 0.1, 'end title start size', 'ending'),
    endCreep: s(0, 0.1, 0.001, 'end title push-in per second', 'ending'),

    quality: s(1, 3, 1, '3D sharpness (supersample)', 'build', true),
    dustCount: s(0, 1500, 10, 'dust count', 'build', true),
  },
};
