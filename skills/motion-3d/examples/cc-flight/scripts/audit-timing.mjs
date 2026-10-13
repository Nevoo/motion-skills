#!/usr/bin/env node
import {createRequire} from 'node:module';
import {join} from 'node:path';

const ROOT = process.cwd();
const {createServer} = await import(createRequire(join(ROOT, 'package.json')).resolve('vite'));
// Own cache dir: sharing node_modules/.vite with the editor's server would force it to re-optimise on its next start.
const server = await createServer({
  root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', server: {middlewareMode: true},
  cacheDir: 'node_modules/.vite-audit-timing', optimizeDeps: {noDiscovery: true, include: []},
});
try {
  const {CUES, DEFAULTS} = await server.ssrLoadModule('/src/params.ts');
  const {flightPlan, timeline} = await server.ssrLoadModule('/src/flight.ts');
  const {GLIDE, IN_OUT, OUT, timeAt} = await server.ssrLoadModule('/src/curves.ts');
  const {auditTiming, formatTimingAudit} = await server.ssrLoadModule('/src/timing-audit.ts');
  const P = DEFAULTS;
  const T = timeline(P);
  const {path} = flightPlan(P);

  // A beat has landed once its ease covers this share of its travel; an ease-out tail barely moves.
  const LANDED = 0.95;
  const beat = (name, from, dur, ease, share = LANDED) => ({name, from, to: from + dur * timeAt(ease, share)});

  // Cues as src/scenes/flight.tsx schedules them.
  const titleEnds = CUES.titleAt.map(at => beat('', at, CUES.pop, OUT).to);
  const title = {name: 'title pops in', from: CUES.titleAt[0], to: Math.max(...titleEnds)};
  const numbers = beat('numbers fade on', P.introSecs + CUES.tunnelOn, CUES.pop, OUT);
  const drumPop = beat('word drum pops in', T.drum.arrive + CUES.drumIn, CUES.pop, OUT);
  const spinFrom = T.drum.arrive + CUES.drumSpinFrom;
  const drumTurn = beat('word drum turns', spinFrom, T.drum.leave + CUES.drumSpinTo - spinFrom, GLIDE);
  const pathFade = beat('path fades in', T.path.arrive + CUES.pathIn, CUES.pop, OUT);
  // The last milestone pops over the final nodeLead of the draw.
  const pathDraw = beat('path draws, milestones pop', T.path.arrive + CUES.pathDraw, P.pathDrawSecs, IN_OUT, 1 - CUES.nodeLead * (1 - LANDED));
  const lockup = beat('end title lands', T.path.leave + P.pullSecs * CUES.lockAt, CUES.lockSecs, OUT);

  const audit = auditTiming({
    end: T.end,
    camera: path,
    copy: [title, numbers, drumPop, drumTurn, pathFade, pathDraw, lockup],
    reads: [
      {name: 'title', lastWordAt: title.to},
      {name: '05 (lands with the camera)', lastWordAt: T.tunnel.arrive},
      {name: 'word drum', lastWordAt: drumTurn.to},
      {name: 'path milestones', lastWordAt: pathDraw.to},
      {name: 'end title', lastWordAt: lockup.to},
    ],
    exempt: [{from: lockup.to, to: T.end, why: 'final lockup hold'}],
  });
  console.log(formatTimingAudit(audit));
  process.exitCode = audit.ok ? 0 : 1;
} finally {
  await server.close();
}
