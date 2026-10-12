import {Circle, Layout, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {all, createRef, createSignal, waitUntil} from '@canvas-commons/core';
import {IN_OUT, OUT} from '../ease';

const BG = '#ECEFE6';
const INK = '#111411';
const ACCENT = '#E0306E';

export default makeScene2D(function* (view) {
  const reveal = createSignal(0);
  const title = createRef<Txt>();

  view.fontFamily(`system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`);
  view.add(<Rect width={1920} height={1080} fill={BG} />);
  view.add(
    <Layout layout direction="column" alignItems="center" gap={28}>
      <Circle size={() => 40 + 120 * reveal()} fill={ACCENT} />
      <Txt ref={title} text="Hello, motion" textWrap={false} fontSize={96} fontWeight={800} fill={INK} opacity={() => reveal()} />
    </Layout>,
  );

  yield* reveal(1, 0.6, OUT);
  yield* waitUntil('settle');
  yield* all(title().letterSpacing(-3, 0.5, IN_OUT), reveal(0.6, 0.5, IN_OUT));
  yield* waitUntil('end');
});
