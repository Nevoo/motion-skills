---
name: faithful-product-ui
description: In product demos, rebuild the real interface with its real colours, labels, density and layout; invented or placeholder UI makes the whole demo read as fake.
tags: [product-demo, design, taste]
---

# Faithful product UI

**Use when:** a piece demonstrates a real product: an app, a dashboard, a developer tool.

## How it works

Viewers who know the product spot an invented interface at once, and viewers who don't still sense a template. A demo reads as real when the UI is the real UI: the product's own colours, labels, icons, density and layout, rebuilt as animatable vector elements so it can morph and move.

- **Extract, don't remember.** Take colours, type, spacing and copy from the product's source (design tokens, stylesheets, component files) or from real screenshots. Memory and guesswork drift.
- **Real labels, real formats.** Use the product's own wording and data in its real format. "Lorem ipsum" and "Feature 1" kill credibility instantly.
- **Keep the density.** Simplify by cropping and camera framing, not by inventing a cleaner UI that is no longer the product.
- **Animate what the product does.** Its own transitions and states. An animation the product can't perform promises a feature that doesn't exist.
- **One world.** The product's canvas colour can be the piece's background, so the UI and the world merge (one-background).

Public or example pieces use neutral placeholder content that still has a real format: plausible names, dates, figures and labels, never filler text.

## Recipe

Keep one tokens module, extracted from the product, and import it everywhere. No colour or size literal appears in scene code.

```ts
// tokens.ts: values below are placeholders; copy the product's real ones.
export const UI = {
  canvas: '#0E0F13', surface: '#16181D', border: '#262A31',
  ink: '#ECEDEF', muted: '#8B9099', accent: '#3B82F6',
  radius: 10, rowHeight: 36,
  font: 'Inter, system-ui, sans-serif',
} as const;
```

Checklist before animating:

1. Side by side with a real screenshot, at the same crop: do colours, spacing and type match?
2. Every label is the product's real wording (or a realistic neutral placeholder in an example).
3. The fonts are the product's fonts and are loaded before the first rendered frame.
4. Nothing on screen is a feature the product doesn't have.

## Pitfalls

- **Recreating by eye from a blurry screenshot** when the source is available.
- **A simplified "concept" UI** that no longer looks like the product.
- **A separate reel palette on top of the product's palette.** Two colour systems fight; the product's wins.
- **Fallback fonts in the first frames** of a render. Wait for fonts before the first capture (verify-facts).

## See also

- [one-hero-per-frame](one-hero-per-frame.md)
- [one-background](one-background.md)
- [morph-not-crossfade](morph-not-crossfade.md): animating the product's own state changes
