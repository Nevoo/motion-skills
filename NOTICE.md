# Notices and credits

## HyperFrames (Apache-2.0)

Several rules adapt ideas from [HyperFrames](https://github.com/heygen-com/hyperframes) by HeyGen, licensed under the Apache License 2.0. No HyperFrames text or code is reproduced. The ideas are restated in our own words with our own code, and each file that adapts one ends with *Idea adapted from HyperFrames (Apache-2.0).*

The adapted ideas:
- treating seams as vectors;
- velocity-matched cuts;
- the "exit is the transition" principle;
- camera-flight discipline: one writer, baked landing poses, varied legs;
- the blur budget;
- seek-safe three.js: state as a pure function of time;
- probing for the GPU with a software fallback;
- motion assertions and onion-skin verification;
- the low-likelihood pitch gate.

Files carrying the credit:

- `skills/motion-craft/process/pitch-range.md`
- `skills/motion-craft/process/verify-facts.md`
- `skills/motion-craft/rules/camera-locked-to-leader.md`
- `skills/motion-craft/rules/continuous-over-cut.md`
- `skills/motion-craft/rules/effects-tied-to-motion.md`
- `skills/motion-craft/rules/exit-is-the-transition.md`
- `skills/motion-craft/rules/named-curves.md`
- `skills/motion-craft/rules/seams-and-vectors.md`
- `skills/motion-craft/rules/speed-ramps.md`
- `skills/motion-craft/rules/vary-the-move.md`
- `skills/motion-3d/SKILL.md`
- `skills/motion-3d/hosts/hyperframes.md`
- `skills/motion-3d/rendering/webgl.md`
- `skills/motion-3d/rules/camera-position-and-target.md`
- `skills/motion-3d/rules/flight-paths.md`
- `skills/motion-3d/rules/landing-poses-baked.md`
- `skills/motion-3d/rules/pure-function-of-time.md`
- `skills/motion-3d/rules/speed-driven-fx.md`
- `skills/motion-3d/rules/state-apply-architecture.md`
- `skills/motion-3d/rules/vary-the-leg.md`
- `skills/canvas-commons/references/rendering.md`
- `skills/canvas-commons/scripts/render.mjs`
- `skills/canvas-commons/scripts/smoke.mjs`

## Motion Canvas / Canvas Commons (MIT)

The three.js bridge node (`skills/motion-3d/assets/Three.ts`) began as a port of the three.js example in [Motion Canvas](https://github.com/motion-canvas/motion-canvas). [Canvas Commons](https://github.com/canvas-commons/canvas-commons) is the community fork these skills target. Both are MIT-licensed:

```
MIT License

Copyright (c) 2022 motion-canvas
Copyright (c) 2025 canvas-commons

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Range before depth

The variant-rounds process (`skills/motion-craft/process/variant-rounds.md`) applies the "range, then depth" design discipline described by Josh Puckett to motion.
