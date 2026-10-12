import {Layout, Node, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {createComputed, createRef, createSignal, linear, useScene} from '@canvas-commons/core';
import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';

import {Three} from '../Three';
import {applyCamera} from '../camera-path';
import {BOUNCE, GLIDE, IN_OUT, OUT, clamp01, lerp, seg} from '../curves';
import {depthFade, viewDepth, windowFade} from '../depth';
import {DRUM_GAP, flightPlan, hero, landings, ratchet, timeline} from '../flight';
import {makeLensPass} from '../lens';
import {mountPanel} from '../live-panel';
import {makeLabelPlane} from '../makeLabelTexture';
import {
  ACCENT, BG, CUES, DRUM, DUST, FONT, GHOST, H, HAZE_OPEN, INK, LENS_FPS, LOCKUP, MEASURED, MILESTONES,
  MUTED, PATH, PATH_POINTS, STEPS, TITLE, TUNNEL, W, WORDS, params,
} from '../params';

type Fadeable = {obj: THREE.Object3D; mats: THREE.Material[]; vis: (t: number, depth: number) => number; keep: boolean};

const TAU = Math.PI * 2;
const hash01 = (n: number) => {
  let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const basic = (color: string) =>
  new THREE.MeshBasicMaterial({color, transparent: true, opacity: 0, depthTest: false, depthWrite: false});

export default makeScene2D(function* (view) {
  // live-panel (canvas-commons references/live-panel.md): sliders write P; apply() reads P on every draw
  const P = params.values;
  const tick = createSignal(0);
  mountPanel('flight', params, {
    onChange: () => tick(tick() + 1),
    loop: {from: 1.2, length: 2.4},
    variants: [
      {label: 'calm lens', values: {blurHero: 0.04, fringeHero: 3, tunnelLensKick: 4}},
      {label: 'big spin', values: {tunnelRoll: 0.6, tunnelLensKick: 12}},
      {label: 'hard ratchet', values: {drumSnap: 0.9}},
    ],
  });

  // pure-function-of-time (motion-3d rules/pure-function-of-time.md): one linear clock, everything else derived from it
  const clock = createSignal(0);
  const T = timeline(P);
  const plan = createComputed(() => (tick(), flightPlan(P)));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(P.fov, W / H, 0.05, 400);
  const fog = new THREE.Fog(BG, P.hazeNear, P.hazeFar);
  scene.fog = fog;

  const updates: Array<(t: number) => void> = [];
  const fadeables: Fadeable[] = [];
  const fade = (obj: THREE.Object3D, mats: THREE.Material[], vis: Fadeable['vis'], keep = false) =>
    fadeables.push({obj, mats, vis, keep});
  const label = (text: string, h: number, ink: string, weight = 800, align: 'left' | 'center' | 'right' = 'center') => {
    const plane = makeLabelPlane(text, h, {fontFamily: FONT, fontWeight: weight, ink, tracking: weight > 600 ? -0.04 : 0, align});
    plane.material.opacity = 0;
    return plane;
  };

  // depth-pop (motion-3d rules/depth-pop.md): layered title planes rush forward from behind their rest depth
  const ideaW = MEASURED.ideaW * P.titleH;
  const titleLayers = [
    {plane: label('idea', P.titleH, INK), at: () => [0, TITLE.y, 0], alpha: 1},
    {plane: label('from', P.titleH * TITLE.fromSize, MUTED, 800, 'left'), at: () => [-ideaW / 2, TITLE.y + P.titleH * TITLE.fromRise, TITLE.fromZ], alpha: 1},
    ...TITLE.echoes.map((alpha, i) => ({plane: label('idea', P.titleH, ACCENT), at: () => [0, TITLE.y, -P.echoGap * (i + 1)], alpha})),
  ];
  titleLayers.forEach(({plane, at, alpha}, i) => {
    const a = (t: number) => OUT(seg(t, CUES.titleAt[i], CUES.pop));
    scene.add(plane.mesh);
    updates.push(t => {
      const [x, y, z] = at();
      plane.mesh.position.set(x, y, z - P.popTravel * (1 - a(t)));
      plane.mesh.scale.setScalar(lerp(TITLE.popScale, 1, a(t)));
    });
    fade(plane.mesh, [plane.material], t => Math.min(1, a(t) * TITLE.popFade) * alpha);
  });

  // tunnel (motion-3d rules/tunnel.md): numbers on a tightening spiral, shown only in a window ahead of the camera
  const last = STEPS.length - 1;
  const tunnelOn = (t: number) => OUT(seg(t, P.introSecs + CUES.tunnelOn, CUES.pop));
  STEPS.forEach((text, k) => {
    const isLast = k === last;
    const plane = label(text, isLast ? P.lastStepH : P.stepH, isLast ? ACCENT : INK);
    scene.add(plane.mesh);
    updates.push(() => {
      const lastPassZ = P.tunnelEndZ + landings(P).tunnel + TUNNEL.passGap;
      const z = isLast ? P.tunnelEndZ : lerp(TUNNEL.firstZ, lastPassZ, k / (last - 1));
      const f = isLast ? 0 : 1 - (TUNNEL.tighten * k) / (last - 1);
      const ang = k * TUNNEL.angleStep + TUNNEL.angle0;
      const r = P.tunnelSpiral * f;
      plane.mesh.position.set(P.tunnelX + r * Math.cos(ang), TUNNEL.squash * r * Math.sin(ang), z);
      plane.mesh.rotation.z = isLast ? 0 : (k % 2 ? -1 : 1) * TUNNEL.tilt;
    });
    fade(plane.mesh, [plane.material], (t, d) => tunnelOn(t) * (isLast ? 1 : windowFade(d, P.tunnelWindow, TUNNEL.windowSoft)));
  });

  // drum-ratchet (motion-3d rules/drum-ratchet.md): one GLIDE on the drum position; the ratchet supplies the per-word rhythm
  const drumGroup = new THREE.Group();
  const drum = new THREE.Group();
  scene.add(drumGroup);
  drumGroup.add(drum);
  const drumIn = (t: number) => OUT(seg(t, T.drum.arrive + CUES.drumIn, CUES.pop));
  const spinFrom = T.drum.arrive + CUES.drumSpinFrom;
  const drumS = (t: number) => lerp(CUES.drumLeadIn, WORDS.length - 1, GLIDE(seg(t, spinFrom, T.drum.leave + CUES.drumSpinTo - spinFrom)));
  const theta = (t: number, i: number) => i * P.drumStep - ratchet(P, drumS(t));
  const lead = label('then', P.drumH, INK, 800, 'right');
  drumGroup.add(lead.mesh);
  fade(lead.mesh, [lead.material], t => Math.min(1, drumIn(t) * TITLE.popFade));
  const names = WORDS.map(word => label(word, P.drumH, ACCENT, 800, 'left'));
  names.forEach((n, i) => {
    drum.add(n.mesh);
    fade(n.mesh, [n.material], t => clamp01((Math.cos(theta(t, i)) - DRUM.bandLow) / DRUM.bandSoft) * drumIn(t));
  });
  updates.push(t => {
    drumGroup.position.set(P.drumX, 0, P.drumZ);
    drumGroup.rotation.y = -P.drumTurn;
    lead.mesh.position.set(-DRUM_GAP * P.drumH, 0, P.drumRadius - P.popTravel * (1 - drumIn(t)));
    drum.position.x = DRUM_GAP * P.drumH;
    names.forEach((n, i) => {
      const th = theta(t, i);
      n.mesh.position.set(0, P.drumRadius * Math.sin(th), P.drumRadius * Math.cos(th));
      n.mesh.rotation.x = -th;
    });
  });

  // path-through-depth (motion-3d rules/path-through-depth.md): one progress value draws the line and pops the nodes
  const pathGroup = new THREE.Group();
  scene.add(pathGroup);
  const curve = new THREE.CatmullRomCurve3(PATH_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const tubeGeo = new THREE.TubeGeometry(curve, PATH.segments, P.lineRadius, PATH.sides, false);
  const tube = new THREE.Mesh(tubeGeo, basic(ACCENT));
  const ghost = new THREE.Mesh(new THREE.TubeGeometry(curve, PATH.segments, P.lineRadius * PATH.ghostRadius, 6, false), basic(GHOST));
  ghost.renderOrder = -1;
  pathGroup.add(ghost, tube);
  const pathIn = (t: number) => OUT(seg(t, T.path.arrive + CUES.pathIn, CUES.pop));
  const pathP = (t: number) => IN_OUT(seg(t, T.path.arrive + CUES.pathDraw, P.pathDrawSecs));
  fade(tube, [tube.material], pathIn, true);
  fade(ghost, [ghost.material], pathIn, true);
  const nodes = MILESTONES.map((text, i) => {
    const u = i / (MILESTONES.length - 1);
    const at = curve.getPointAt(u);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(P.nodeSize, 24, 16), basic(ACCENT));
    dot.position.copy(at);
    const tag = label(text, P.nodeLabelH, i === MILESTONES.length - 1 ? INK : MUTED, 500);
    tag.mesh.position.set(at.x, at.y - PATH.tagDrop, at.z);
    pathGroup.add(dot, tag.mesh);
    const hit = (t: number) => clamp01((pathP(t) - u) / CUES.nodeLead + 1) * pathIn(t);
    fade(dot, [dot.material], t => Math.min(1, hit(t) * 2), true);
    fade(tag.mesh, [tag.material], t => OUT(hit(t)), true);
    return {dot, hit};
  });
  updates.push(t => {
    pathGroup.position.set(P.pathX, P.pathY, P.pathZ);
    tubeGeo.setDrawRange(0, Math.floor(pathP(t) * PATH.segments) * PATH.sides * 6);
    nodes.forEach(n => n.dot.scale.setScalar(Math.max(1e-3, BOUNCE(n.hit(t)))));
  });

  // speed-driven-fx (motion-3d rules/speed-driven-fx.md): seeded dust in a hollow tube around the flight gives the blur something to streak
  const dustPos = new Float32Array(P.dustCount * 3);
  for (let i = 0; i < P.dustCount; i++) {
    const c = plan().path.at(hash01(i * 4 + 1) * T.path.leave).pos;
    const ang = hash01(i * 4 + 2) * TAU;
    const r = lerp(DUST.inner, DUST.outer, hash01(i * 4 + 3));
    dustPos.set([c[0] + r * Math.cos(ang), c[1] + DUST.squash * r * Math.sin(ang), c[2] + (hash01(i * 4 + 4) - 0.5) * DUST.spread], i * 3);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dotCanvas = document.createElement('canvas');
  dotCanvas.width = dotCanvas.height = 64;
  const dctx = dotCanvas.getContext('2d')!;
  const grad = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.45, '#ffffff');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  dctx.fillStyle = grad;
  dctx.fillRect(0, 0, 64, 64);
  const dustMat = new THREE.PointsMaterial({color: MUTED, map: new THREE.CanvasTexture(dotCanvas), transparent: true, depthWrite: false});
  scene.add(new THREE.Points(dustGeo, dustMat));

  // hosts/canvas-commons (motion-3d hosts/canvas-commons.md): one Three node; post FX go through its composer prop
  // The lens pass writes opaque pixels, so the 3D layer owns the background colour.
  const three = createRef<Three>();
  view.add(<Three ref={three} scene={scene} camera={camera} quality={P.quality} background={BG} width={W} height={H} />);
  const lens = makeLensPass(W * P.quality, H * P.quality);
  const composer = new EffectComposer(three().renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(lens);
  composer.addPass(new OutputPass());
  three().composer(composer);

  // state-apply-architecture (motion-3d rules/state-apply-architecture.md): the only writer; camera, then objects, then fades, then FX
  const wp = new THREE.Vector3();
  const fwd = new THREE.Vector3();
  const apply = (t: number) => {
    const {path, speed} = plan();
    applyCamera(camera, path.at(t));
    updates.forEach(u => u(t));

    // depth-dissolve (motion-3d rules/depth-dissolve.md): opacity = own visibility x view-depth fade; the haze handles far
    camera.getWorldDirection(fwd);
    const clear = OUT(seg(t, T.path.leave + CUES.clear, CUES.clearSecs));
    const near = {nearStart: P.dissolveNear, nearEnd: P.dissolveFar};
    for (const f of fadeables) {
      f.obj.getWorldPosition(wp);
      const d = viewDepth(wp, camera.position, fwd);
      const o = clamp01(f.vis(t, d)) * depthFade(d, near) * (f.keep ? 1 : 1 - clear);
      f.obj.visible = o > 0.003;
      for (const m of f.mats) m.opacity = o;
    }
    const lift = OUT(seg(t, T.path.leave, P.pullSecs * HAZE_OPEN.share));
    fog.near = lerp(P.hazeNear, HAZE_OPEN.near, lift);
    fog.far = lerp(P.hazeFar, HAZE_OPEN.far, lift);
    dustMat.size = P.dustSize;

    // effects-tied-to-motion (motion-craft rules/effects-tied-to-motion.md): subtle on every leg, strong only in the hero window
    const v = speed(t);
    const h = hero(P, t);
    lens.uniforms.uZoom.value = lerp(P.blurSubtle, P.blurHero, h) * v;
    lens.uniforms.uCaPx.value = P.fringeRest + lerp(P.fringeSubtle, P.fringeHero, h) * v;
    lens.uniforms.uTaps.value = v > 0.004 ? 10 : 1;
    lens.uniforms.uFrame.value = Math.round(t * LENS_FPS);
  };
  useScene().lifecycleEvents.onBeginRender.subscribe(() => apply(clock()));
  apply(clock());

  // compositing-3d-and-2d (motion-3d rules/compositing-3d-and-2d.md): a veil dims the moving world, the 2D lockup lands and keeps pushing in
  const tLock = T.path.leave + P.pullSecs * CUES.lockAt;
  const lockIn = () => OUT(seg(clock(), tLock, CUES.lockSecs));
  const type = {fontFamily: FONT, fontWeight: 800, fontSize: LOCKUP.fontSize, letterSpacing: LOCKUP.tracking * LOCKUP.fontSize, textWrap: false};
  view.add(<Rect size={[W, H]} fill={BG} opacity={() => (tick(), P.veil * OUT(seg(clock(), tLock, CUES.veilSecs)))} />);
  view.add(
    <Node
      opacity={() => clamp01(lockIn() * LOCKUP.fadeLead)}
      scale={() => (tick(), lerp(P.endScale, 1, lockIn()) * (1 + P.endCreep * Math.max(0, clock() - tLock)))}
    >
      <Layout layout direction={'row'} alignItems={'center'} gap={LOCKUP.gap * LOCKUP.fontSize}>
        <Txt text={'to'} fill={INK} {...type} />
        <Txt text={'launch.'} fill={ACCENT} {...type} />
      </Layout>
    </Node>,
  );

  yield* clock(T.end, T.end, linear);
});
