# Verify facts, not feel

**Use when:** after every render or significant edit, before showing anything to the human, and before reporting anything as done.

## What frames can and cannot verify

Frames verify facts: the layout is right, the fonts loaded, nothing is clipped, every section is present, the background stays constant, the render is complete. Frames cannot verify feel: whether a whip hits, whether a wave flows. The agent cannot judge feel from frames, so it never renders to judge feel ([live tuning](live-tuning.md) does that). It renders to verify facts.

## Before anything is shown

**Final timing only.** A test render gets judged as the piece. Nobody watches past placeholder timing, and "the timing isn't final yet" doesn't survive the first viewing. So anything shown to the human runs on final timing, and only after the ["it doesn't feel premium" review](../SKILL.md#review-it-doesnt-feel-premium) and the audits below have passed. Renders made to check a technique (does the exporter finish, does the shader compile) are for the fact checks and are not shown as the piece.

**Observed failure:** a test render with placeholder timing was shown, and the piece was judged on it.

**Timing audit.** It runs on the timeline, before any render is shown:

- **Dead spots:** gaps longer than a read pause where neither the copy nor the camera moves. Drifts and background fields don't count as motion. The audit is in [reel-pacing](../rules/reel-pacing.md).
- **Read gaps:** the time from each line's last word landing until the camera visibly moves, at most about 0.3s in a reel (the read pause in reel-pacing). A longer gap is the camera waiting on text that has already been read.

```ts
type Speed = (t: number) => number;

// Seconds from a line's last word landing until the camera moves at a visible speed.
function readGap(landsAt: number, speed: Speed, visible: number, end: number, step = 1 / 240): number {
  for (let t = landsAt; t <= end; t += step) if (speed(t) >= visible) return t - landsAt;
  return Infinity;
}

const lateMoves = (lands: number[], speed: Speed, visible: number, end: number, maxGap = 0.3) =>
  lands.map(at => ({at, gap: readGap(at, speed, visible, end)})).filter(g => g.gap > maxGap && Number.isFinite(g.gap));
```

`lands` and `end` are in output seconds. `speed(t)` is the camera's speed from its state function; for a tweened camera, a central difference of its position over ±1/240s works. `visible` is 15% of that speed's peak over the piece, the threshold `motion-3d` → `assets/timing-audit.ts` uses, so a drift never counts. The gap ends when the camera visibly moves, not when a move starts: a RAMP move stays near-still for over a third of its length, and that linger is part of the pause. The final lockup has no move after it, so its infinite gap is skipped. For a 3D piece, run `auditTiming` from that asset instead; it reports both checks from the real state.

## The checks

**1. Frame count.** The frame count equals what the engine reports it exported, and the three counts (the engine's report, the frames on disk, the frames in the MP4) must line up as below. Don't compute it as duration × fps: Canvas Commons 0.4.0 exports (to − from) + 1 frames, the last frame included. Exporters can report success and still truncate silently, which is why all three get counted.

The engine's count and the frames on disk must be equal, and an MP4 stitched from that image sequence matches them. A WebCodecs MP4 holds exported − 1 frames, because that exporter skips the final frame by design (and writes no PNGs).

```bash
ls output/my-project/*.png | wc -l                    # image exporter: output/<project>/NNNNNN.png
ffprobe -v error -count_frames -select_streams v:0 \
  -show_entries stream=nb_read_frames -of csv=p=0 output/my-project.mp4
```

**2. One contact sheet, at phase boundaries.** One tiled sheet beats N separate frames. Sample at phase boundaries, where a phase lands (the first frame, each stage settled, the final lockup, the last frame), not mid-build where everything is legitimately half there. For Canvas Commons, the render script in `canvas-commons` takes the times directly (for example `render.mjs --sheet-at 0,1.3,2.6,4.8`); its default of 12 evenly spaced frames is only a fallback. For any MP4, pick the frame numbers yourself:

```bash
# 12 frames by index (at 60fps, frame 51 = 0.85s), tiled 4×3
ffmpeg -v error -i out.mp4 \
  -vf "select='eq(n\,0)+eq(n\,51)+eq(n\,120)+eq(n\,171)+eq(n\,240)+eq(n\,291)+eq(n\,360)+eq(n\,411)+eq(n\,480)+eq(n\,531)+eq(n\,570)+eq(n\,599)',scale=480:-2,tile=4x3" \
  -fps_mode vfr -frames:v 1 sheet.jpg
```

**3. Onion skin for the shape of a move.** Stack evenly spaced samples of one move into a single image. Even spacing means constant speed (suspicious: probably linear). Ghosts clustered at the ends mean ease-in and settle. One big gap in the middle means a whip. Compare against the curve you meant: RAMP clusters at both ends with a wide gap in the middle; OUT has wide gaps first and clusters at the end. Canvas and WebGL scenes have no element boxes to inspect, so for them a stacked still like this is how a move's shape becomes visible at all.

```bash
mkdir -p onion
ffmpeg -v error -ss 2.0 -t 0.85 -i out.mp4 -vf fps=12 onion/f%03d.png
magick onion/f*.png -evaluate-sequence min onion.png   # dark subject on light; use max on dark
```

**4. Frozen check.** Holds are never frozen: every hold, the final lockup included, carries a slow drift or push-in, and the very last frame is still moving. So the expected result is zero freezes, and any freeze is a defect. A whole piece that never changes usually means a timeline that never seeks or a render loop not driven by t, which makes every other green check meaningless; a single freeze usually means a hold that lost its drift.

```bash
ffmpeg -i out.mp4 -vf "freezedetect=n=0.0001:d=2" -map 0:v -f null - 2>&1 | grep freeze_
```

Pass: no output at all. A `freeze_start` with no matching `freeze_end` means frozen through the last frame. The tolerance matters: at `n=0.001` a 12px drift over 4s on a flat background was reported as frozen; at `n=0.0001` a 6px drift over 4s passed and a truly static 3s stretch was still caught. A drift slower than about 1px per second is flagged even at `n=0.0001`, and is too faint to read as motion anyway.

**5. Motion assertions.** State what the motion must do, then check it against sampled state instead of eyeballing:

- appears by: the headline is visible (opacity at least 0.5) by 0.5s;
- before: the headline appears before the call to action;
- stays in frame: once visible, the card's box never leaves the frame;
- keeps moving: no window longer than N seconds without change.

When the state is computed from t alone, these run on the state function, with no render at all:

```ts
type Box = {x: number; y: number; w: number; h: number; opacity: number};
type Frame = {t: number; boxes: Record<string, Box>};
const W = 1920, H = 1080;

// A sampling grid for these checks, not the render's frame count.
const sample = (state: (t: number) => Record<string, Box>, duration: number, fps = 30): Frame[] =>
  Array.from({length: Math.floor(duration * fps) + 1}, (_, i) => ({t: i / fps, boxes: state(i / fps)}));
const firstSeen = (fs: Frame[], id: string) =>
  fs.find(f => (f.boxes[id]?.opacity ?? 0) >= 0.5)?.t ?? Infinity;

const appearsBy = (fs: Frame[], id: string, sec: number) => firstSeen(fs, id) <= sec;
const before = (fs: Frame[], a: string, b: string) => firstSeen(fs, a) < firstSeen(fs, b);
const staysInFrame = (fs: Frame[], id: string) => fs.every(({boxes: {[id]: b}}) =>
  !b || b.opacity < 0.5 || (b.x >= 0 && b.y >= 0 && b.x + b.w <= W && b.y + b.h <= H));
function keepsMoving(fs: Frame[], maxStatic: number): boolean {
  let still = 0;
  for (let i = 1; i < fs.length; i++) {
    const same = JSON.stringify(fs[i].boxes) === JSON.stringify(fs[i - 1].boxes);
    still = same ? still + (fs[i].t - fs[i - 1].t) : 0;
    if (still > maxStatic) return false;
  }
  return true;
}
```

**6. Smoke check after every edit.** The page loads, there are no errors, the render control exists. It is cheap and catches most breakage before a long render.

**7. Engine facts from the engine's source, not memory.** When behaviour is baffling (a pivot that doesn't pivot, a property that is ignored, a paused frame that won't repaint), read the engine's source and confirm before writing a fix. Remembered APIs are the most common source of wrong claims.

## Reporting

Claim "done" only with evidence: the timing audit's output, the frame-count line, the contact sheet's path, the freeze output, the assertion results. Report feel as "ready for the human to judge", never as verified.

Render and smoke-check scripts for Canvas Commons live in `canvas-commons` (`scripts/render.mjs`, `scripts/smoke.mjs`). HyperFrames pieces render with the official HyperFrames CLI. WebGL-specific render settings (GPU flags, pinned pixel ratio, readiness) are in `motion-3d`.

*Idea adapted from HyperFrames (Apache-2.0).*
