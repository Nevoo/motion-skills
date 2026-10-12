import {Path, PathProps} from '@canvas-commons/2d';
import {Reference, TimingFunction, easeOutCubic} from '@canvas-commons/core';

// Tip sits at (0,0), so `position` is the tip.
const ARROW = 'M0 0 L0 17 L4.2 13.2 L7 19.5 L9.6 18.4 L6.8 12.2 L12 12 Z';

export const CURSOR_COLOR = '#1798D4';

export function Cursor({
  ref,
  color = CURSOR_COLOR,
  ...props
}: {ref: Reference<Path>; color?: string} & Omit<PathProps, 'data'>) {
  return (
    <Path
      ref={ref}
      data={ARROW}
      fill={color}
      stroke={'rgba(0,0,0,0.18)'}
      lineWidth={1}
      {...props}
    />
  );
}

export function* moveCursor(
  cursor: Reference<Path>,
  to: [number, number],
  ease: TimingFunction = easeOutCubic,
  duration = 0.5,
) {
  yield* cursor().position(to, duration, ease);
}

export function* clickCursor(
  cursor: Reference<Path>,
  ease: TimingFunction = easeOutCubic,
  press = 0.07,
  release = 0.16,
) {
  yield* cursor().scale(0.86, press, ease);
  yield* cursor().scale(1, release, ease);
}
