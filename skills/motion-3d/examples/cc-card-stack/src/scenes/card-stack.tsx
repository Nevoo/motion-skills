import {Node, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {all, chain, createSignal, linear, useScene, waitFor} from '@canvas-commons/core';
import {Group, PerspectiveCamera, Scene} from 'three';

import {OUT, RAMP} from '../curves';
import {DEG, depthFade, distFor, lerp, pxToWorld} from '../depth';
import {mountPanel} from '../live-panel';
import {fontString, makeLabelPlane} from '../makeLabelTexture';
import {
  BG,
  BUILD,
  CARDS,
  CARD_INK,
  DEFAULTS,
  FONT_FAMILY,
  FONT_WEIGHT,
  HEADLINE,
  INK,
  VARIANTS,
  type Params,
  params,
} from '../params';
import {Three} from '../Three';

const N = CARDS.length;

// Card centres top to bottom with a small overlap, re-centred on y = 0.
function stackLayout(overlap: number) {
  const c: number[] = [];
  CARDS.forEach((k, i) => c.push(i === 0 ? 0 : c[i - 1] - (CARDS[i - 1].h / 2 + k.h / 2 - overlap)));
  const top = c[0] + CARDS[0].h / 2;
  const bottom = c[N - 1] - CARDS[N - 1].h / 2;
  return {Y: c.map(v => v - (top + bottom) / 2), height: top - bottom};
}

// Beat times in seconds; mirrors story() in the scene.
function schedule(p: Params) {
  const land = [0];
  let t = p.POP_SECS;
  for (let i = 1; i < N; i++) {
    t += p.GAP_SECS;
    land.push(t + p.PUNCH_SECS);
    t += Math.max(p.PUNCH_SECS, p.POP_DELAY + p.POP_SECS);
  }
  const pullFrom = t + p.READ_SECS;
  const pullTo = pullFrom + p.PULL_SECS;
  return {land, pullFrom, pullTo, end: pullTo + p.HOLD_SECS};
}

let measureCtx: CanvasRenderingContext2D | null = null;
function metrics(text: string, px: number) {
  measureCtx ??= document.createElement('canvas').getContext('2d')!;
  measureCtx.font = fontString(FONT_WEIGHT, px, FONT_FAMILY);
  const ink = measureCtx.measureText(text);
  const box = measureCtx.measureText('Mg');
  return {
    inkH: ink.actualBoundingBoxAscent + ink.actualBoundingBoxDescent,
    // ink centre below a Txt's box centre (canvas-commons references/txt-gotchas.md, section 2)
    inkCentre:
      (box.fontBoundingBoxAscent - box.fontBoundingBoxDescent) / 2 -
      (ink.actualBoundingBoxAscent - ink.actualBoundingBoxDescent) / 2,
  };
}

export default makeScene2D(function* (view) {
  const P = params.values;
  const tick = createSignal(0);
  const loop = schedule(DEFAULTS);
  mountPanel('card stack', params, {
    onChange: () => tick(tick() + 1),
    loop: {from: loop.pullFrom - 0.3, length: loop.pullTo - loop.pullFrom + 1},
    variants: VARIANTS,
  });
  const S = schedule(P); // after mountPanel, which applies the tuner's stored values

  // state-apply-architecture (motion-3d rules/state-apply-architecture.md): signals are the state
  const clock = createSignal(0);
  const appear = CARDS.map(() => createSignal(0));
  const step = createSignal(0); // which card the camera frames, 0..N-1
  const pull = createSignal(0);
  const stackFade = createSignal(1);
  const planeOn = createSignal(1); // 1: the 3D headline plane, 0: the 2D headline

  const scene = new Scene();
  const camera = new PerspectiveCamera(P.LENS_DEG, BUILD.VIEW_W / BUILD.VIEW_H, BUILD.NEAR, BUILD.FAR);
  const stack = new Group();
  scene.add(stack);

  // stacked-gradient-cards (motion-3d rules/stacked-gradient-cards.md)
  const cards = CARDS.map((k, i) => {
    const card = makeLabelPlane(k.text, k.h, {
      fontFamily: FONT_FAMILY,
      fontWeight: FONT_WEIGHT,
      fontPx: BUILD.CARD_BAKE_PX,
      pill: [k.top, k.bottom],
      ink: CARD_INK,
      minAspect: 1,
      opacity: 0,
    });
    card.mesh.renderOrder = i; // sticker layering: lower cards paint over upper ones
    stack.add(card.mesh);
    return card;
  });

  // text-as-texture (motion-3d rules/text-as-texture.md): baked tight to the ink, so it can match the 2D type
  const head = makeLabelPlane(HEADLINE, 1, {
    fontFamily: FONT_FAMILY,
    fontWeight: FONT_WEIGHT,
    fontPx: BUILD.HEAD_BAKE_PX,
    ink: INK,
    box: 'ink',
    padY: BUILD.HEAD_PAD_PX,
    tracking: P.HEAD_TRACK,
  });
  head.mesh.renderOrder = 100;
  scene.add(head.mesh);

  // frame-by-fill (motion-3d rules/frame-by-fill.md): every camera distance is a fill fraction
  const rig = (t: number) => {
    const fov = P.LENS_DEG;
    const {Y, height} = stackLayout(P.OVERLAP);
    const fill = (i: number) => (i === 0 ? P.FILL_FIRST : P.FILL_PUNCH + P.FILL_STEP * (i - 1));
    // minus the drift the camera has summed by the time it lands on card i
    const zFor = (i: number) => CARDS[i].z + distFor(CARDS[i].h, fill(i), fov) - P.CREEP * S.land[i];
    const zEnd = distFor(height, P.FILL_END, fov);
    const zFrom = zFor(N - 1) + P.CREEP * S.pullFrom;
    const zPlane = lerp(zFrom, zEnd, P.PASS);
    const s = step();
    const i = Math.min(N - 2, Math.floor(s));
    const f = s - i;
    const zCount = lerp(zFor(i), zFor(i + 1), f);
    // the drift runs from frame 0 under every move, so the camera never rests
    const camZ = lerp(zCount, zEnd - P.CREEP * S.pullTo, pull()) + P.CREEP * t;
    return {fov, Y, camY: lerp(Y[i], Y[i + 1], f), camZ, lookY: Y[N - 1], zPlane, settle: zEnd - zPlane};
  };

  const headHeight = (settle: number, fov: number) =>
    (pxToWorld(metrics(HEADLINE, P.HEAD_PX).inkH, settle, fov, BUILD.VIEW_H) * head.label.canvas.height) /
    metrics(HEADLINE, BUILD.HEAD_BAKE_PX).inkH;

  const apply = (t: number) => {
    const r = rig(t);
    camera.fov = r.fov; // the bridge updates the projection on every draw
    camera.position.set(0, r.camY, r.camZ);
    camera.lookAt(0, r.camY, r.camZ - 1); // position and target move together: a translate, never a swing
    camera.updateMatrixWorld();

    // playful-tilt (motion-3d rules/playful-tilt.md): the turn straightens on the pull-back's curve
    const p = pull();
    stack.scale.setScalar(lerp(1, P.SHRINK, p)); // about the stack centre, above the look line: it rises clear of the headline
    stack.rotation.set(P.TURN_X * (1 - p), P.TURN_Y * (1 - p), 0);

    // depth-pop (motion-3d rules/depth-pop.md) with the unwinding pop lean
    const fade = stackFade();
    cards.forEach(({mesh, material}, i) => {
      const a = appear[i]();
      mesh.visible = a > 0.001 && fade > 0.001;
      mesh.position.set(0, r.Y[i], CARDS[i].z - P.POP_DEPTH * (1 - a));
      mesh.scale.setScalar(lerp(P.POP_SIZE, 1, a));
      mesh.rotation.z = CARDS[i].lean * P.LEAN_DEG * DEG + (1 - a) * (i % 2 ? -1 : 1) * P.POP_LEAN;
      material.opacity = Math.min(1, a * P.POP_FADE) * fade;
    });

    // pull-back-through-text (motion-3d rules/pull-back-through-text.md): the frustum reveals it
    // depth-dissolve (motion-3d rules/depth-dissolve.md) only at the lens, so the pass never fills the frame with ink
    head.material.opacity = depthFade(r.camZ - r.zPlane, {
      nearStart: P.LENS_CLEAR_FROM * r.settle,
      nearEnd: P.LENS_CLEAR_TO * r.settle,
    });
    head.mesh.visible = planeOn() > 0.5 && p > 0 && head.material.opacity > 0.003;
    head.mesh.position.set(0, r.lookY, r.zPlane);
    head.mesh.scale.setScalar(headHeight(r.settle, r.fov));
  };
  useScene().lifecycleEvents.onBeginRender.subscribe(() => apply(clock()));
  apply(clock());

  // After the hand-off the 2D headline recedes exactly as the plane would: settle / current distance.
  const headScale = () => {
    const r = rig(clock());
    return r.settle / Math.max(1e-3, r.camZ - r.zPlane);
  };

  // compositing-3d-and-2d (motion-3d rules/compositing-3d-and-2d.md): 2D under, transparent 3D, 2D over
  view.add(<Rect width={BUILD.VIEW_W} height={BUILD.VIEW_H} fill={BG} />);
  view.add(
    <Three
      scene={scene}
      camera={camera}
      quality={BUILD.SUPERSAMPLE}
      width={BUILD.VIEW_W}
      height={BUILD.VIEW_H}
    />,
  );
  view.add(
    <Node opacity={() => 1 - planeOn()} scale={() => (tick(), headScale())}>
      <Txt
        text={HEADLINE}
        fontFamily={FONT_FAMILY}
        fontWeight={FONT_WEIGHT}
        fill={INK}
        textWrap={false}
        fontSize={() => (tick(), P.HEAD_PX)}
        letterSpacing={() => (tick(), P.HEAD_TRACK * P.HEAD_PX)}
        y={() => (tick(), -metrics(HEADLINE, P.HEAD_PX).inkCentre)}
      />
    </Node>,
  );

  // punch-through-stack (motion-3d rules/punch-through-stack.md): camera and card arrive together
  function* punchTo(i: number) {
    yield* all(step(i, P.PUNCH_SECS, RAMP), chain(waitFor(P.POP_DELAY), appear[i](1, P.POP_SECS, OUT)));
  }

  function* story() {
    yield* appear[0](1, P.POP_SECS, OUT); // the camera already frames the first card
    for (let i = 1; i < N; i++) {
      yield* waitFor(P.GAP_SECS);
      yield* punchTo(i);
    }
    yield* waitFor(P.READ_SECS);
    // pull-back-through-text: one recession; the stack shrinks, straightens and fades late
    yield* all(
      pull(1, P.PULL_SECS, RAMP),
      chain(waitFor(P.PULL_SECS * P.FADE_FROM), stackFade(0, P.PULL_SECS * (1 - P.FADE_FROM), OUT)),
    );
    planeOn(0); // compositing-3d-and-2d: same frame, same size, the 2D headline takes over
  }

  // Linear time under everything, not linear motion: the camera drift reads it.
  yield* all(clock(S.end, S.end, linear), story());
});
