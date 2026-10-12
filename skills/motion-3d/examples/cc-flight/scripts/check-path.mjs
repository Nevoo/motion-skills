#!/usr/bin/env node
import {createRequire} from 'node:module';
import {join} from 'node:path';

const ROOT = process.cwd();
const {createServer} = await import(createRequire(join(ROOT, 'package.json')).resolve('vite'));
// Own cache dir: sharing node_modules/.vite with the editor's server would force it to re-optimise on its next start.
const server = await createServer({
  root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', server: {middlewareMode: true},
  cacheDir: 'node_modules/.vite-check-path', optimizeDeps: {noDiscovery: true, include: []},
});
try {
  const {DEFAULTS} = await server.ssrLoadModule('/src/params.ts');
  const {flightPlan, timeline} = await server.ssrLoadModule('/src/flight.ts');
  const {findStops} = await server.ssrLoadModule('/src/camera-path.ts');
  const {path} = flightPlan(DEFAULTS);
  const T = timeline(DEFAULTS);
  const minSpeed = 0.05;
  const stops = findStops(path, {minSpeed, from: 0, to: T.end});

  const reversals = [];
  const step = 1 / 240;
  let prev = path.velocity(0);
  for (let t = step; t <= T.end; t += step) {
    const v = path.velocity(t);
    ['x', 'y', 'z'].forEach((axis, i) => {
      if (Math.sign(v[i]) !== Math.sign(prev[i]) && Math.abs(v[i] - prev[i]) > 0) reversals.push(`${axis}@${t.toFixed(2)}s`);
    });
    prev = v;
  }
  const legs = [
    ['opening truck', 0, DEFAULTS.introSecs],
    ['through tunnel', DEFAULTS.introSecs, T.tunnel.arrive],
    ['drift past 05', T.tunnel.arrive, T.tunnel.leave],
    ['arc to drum', T.tunnel.leave, T.drum.arrive],
    ['drift at drum', T.drum.arrive, T.drum.leave],
    ['drop to path', T.drum.leave, T.path.arrive],
    ['drift at path', T.path.arrive, T.path.leave],
    ['pull back', T.path.leave, T.pulled],
    ['end drift', T.pulled, T.end],
  ].map(([name, a, b]) => {
    let peak = 0;
    let low = Infinity;
    for (let t = a; t <= b; t += step) {
      peak = Math.max(peak, path.speed(t));
      low = Math.min(low, path.speed(t));
    }
    return `${name.padEnd(15)} ${a.toFixed(2)}-${b.toFixed(2)}s  peak ${peak.toFixed(2)}  slowest ${low.toFixed(2)} units/s`;
  });
  console.log(legs.join('\n'));
  console.log(`speed at the last frame: ${path.speed(T.end).toFixed(3)} units/s`);
  console.log(`axis reversals (x/y/z velocity sign changes): ${reversals.join(', ') || 'none'}`);
  console.log(`findStops(path, {minSpeed: ${minSpeed}}) -> ${JSON.stringify(stops)}`);
  process.exitCode = stops.length ? 1 : 0;
} finally {
  await server.close();
}
