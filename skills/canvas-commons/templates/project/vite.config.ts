import {createRequire} from 'node:module';
import {dirname} from 'node:path';
import {defineConfig, searchForWorkspaceRoot} from 'vite';
import canvasCommons from '@canvas-commons/vite-plugin';
import webcodecs from '@canvas-commons/webcodecs';

// The editor is served from node_modules, which may sit above the project in a shared install.
const modules = dirname(dirname(dirname(createRequire(import.meta.url).resolve('@canvas-commons/editor/package.json'))));

export default defineConfig({
  plugins: [canvasCommons(), webcodecs()],
  // Vite's startup scan misses the editor page's imports and anything behind '?scene'; found late, each forces a re-bundle (504 Outdated Optimize Dep).
  optimizeDeps: {include: ['@canvas-commons/editor', '@canvas-commons/webcodecs/client']},
  server: {fs: {allow: [searchForWorkspaceRoot(process.cwd()), modules]}},
});
