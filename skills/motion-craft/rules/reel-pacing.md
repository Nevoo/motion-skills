---
name: reel-pacing
description: Concrete timing for the two registers (calm explainer and kinetic reel) covering tween lengths, holds, overlaps, whip durations and density, plus a dead-spot audit.
tags: [pacing, timing, reel, explainer]
---

# Reel pacing

**Use when:** setting durations, or when a draft feels slow, flat or "not premium".

## How it works

Two registers share one discipline (named curves, continuity, morphs) and differ in energy. Pick one per piece; mixing them reads as two different videos.

| | calm explainer | kinetic reel or product demo |
|---|---|---|
| density | one idea per camera move | constant motion, a new beat every ~0.5s |
| element tweens | 0.45–0.7s | 0.3–0.5s |
| read pauses between moments | ~0.4s | 0.2–0.3s |
| camera | IN_OUT glides, 0.9–1.3s; linked glides up to ~3.5s | RAMP whips, 0.7–0.9s |
| type | titles travel in and hold | headlines build word by word |
| transitions | morphs and glides | morphs almost exclusively; whips between stages |
| spine | the content | one signature motif |

**Observed failure:** first drafts of product reels read as too slow and not premium. A correct but slow piece with fade-cut scenes feels amateur; energy and continuity are what read as premium. Slowing everything down to look "premium" does the opposite: premium comes from the curves and the continuity, not from slowness.

Reel rules:

- **Every hand-off overlaps.** The next element starts before the last one settles.
- **No long holds.** Reading happens during builds (word by word); the read pause after the last word is 0.2–0.3s, measured to the moment the camera *visibly* moves. A RAMP leg lingers near-still for over a third of its length before it travels, and that linger counts toward the pause: before a RAMP camera leg the hold is 0–0.1s, and a long leg leaves before the last word lands.
- **The pause test passes everywhere** (continuous-over-cut): on any frame, the copy being read or the camera is visibly moving. Background dots and a slow drift don't count.
- **Vary the lengths.** A long build next to a short whip makes both read; uniform durations are a metronome (vary-the-move).
- **The final lockup holds** long enough to read, about 1–1.5s, with a slow drift or creep that is still moving on the very last frame, so it never reads as a freeze. It is the one long hold.

## Recipe: a dead-spot audit

List every tween as a time span and look for gaps where nothing moves. Leave drifts and background fields out of the list: they don't count as motion.

```ts
type Span = {start: number; end: number};

// Gaps longer than maxRest where no tween is running. The final hold is excluded.
function deadSpots(tweens: Span[], maxRest = 0.3): Span[] {
  const sorted = [...tweens].sort((a, b) => a.start - b.start);
  const gaps: Span[] = [];
  let cursor = sorted.length ? sorted[0].start : 0;
  for (const tw of sorted) {
    if (tw.start - cursor > maxRest) gaps.push({start: cursor, end: tw.start});
    cursor = Math.max(cursor, tw.end);
  }
  return gaps;
}
```

Run it with `maxRest` 0.3 for a reel and 0.5 for an explainer. Every gap it reports is either a deliberate read pause or a dead spot to fill with an overlap.

The read pause has a second check: the time from each last word landing until the camera visibly moves (15% of its peak speed, so a RAMP's linger counts) stays under about 0.3s in a reel. Both checks run before any render is shown ([verify-facts](../process/verify-facts.md)); for a 3D piece, `motion-3d` → `assets/timing-audit.ts` runs them on the real state.

## Values

| moment | reel | explainer |
|---|---|---|
| element fade or slide | 0.3–0.5s, OUT | 0.45–0.7s, OUT |
| stage-to-stage camera | RAMP whip, 0.7–0.9s (0.85s tuned) | ~1.05s IN_OUT glide |
| word-by-word stagger | 0.08–0.12s | n/a |
| click press, release | 0.07s, 0.16–0.18s | same |
| hold between moments | 0.2–0.3s until the next move is visible; 0–0.1s before a RAMP leg, whose linger counts | ~0.4s |
| final lockup hold | ~1–1.5s | ~1.5s |

## Pitfalls

- **Stagger longer than the item duration.** Items tick in one by one (stagger-waves).
- **Holding for reading after a whole-line slide-in.** Build the line word by word instead.
- **A fixed grid when there is narration.** Name each moment and align the names to the voice-over; a re-recorded take then moves names, not code (one-moment-one-block).
- **Explainer timing in a reel.** 0.7s fades and 0.4s holds make a reel feel sleepy.

## See also

- [continuous-over-cut](continuous-over-cut.md)
- [one-moment-one-block](one-moment-one-block.md)
- [kinetic-headlines](kinetic-headlines.md)
- [column-whip](column-whip.md)
