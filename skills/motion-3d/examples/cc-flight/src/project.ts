import {makeProject} from '@canvas-commons/core';

import {capturePlayerPlugin} from './live-panel';
import {FONT_CSS} from './params';
import flight from './scenes/flight?scene';

// Declared before the scene runs; labels repaint when the face lands, and the harness waits for it before frame 0.
if (typeof document !== 'undefined' && !document.querySelector(`link[href="${FONT_CSS}"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = FONT_CSS;
  document.head.appendChild(link);
}

export default makeProject({
  scenes: [flight],
  plugins: [capturePlayerPlugin()],
});
