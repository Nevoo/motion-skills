---
name: kinetic-headlines
description: Reel headlines build word by word with one accent word; explainer titles travel a few pixels into place while fading in. Type never bounces and lands sharp.
tags: [typography, kinetic-type, reel, stagger]
---

# Kinetic headlines

**Use when:** putting a headline, title or tagline on screen.

## How it works

**Reel register.** A headline that slides in whole is explainer energy. Assemble it one word at a time: each word fades in while rising a short distance, staggered so the words overlap into one wave. Reading happens during the build, so the hold after the last word can be short. It costs nothing extra and carries far more energy.

**One accent word.** One word carries the accent colour, set when the word is built. It needs no extra animation; the colour is the emphasis. Two accents cancel each other out.

**Explainer register.** The title travels a short distance into place while fading in, both on OUT, then holds. A subtitle follows with a small stagger. Pick one travel direction for every title in the piece (rising is the usual default).

**Lay out first, reveal second.** Build each word as its own element at its final laid-out position, invisible. The reveal only changes opacity and a small offset, so words never shift when later words arrive.

**Type discipline for display sizes:**

- Track large bold text tight, about −2% to −3% of the font size; small labels at 0; body text never positive.
- Near-black ink rather than pure black; one font family per piece.
- Text never uses BOUNCE: letters wobble and readability dies.
- No motion blur on words while they are being read. A word may smear on its way in if the move earns it, but it arrives crisp and stays crisp.

## Recipe

```ts
import {OUT, seg} from './curves';

const WORD_IN = 0.42, RISE_DUR = 0.5, RISE_PX = 14, STAGGER = 0.1;

// Word i of a headline starting at `at`. Words sit at their laid-out positions.
const word = (t: number, i: number, at: number) => {
  const t0 = at + i * STAGGER;
  return {opacity: OUT(seg(t, t0, WORD_IN)), dy: OUT(seg(t, t0, RISE_DUR), RISE_PX, 0)};
};
const ACCENT_INDEX = 4;                       // colour set at build time, nothing animated

// Explainer title, then subtitle 0.08s later.
const title = (t: number, at: number) => ({
  opacity: OUT(seg(t, at, 0.6)),
  dy: OUT(seg(t, at, 0.7), 20, 0),
});
const subtitle = (t: number, at: number) => title(t, at + 0.08);
```

## Values

| element | value |
|---|---|
| word fade | 0.42s, OUT |
| word travel | ~14px over 0.5s, OUT |
| word stagger | 0.08–0.12s, smaller than the word duration |
| title fade, travel | 0.6s, 0.7s over ~20px, OUT |
| subtitle stagger | ~0.08s |
| read pause after the last word (reel) | 0.2–0.3s until the next move is visible; a RAMP's linger counts ([reel-pacing](reel-pacing.md)) |
| tracking at display size | about −2% to −3% of the font size |

In Canvas Commons, set `textWrap={false}` on tracked display text (`canvas-commons` → `references/txt-gotchas.md`, negative letterSpacing).

Display sizes at 1080p for reference: titles 80–96px, hero numbers 88–96px, sublabels ~26px.

## Pitfalls

- **Stagger longer than the word duration.** Words tick in one by one.
- **Accent on several words.** No emphasis survives.
- **The accent shares a reserved colour** (for example the pointer's). The pointer stops reading as the pointer.
- **Words laid out as they arrive.** The line re-centres with each word and jitters.
- **Long holds after whole-line slide-ins.** Build word by word instead and keep the hold short.

## See also

- [stagger-waves](stagger-waves.md)
- [kinetic-glyph-stretch](kinetic-glyph-stretch.md): deforming the glyphs themselves
- [one-hero-per-frame](one-hero-per-frame.md): type hierarchy
- [effects-tied-to-motion](effects-tied-to-motion.md): when blur is allowed on type
