---
name: one-hero-per-frame
description: Every frame and every card has one hero; hierarchy, scale and colour do the work that halos, auras and decorative glows only pretend to do.
tags: [hierarchy, design, taste, typography]
---

# One hero per frame

**Use when:** composing a frame, a card or a stat, or when a frame feels busy, generic or template-like.

## How it works

The eye goes to one place first. If two things compete, it bounces between them and takes in neither. Each frame, and each card in it, has one hero: the biggest, highest-contrast element, the reason the frame exists. Everything else supports it at a lower level.

**A stat card, top to bottom:** a small colour chip (identification only), the title (medium, ink), a meta line (small, muted), then the hero: one big number, bold, coloured, tightly tracked. Optionally a hair-thin bar underneath as quantitative confirmation that doesn't compete. The title is never bigger than the metric; if the title is the point, it isn't a stat card.

**Emphasis is relative.** To pick a winner among cards, do three things together: scale the winner up slightly, dim the others, and give the winner an accent surface. The dim is what makes the scale read; a lone scale-up looks like a glitch.

**Cut the decoration.** These read as template chrome, not design:

- soft halos behind dots, large translucent auras;
- background scan effects, sliding glows, animated gradients behind cards;
- heavy shadows that float cards off the surface (keep shadows soft and tight; the card is part of the surface);
- names truncated when they would fit.

**A quiet type and surface system:**

- one font family per piece;
- near-black ink rather than pure black, an off-white canvas rather than pure white, so cards separate from the page;
- display type tracked tight, small labels at 0;
- modest corner radii and hairline borders; very round, heavily shadowed cards read as a generic UI kit.

## Recipe

```ts
import {OUT, seg, lerp} from './curves';

// Winner emphasis: all three changes on one progress.
function emphasis(t: number, at: number, i: number, winner: number) {
  const k = OUT(seg(t, at, 0.5));
  const isWinner = i === winner;
  return {
    scale: isWinner ? lerp(1, 1.06, k) : 1,
    opacity: isWinner ? 1 : lerp(1, 0.42, k),
    accentSurface: isWinner,          // set at build time; the accent itself doesn't animate
  };
}
```

## Values

Sizes for a 1080p frame.

| role | size | weight | tracking |
|---|---|---|---|
| hero number | 88–96px | 700 | −2.4 to −2.6 |
| display title | 80–96px | ~620 | −2.2 to −2.4 |
| sublabel | ~26px | ~420 | −0.2 |
| card title | 24–28px | ~620 | −0.5 |
| caption, meta | 14–15px | ~420 | 0 |
| winner scale, others' opacity | 1.06, 0.42 | | |
| card shadow | soft and tight: low alpha, ~24px blur, ~12px offset | | |

## Pitfalls

- **Two heroes.** A big title and a big number in one card; pick one.
- **Emphasis by scale alone.** Without the dim, it looks like a layout bug.
- **Decoration standing in for hierarchy.** If a glow is needed to find the hero, the hierarchy is wrong.
- **Click reactions that spread.** During a click only the touched element responds (morph-not-crossfade).

## See also

- [no-hud-chrome](no-hud-chrome.md)
- [faithful-product-ui](faithful-product-ui.md)
- [one-background](one-background.md)
- [kinetic-headlines](kinetic-headlines.md)
