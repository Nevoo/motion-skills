import {cameraPath, normalisedSpeed, sectionTimes} from './camera-path';
import type {CamKey, V3} from './camera-path';
import {distFor, distForW, smoothstep} from './depth';
import {H, MEASURED, PATH_POINTS, POSES, W} from './params';
import type {Params} from './params';

export const ASPECT = W / H;
export const DRUM_GAP = 0.18;
export const PATH_SPAN = Math.max(...PATH_POINTS.map(p => p[0])) - Math.min(...PATH_POINTS.map(p => p[0]));

// flight-paths (motion-3d rules/flight-paths.md): sections go fly → arrive → drift → next fly
export function timeline(P: Params) {
  const [tunnel, drum, path] = sectionTimes(P.introSecs, [
    {fly: P.tunnelFlySecs, drift: P.tunnelDriftSecs},
    {fly: P.drumFlySecs, drift: P.drumDriftSecs},
    {fly: P.pathFlySecs, drift: P.pathDriftSecs},
  ]);
  const pulled = path.leave + P.pullSecs;
  return {tunnel, drum, path, pulled, end: pulled + P.endSecs};
}

// The drum's reading line: the centre of "lead + word" on its front face, after the group turn.
export function drumFace(P: Params): V3 {
  const cx = ((MEASURED.drumWordMeanW - MEASURED.drumLeadW) / 2) * P.drumH;
  const [c, s] = [Math.cos(P.drumTurn), Math.sin(P.drumTurn)];
  return [P.drumX + cx * c - P.drumRadius * s, 0, P.drumZ + cx * s + P.drumRadius * c];
}

// landing-poses-baked + frame-by-fill (motion-3d rules/landing-poses-baked.md, rules/frame-by-fill.md)
export function landings(P: Params) {
  const drumSpan = (MEASURED.drumLeadW + MEASURED.drumWordMeanW + 2 * DRUM_GAP) * P.drumH;
  return {
    title: distForW(MEASURED.ideaW * P.titleH, P.titleFill, P.fov, ASPECT),
    tunnel: distFor(P.lastStepH, P.tunnelFill, P.fov),
    drum: distForW(drumSpan, P.drumFill, P.fov, ASPECT),
    path: distForW(PATH_SPAN, P.pathFill, P.fov, ASPECT),
    end: distForW(PATH_SPAN, P.endFill, P.fov, ASPECT),
  };
}

const pose = (anchor: V3, name: keyof typeof POSES, dist: number) => {
  const {pos, tgt} = POSES[name];
  return {
    pos: [anchor[0] + pos[0], anchor[1] + pos[1], anchor[2] + pos[2] + dist] as V3,
    tgt: [anchor[0] + tgt[0], anchor[1] + tgt[1], anchor[2] + tgt[2]] as V3,
  };
};

// vary-the-leg (motion-3d rules/vary-the-leg.md): truck, through + roll, arc, drop, pull
export function flightKeys(P: Params): CamKey[] {
  const T = timeline(P);
  const D = landings(P);
  const drift = P.driftUnits;
  const title: V3 = [0, 0, 0];
  const tunnel: V3 = [P.tunnelX, 0, P.tunnelEndZ];
  const drum = drumFace(P);
  const path: V3 = [P.pathX, P.pathY, P.pathZ];
  return [
    {t: 0, ...pose(title, 'open', D.title), roll: 0, fov: P.fov},
    {t: P.introSecs, ...pose(title, 'title', D.title), roll: 0, fov: P.fov},
    {t: P.introSecs + P.tunnelFlySecs / 2, roll: -P.tunnelRoll, fov: P.fov + P.tunnelLensKick},
    {t: T.tunnel.arrive, ...pose(tunnel, 'tunnel', D.tunnel), roll: 0, fov: P.fov},
    {t: T.tunnel.leave, ...pose(tunnel, 'tunnelDrift', D.tunnel - drift)},
    {t: T.drum.arrive, ...pose(drum, 'drum', D.drum), roll: P.drumRoll},
    {t: T.drum.leave, ...pose(drum, 'drumDrift', D.drum - drift)},
    {t: T.path.arrive, ...pose(path, 'path', D.path), roll: P.pathRoll},
    {t: T.path.leave, ...pose(path, 'pathDrift', D.path - drift)},
    {t: T.pulled, ...pose(path, 'pulled', D.end), roll: P.endRoll},
    {t: T.end, ...pose(path, 'end', D.end), roll: P.endRoll},
  ];
}

export function flightPlan(P: Params) {
  const path = cameraPath(flightKeys(P));
  const speed = normalisedSpeed(path, {floor: P.speedFloor, curve: P.speedCurve});
  return {path, speed};
}

// speed-driven-fx (motion-3d rules/speed-driven-fx.md): one hero window, on the punch into the tunnel
export function hero(P: Params, t: number) {
  const a = P.introSecs + P.heroFrom;
  const b = P.introSecs + P.heroTo;
  return smoothstep(a - 0.05, a + 0.05, t) * (1 - smoothstep(b - 0.05, b + 0.05, t));
}

// drum-ratchet (motion-3d rules/drum-ratchet.md): slows on every word, never stops between them
export const ratchet = (P: Params, s: number) => P.drumStep * (s - (P.drumSnap * Math.sin(2 * Math.PI * s)) / (2 * Math.PI));
