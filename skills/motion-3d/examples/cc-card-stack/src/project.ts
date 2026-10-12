import {makeProject} from '@canvas-commons/core';

import {capturePlayerPlugin} from './live-panel';
import {FONT_CSS} from './params';
import cardStack from './scenes/card-stack?scene';

// Declare the webfont before any scene runs; the render harness loads it before frame 0.
if (!document.querySelector(`link[href="${FONT_CSS}"]`)) {
  document.head.append(Object.assign(document.createElement('link'), {rel: 'stylesheet', href: FONT_CSS}));
}

export default makeProject({
  scenes: [cardStack],
  plugins: [capturePlayerPlugin()],
});
