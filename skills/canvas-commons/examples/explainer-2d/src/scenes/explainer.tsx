import {Camera, Circle, Layout, Line, Node, Path, Rect, Txt, blur, makeScene2D} from '@canvas-commons/2d';
import {
  Color,
  all,
  any,
  chain,
  createRef,
  createRefArray,
  createSignal,
  delay,
  linear,
  sequence,
  useDuration,
  waitFor,
  waitUntil,
} from '@canvas-commons/core';
import {Cursor, clickCursor} from '../Cursor';
import {BOUNCE, GLIDE, IN_OUT, OUT, RAMP, clamp01, lerp, seg} from '../curves';
import {mountPanel} from '../live-panel';
import {ACCENT, BG, FONT, HAIRLINE, INK, MUTED, SOFT, SURFACE} from '../palette';
import {COPY, UI, VARIANTS, params} from '../params';

export default makeScene2D(function* (view) {
  const P = params.values;
  const tick = createSignal(0);
  mountPanel('explainer-2d', params, {
    onChange: () => tick(tick() + 1),
    loop: {from: 1.4, length: 2.2},
    variants: VARIANTS,
  });
  const live = <T,>(read: () => T) => () => (tick(), read());

  // structural values are read once, while the scene builds (live-panel.md)
  const GAP = P.STAGE_GAP;
  const N = COPY.query.length;

  // master signals (canvas-commons references/signals.md): one tween each, everything else binds
  const keys = createSignal(0);
  const morph = createSignal(0);
  const fill = createSignal(0);
  const cardIn = createSignal(0);
  const clock = createSignal(0);
  const hero = createSignal(0);

  // typewriter steps per character on a linear clock (motion-craft rules/linear-reads-cheap.md)
  const shown = () => (keys() <= 0 ? 0 : Math.min(N, Math.floor(keys()) + 1));
  const typing = () => keys() > 0 && keys() < N;

  // morph progress split by property (motion-craft rules/curve-pairing.md)
  const tm = () => morph() * P.MORPH_SECS;
  const phys = () => BOUNCE(morph());
  const textP = () => OUT(morph());
  const soft = () => IN_OUT(morph());
  const gone = () => 1 - OUT(seg(tm(), 0, UI.dissolve));
  const caretOpacity = live(() => (typing() && keys() % 1 < UI.keyDip ? P.CARET_DIP : 1) * gone());
  const boxW = live(() => lerp(P.FIELD_W, P.PILL_W, phys()));
  const boxH = () => lerp(UI.fieldH, UI.pillH, phys());
  const textX = live(() => lerp(-P.FIELD_W / 2 + UI.textInset, -P.PILL_W / 2 + UI.pillTextInset, textP()));
  const dotP = () => OUT(seg(tm(), UI.dotDelay, P.MORPH_SECS - UI.dotDelay));
  const dotX = () => -boxW() / 2 + lerp(UI.iconInset, UI.pillDotInset, dotP());

  // blur derived from the whip's speed, zero at rest (motion-craft rules/effects-tied-to-motion.md)
  const slope = (p: number) => {
    const a = Math.max(0, p - 1e-3);
    const b = Math.min(1, p + 1e-3);
    return (RAMP(b) - RAMP(a)) / (b - a);
  };
  const PEAK = slope(0.5);
  const whipBlur = live(() => lerp(P.BLUR, P.HERO_BLUR, hero()) * clamp01(slope(clock()) / PEAK));

  const camera = createRef<Camera>();
  const field = createRef<Node>();
  const query = createRef<Txt>();
  const button = createRef<Rect>();
  const pointer = createRef<Node>();
  const cursor = createRef<Path>();
  const cardBox = createRef<Layout>();
  const words = createRefArray<Txt>();

  view.fontFamily(FONT);
  // one background, before the camera so it never pans (motion-craft rules/one-background.md)
  view.add(<Rect size={UI.frame} fill={BG} />);
  view.add(
    <Camera ref={camera}>
      <Node filters={[blur(whipBlur)]}>
        {/* stage 1: search field at y = 0 */}
        <Node ref={field} opacity={0} y={UI.enterRise}>
          <Rect
            width={boxW}
            height={boxH}
            radius={() => boxH() / 2}
            fill={() => Color.lerp(SURFACE, ACCENT, soft())}
            stroke={() => Color.lerp(HAIRLINE, ACCENT, soft())}
            lineWidth={UI.border}
            shadowColor={UI.shadow}
            shadowBlur={UI.shadowBlur}
            shadowOffsetY={UI.shadowY}
          />
          <Node x={() => -boxW() / 2 + UI.iconInset} opacity={gone}>
            <Circle size={UI.iconRing} x={UI.iconRingAt} y={UI.iconRingAt} stroke={MUTED} lineWidth={UI.iconStroke} />
            <Line points={UI.iconHandle} stroke={MUTED} lineWidth={UI.iconStroke} lineCap={'round'} />
          </Node>
          <Txt
            text={COPY.placeholder}
            anchor={[-1, 0]}
            x={live(() => -P.FIELD_W / 2 + UI.textInset + UI.placeholderNudge)}
            fontSize={UI.fieldText}
            fill={MUTED}
            opacity={() => (shown() > 0 ? 0 : 1)}
          />
          <Txt
            ref={query}
            text={() => COPY.query.slice(0, shown())}
            anchor={[-1, 0]}
            x={textX}
            fontSize={() => lerp(UI.fieldText, UI.pillText, textP())}
            fontWeight={() => lerp(UI.weight.field, UI.weight.pill, soft())}
            fill={() => Color.lerp(INK, SURFACE, soft())}
          />
          <Rect
            width={UI.caretW}
            height={UI.caretH}
            radius={UI.caretW / 2}
            fill={ACCENT}
            x={() => query().x() + query().width() + UI.caretGap}
            opacity={caretOpacity}
          />
          <Circle size={UI.dot} x={dotX} fill={() => Color.lerp(ACCENT, SURFACE, soft())} opacity={() => OUT(seg(tm(), UI.dotDelay, UI.dotFade))} />
          <Rect
            ref={button}
            x={() => boxW() / 2 - UI.btnInset - UI.btnW / 2}
            width={UI.btnW}
            height={UI.btnH}
            radius={UI.btnH / 2}
            fill={ACCENT}
            opacity={gone}
          >
            <Txt text={COPY.button} fontSize={UI.btnText} fontWeight={UI.weight.button} fill={SURFACE} />
          </Rect>
        </Node>
        <Node ref={pointer} position={UI.cursorFrom} scale={live(() => P.CURSOR_SCALE)} opacity={gone}>
          <Cursor ref={cursor} />
        </Node>

        {/* stage 2: count card at y = GAP */}
        <Node y={live(() => GAP + P.CARD_RISE * (1 - cardIn()))} opacity={cardIn}>
          <Rect
            size={() => cardBox().size()}
            radius={UI.cardRadius}
            fill={SURFACE}
            stroke={HAIRLINE}
            lineWidth={UI.border}
            shadowColor={UI.shadow}
            shadowBlur={UI.shadowBlur}
            shadowOffsetY={UI.shadowY}
          />
          {/* flex for structured content (canvas-commons references/layout.md) */}
          <Layout ref={cardBox} layout direction={'column'} alignItems={'start'} gap={UI.cardGap} padding={UI.cardPad} width={live(() => P.CARD_W)}>
            <Txt text={COPY.countLabel} fontSize={UI.labelSize} fontWeight={UI.weight.label} fill={MUTED} />
            {/* count-up and progress line bound to one OUT tween (motion-craft rules/linear-reads-cheap.md) */}
            <Txt
              text={live(() => `${Math.round(fill() * P.COUNT_TO)}`)}
              fontSize={UI.countSize}
              fontWeight={UI.weight.display}
              letterSpacing={UI.countTracking}
              textWrap={false}
              fill={INK}
            />
            <Rect layout width={'100%'} height={UI.barH} radius={UI.barH / 2} fill={SOFT}>
              <Rect width={() => `${fill() * 100}%`} height={'100%'} radius={UI.barH / 2} fill={ACCENT} />
            </Rect>
          </Layout>
        </Node>

        {/* stage 3: headline at y = 2 * GAP, laid out first, revealed second */}
        <Layout layout direction={'row'} gap={live(() => P.WORD_GAP)} y={2 * GAP}>
          {COPY.headline.map((word, i) => (
            <Txt
              ref={words}
              text={word}
              fontSize={live(() => P.HEAD_SIZE)}
              fontWeight={UI.weight.display}
              letterSpacing={live(() => P.TRACKING)}
              textWrap={false}
              fill={i === COPY.accentWord ? ACCENT : INK}
              opacity={0}
              translate={[0, P.WORD_RISE]}
            />
          ))}
        </Layout>
      </Node>
    </Camera>,
  );

  // column whip: RAMP glide plus a 1 -> DIP -> 1 zoom dip (motion-craft rules/column-whip.md, canvas-commons references/camera.md)
  function* whip(y: number, secs: number, isHero: number) {
    hero(isHero);
    clock(0);
    yield* all(
      camera().centerOn([0, y], secs, RAMP),
      camera().zoom(P.DIP, secs / 2, IN_OUT).to(1, secs / 2, OUT),
      clock(1, secs, linear),
    );
  }

  // stage 1: the field rises in, then types one character per key (time events: canvas-commons references/time-events.md)
  yield* all(
    field().opacity(1, UI.enterSecs, OUT),
    field().y(0, UI.enterSecs, OUT),
    chain(
      waitUntil('typing_starts'),
      all(
        keys(N, N * P.TYPE_STEP, linear),
        delay(
          P.CURSOR_LEAD,
          all(
            // pointer arc: x on IN_OUT, y on OUT and shorter (motion-craft rules/curve-pairing.md)
            pointer().x(button().x() + UI.cursorTip[0], P.CURSOR_SECS, IN_OUT),
            pointer().y(UI.cursorTip[1], P.CURSOR_SECS * UI.cursorDrop, OUT),
          ),
        ),
      ),
    ),
  );

  // click: only the pointer and the button react; the morph starts on the release frame (motion-craft rules/morph-not-crossfade.md)
  yield* waitUntil('click');
  yield* all(
    clickCursor(cursor, OUT, UI.pressSecs, UI.releaseSecs),
    button().scale(P.PRESS, UI.pressSecs, OUT).to(1, UI.releaseSecs, OUT),
    delay(UI.pressSecs, morph(1, P.MORPH_SECS, linear)),
  );

  // whip to the count; the card arrives from the whip's midpoint
  yield* waitUntil('first_whip');
  yield* all(
    whip(GAP, P.WHIP_1_SECS, 0),
    delay(P.WHIP_1_SECS / 2, cardIn(1, UI.cardInSecs, OUT)),
    delay(P.WHIP_1_SECS / 2 + UI.countDelay, fill(1, P.COUNT_SECS, OUT)),
  );

  // hero whip to the headline; words build as one wave with one accent (motion-craft rules/kinetic-headlines.md, rules/stagger-waves.md)
  yield* waitUntil('second_whip');
  yield* all(
    whip(2 * GAP, P.WHIP_2_SECS, 1),
    delay(
      P.WHIP_2_SECS / 2,
      sequence(
        P.WORD_DELAY,
        ...words.map(w => all(w.opacity(1, P.WORD_SECS, OUT), w.translate.y(0, UI.wordRiseSecs, OUT))),
      ),
    ),
  );

  // final hold: the GLIDE push-in runs past the end, so the last frame still moves (motion-craft rules/reel-pacing.md)
  const hold = useDuration('end');
  yield* any(camera().zoom(P.END_ZOOM, hold * UI.driftSpan, GLIDE), waitFor(hold));
});
