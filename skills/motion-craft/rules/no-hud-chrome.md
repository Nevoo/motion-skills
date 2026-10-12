---
name: no-hud-chrome
description: Kinetic edits carry no corner labels, step counters, progress rules or meta lines; nobody reads them mid-motion, so detail lives inside the hero motion instead.
tags: [taste, reel, design]
---

# No HUD chrome

**Use when:** tempted to add "rhythm" or "polish" around the content of a kinetic piece: corner labels, scene numbers, step counters, progress rules, timecodes, meta lines, frame marks.

## How it works

During a kinetic edit nobody reads the corners. The eye is locked on the hero motion, and anything around it competes for the one glance the viewer has. HUD chrome makes a piece look like a template of a tech video rather than a designed one.

**Observed failure:** corner labels, step counters and progress rules added "for rhythm" were judged useless, because nobody looks at them while a kinetic edit is running.

Put the detail into the hero motion instead:

- speed streaks and zoom blur that only exist during a whip;
- a lens effect (chromatic fringing, a slight barrel) tied to camera speed;
- depth: parallax layers, softer far planes;
- a signature motif that carries meaning.

**Content is not chrome.** A progress bar inside the product UI being demonstrated is content. A step counter laid over the video is chrome. The test: would the element exist in the real product or the real scene? If not, cut it.

In a calm explainer a persistent element is acceptable only when it carries information the viewer will actually read at that pace, such as a section name in a long tutorial. Never as decoration.

## Recipe

Audit for chrome mechanically: anything fixed to the screen (outside the camera), other than the background, that stays visible for most of the piece.

```ts
type Seen = {id: string; screenFixed: boolean; visibleSeconds: number; isBackground: boolean};

const chromeSuspects = (els: Seen[], duration: number) =>
  els.filter(e => e.screenFixed && !e.isBackground && e.visibleSeconds > 0.5 * duration);
```

Every suspect needs a reason to exist that a viewer would agree with. Most don't have one.

## Values

| element | kinetic reel | calm explainer |
|---|---|---|
| corner labels, step counters, timecodes | none | none |
| progress rules over the video | none | none |
| a section name | none | only if it is read at that pace |
| effects that replace chrome | speed-driven, during whips | depth soften at most |

## Pitfalls

- **Chrome to fill an "empty" frame.** Fill it with story, or tighten the pacing.
- **A watermark or label on every stage.** Put the brand in the final lockup.
- **"01 / 04" counters.** They announce a slideshow, which is the thing to avoid.
- **Swapping chrome for constant effects.** An always-on glitch or grain layer is chrome too; effects must be driven by motion.

## See also

- [effects-tied-to-motion](effects-tied-to-motion.md)
- [one-hero-per-frame](one-hero-per-frame.md)
- [signature-motif](signature-motif.md)
