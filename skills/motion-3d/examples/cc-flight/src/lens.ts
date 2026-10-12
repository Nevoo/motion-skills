import {Vector2} from 'three';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';

// speed-driven-fx (motion-3d rules/speed-driven-fx.md): radial zoom blur + chromatic split; every uniform is set from t
export function makeLensPass(width: number, height: number): ShaderPass {
  return new ShaderPass({
    uniforms: {
      tDiffuse: {value: null},
      uRes: {value: new Vector2(width, height)},
      uZoom: {value: 0},
      uCaPx: {value: 0},
      uFrame: {value: 0},
      uTaps: {value: 1},
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uZoom, uCaPx, uFrame; uniform int uTaps;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec2 d = vUv - 0.5;
        float r = length(d * uRes) / length(0.5 * uRes);
        float fall = smoothstep(0.1, 0.75, r);
        vec2 ca = normalize(d * uRes + 1e-6) * uCaPx * r * r / uRes;
        float jit = hash(gl_FragCoord.xy + uFrame);
        vec3 col = vec3(0.0); float wsum = 0.0;
        for (int i = 0; i < 16; i++) {
          if (i >= uTaps) break;
          float f = (float(i) + jit) / float(uTaps);
          float k = 1.0 - uZoom * fall * f; float w = 1.0 - 0.5 * f;
          vec2 q = 0.5 + d * k;
          col += vec3(texture2D(tDiffuse, q + ca * k).r, texture2D(tDiffuse, q).g, texture2D(tDiffuse, q - ca * k).b) * w;
          wsum += w;
        }
        gl_FragColor = vec4(col / wsum, 1.0);
      }`,
  });
}
