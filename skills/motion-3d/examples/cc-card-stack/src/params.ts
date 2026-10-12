import type {ParamSet, Variant} from './live-panel';

export const FONT_FAMILY = '"Plus Jakarta Sans", system-ui, sans-serif';
export const FONT_WEIGHT = 800;
export const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&display=block';

export const BG = '#F3F1EC';
export const INK = '#16161A';
export const CARD_INK = '#FFFFFF';
export const HEADLINE = 'lift off.';

export interface Card {
  text: string;
  h: number;
  z: number;
  lean: number; // sign and share of the "resting lean" slider
  top: string;
  bottom: string;
}

// Top stops keep white text at 3.6:1 or more.
export const CARDS: Card[] = [
  {text: 'three', h: 0.92, z: -0.06, lean: -1, top: '#E8553A', bottom: '#C2410C'},
  {text: 'two', h: 1.0, z: 0, lean: 0.85, top: '#3478F0', bottom: '#1D4ED8'},
  {text: 'one', h: 1.08, z: -0.05, lean: -1.1, top: '#7C5CFA', bottom: '#5B21B6'},
];

export const BUILD = {
  VIEW_W: 1920,
  VIEW_H: 1080,
  SUPERSAMPLE: 2,
  NEAR: 0.05,
  FAR: 100,
  CARD_BAKE_PX: 480,
  HEAD_BAKE_PX: 640,
  HEAD_PAD_PX: 64,
};

export const DEFAULTS = {
  LENS_DEG: 38,
  FILL_FIRST: 0.46,
  FILL_PUNCH: 0.58,
  FILL_STEP: 0.03,
  FILL_END: 0.82,
  CREEP: 0.06,

  POP_SECS: 0.34,
  PUNCH_SECS: 0.42,
  POP_DELAY: 0.06,
  GAP_SECS: 0.12,
  READ_SECS: 0.15,
  PULL_SECS: 1.0,
  FADE_FROM: 0.6,
  HOLD_SECS: 1.5,

  POP_DEPTH: 0.95,
  POP_SIZE: 0.55,
  POP_FADE: 1.4,
  POP_LEAN: 0.26,

  LEAN_DEG: 4.5,
  TURN_Y: 0.13,
  TURN_X: 0.05,
  OVERLAP: 0.12,

  PASS: 0.36,
  LENS_CLEAR_FROM: 0.1,
  LENS_CLEAR_TO: 0.35,
  SHRINK: 0.12,
  HEAD_PX: 380,
  HEAD_TRACK: -0.02,
};

export type Params = typeof DEFAULTS;

export const params: ParamSet<Params> = {
  values: {...DEFAULTS},
  meta: {
    LENS_DEG: {min: 20, max: 70, step: 1, label: 'lens angle (deg)', group: 'camera'},
    FILL_FIRST: {min: 0.2, max: 0.8, step: 0.01, label: 'first card fills (share of height)', group: 'camera'},
    FILL_PUNCH: {min: 0.2, max: 0.9, step: 0.01, label: 'punched card fills', group: 'camera'},
    FILL_STEP: {min: 0, max: 0.15, step: 0.005, label: 'each punch fills more by', group: 'camera'},
    FILL_END: {min: 0.3, max: 1.2, step: 0.01, label: 'pull back until the stack would fill', group: 'camera'},
    CREEP: {min: 0, max: 0.3, step: 0.005, label: 'camera drift back (units/s)', group: 'camera'},

    POP_SECS: {min: 0.15, max: 0.8, step: 0.01, label: 'pop length (s)', group: 'timing', structural: true},
    PUNCH_SECS: {min: 0.2, max: 0.9, step: 0.01, label: 'punch length (s)', group: 'timing', structural: true},
    POP_DELAY: {min: 0, max: 0.2, step: 0.01, label: 'pop starts into the punch (s)', group: 'timing', structural: true},
    GAP_SECS: {min: 0, max: 0.5, step: 0.01, label: 'pause between punches (s)', group: 'timing', structural: true},
    READ_SECS: {min: 0, max: 0.8, step: 0.01, label: 'pause before pulling back (s)', group: 'timing', structural: true},
    PULL_SECS: {min: 0.5, max: 2, step: 0.01, label: 'pull-back length (s)', group: 'timing', structural: true},
    FADE_FROM: {min: 0, max: 0.95, step: 0.01, label: 'stack fades from (share of pull-back)', group: 'timing', structural: true},
    HOLD_SECS: {min: 0.5, max: 4, step: 0.05, label: 'final hold (s)', group: 'timing', structural: true},

    POP_DEPTH: {min: 0, max: 3, step: 0.01, label: 'pop travel from behind (units)', group: 'pop'},
    POP_SIZE: {min: 0.1, max: 1, step: 0.01, label: 'pop start size', group: 'pop'},
    POP_FADE: {min: 1, max: 4, step: 0.05, label: 'pop fade-in speed', group: 'pop'},
    POP_LEAN: {min: 0, max: 0.8, step: 0.01, label: 'pop extra lean (rad)', group: 'pop'},

    LEAN_DEG: {min: 0, max: 12, step: 0.1, label: 'resting lean (deg)', group: 'tilt'},
    TURN_Y: {min: -0.4, max: 0.4, step: 0.005, label: 'stack turn (rad)', group: 'tilt'},
    TURN_X: {min: -0.3, max: 0.3, step: 0.005, label: 'stack tip back (rad)', group: 'tilt'},
    OVERLAP: {min: -0.1, max: 0.4, step: 0.005, label: 'card overlap (units)', group: 'tilt'},

    PASS: {min: 0.05, max: 0.9, step: 0.01, label: 'headline depth (share of pull-back)', group: 'pull-back'},
    LENS_CLEAR_FROM: {min: 0, max: 1, step: 0.01, label: 'headline clear at the lens until (share of final distance)', group: 'pull-back'},
    LENS_CLEAR_TO: {min: 0, max: 1.5, step: 0.01, label: 'headline solid from (share of final distance)', group: 'pull-back'},
    SHRINK: {min: 0.02, max: 1, step: 0.01, label: 'stack size at the end', group: 'pull-back'},
    HEAD_PX: {min: 80, max: 520, step: 1, label: 'headline size (px)', group: 'pull-back'},
    HEAD_TRACK: {min: -0.08, max: 0.04, step: 0.005, label: 'headline letter spacing (em)', group: 'pull-back', structural: true},
  },
};

export const VARIANTS: Variant<Params>[] = [
  {label: 'calmer tilt', values: {LEAN_DEG: 2.5, POP_LEAN: 0.14, TURN_Y: 0.06, TURN_X: 0.02}},
  {label: 'livelier tilt', values: {LEAN_DEG: 6.5, POP_LEAN: 0.38, TURN_Y: 0.2, TURN_X: 0.08}},
  {label: 'earlier pass', values: {PASS: 0.22}},
  {label: 'later pass', values: {PASS: 0.5}},
];
