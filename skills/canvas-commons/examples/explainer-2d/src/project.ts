import {makeProject} from '@canvas-commons/core';
import {capturePlayerPlugin} from './live-panel';
import explainer from './scenes/explainer?scene';

export default makeProject({
  scenes: [explainer],
  plugins: [capturePlayerPlugin()],
});
