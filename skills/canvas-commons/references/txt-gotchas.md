# Txt and glyph transform gotchas (0.4.0)

Scaling, stretching and moving real font glyphs has engine-specific traps. Use real `Txt` glyphs rather than `Circle`/`Rect` stand-ins: viewers notice a fake "o" next to the font's "o". The kinetic-type principles (stretch shapes, comet trails, reveal waves) live in the `motion-craft` skill; this file is the engine mechanics.

## 1. The pivot signal is `anchor`; there is no `offset`

```ts
node.anchor([0, 1]);    // origin at the bottom edge: scale and rotate pivot there
node.anchor([-1, 0]);   // left edge: a width tween grows to the right
```

`anchor` is normalised to half the node's size: `[-1, -1]` is top-left, `[1, 1]` bottom-right. Calling `node.offset(...)` is a type error on 0.4.0. `moveOffset(v)` sets `anchor` and moves `position` so the node does not jump; call it while scale is 1.

## 2. A `Txt` scales about its line-box centre, not the ink of its glyphs

A `Txt`'s origin is the centre of its box, and the box is the line box: font ascent plus descent plus leading. The visible ink of a lowercase glyph sits below that centre, so scaling the `Txt` makes the glyph grow downward and off-centre.

How 0.4.0 places the baseline (source: `text/lineMetrics.ts`, `text/preparedParagraph.ts`): the font box is measured on `'Mg'` with `fontBoundingBoxAscent` (A) and `fontBoundingBoxDescent` (D); half the spare leading goes above. For a single auto-sized line, the baseline sits `(A - D) / 2` below the box centre at any line height.

Ink centre of one glyph, in the `Txt`'s local space (+y down):

```ts
import {Txt} from '@canvas-commons/2d';

export function glyphInkCentreY(txt: Txt, glyph = 'o'): number {
  const ctx = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
  ctx.font = txt.canvasFont(); // the exact font string the engine draws with
  const box = ctx.measureText('Mg');
  const ink = ctx.measureText(glyph);
  const baseline = (box.fontBoundingBoxAscent - box.fontBoundingBoxDescent) / 2;
  return baseline - (ink.actualBoundingBoxAscent - ink.actualBoundingBoxDescent) / 2;
}
```

The older recipe that rebuilt a DOM line box is obsolete on 0.4.0, which no longer measures text with the DOM. Measure after `document.fonts.ready`: fallback-face metrics differ from the real face. Measured on 0.4.0 with an 800-weight Arial "o" at 300 px, the formula predicted 26.2 px and the rendered ink centre sat at 26 px below the box centre. Scaled 3x about the box centre, the ink centre moved to 78.5 px (predicted 78.65): the glyph grows downward.

## 3. Scale about the ink centre: transform a wrapper `Node`

A plain `Node` transforms as translate, then rotate, then scale about its own origin (`Node.localToParent`). Put the glyph inside one and transform the wrapper; the `Txt` only carries font, size and fill.

```tsx
const pivot = createRef<Node>();
const glyph = createRef<Txt>();
const stretch = createSignal(1);
view.add(
  <Node ref={pivot} scale={() => [1, stretch()]}>
    <Txt ref={glyph} text="o" fontSize={220} fontWeight={800} fill={INK} />
  </Node>,
);
const gc = glyphInkCentreY(glyph());
pivot().y(() => BASE_Y - gc * stretch()); // the ink centre stays at BASE_Y for every stretch
yield* stretch(8, 0.6, ease);
```

After scaling, the ink centre sits `gc * stretch` below the wrapper's origin; subtracting it pins the centre, so the stretch is symmetric by construction. On a free `Txt` (not a flex child), `glyph().moveOffset(new Vector2(0, gc / (glyph().height() / 2)))` gets the same pivot without a wrapper. Measured on 0.4.0, the ink centre stayed at 26 px through a 3x scale with `moveOffset`, and the wrapper pinned at `BASE_Y - gc * 3` landed the stretched glyph's ink centre exactly on `BASE_Y`.

### The amplification trap

A measurement error `e` in `gc` shows up as `e * stretch` of drift. Observed failure: a pivot about 12 px off became about 130 px of drift at a stretch of 11, on the biggest glyph only. Do not move the whole line to compensate (that drags the static text too). Add a correction that is zero at rest and full at full stretch, and expose it as a slider ([live-panel.md](live-panel.md)):

```ts
pivot().y(() => BASE_Y - gc * s() + (P.STRETCH_FIX * (s() - 1)) / Math.max(0.001, P.MAX_STRETCH - 1));
```

## 4. Flex children ignore hand-set positions; `layout={false}` children do not

Inside a flex container the solver owns a child's position. 0.1.0 already respects `x`/`y` on a `layout={false}` node; the older guidance claiming it was ignored was wrong. `layout={false}` makes the child its own layout root and `x`/`y` read its own signals, in 0.1.0 and 0.4.0 alike (measured on 0.4.0). To shift a glyph while it keeps its slot in a row, use the new `translate` signal. The wrapper `Node` from section 3 remains the most predictable option for anything you scale.

## 5. Strokes are centred on the path

A `Circle` of `size` 100 with `lineWidth` 8 covers 108 px. Two rings whose sizes do not touch can still collide; include stroke width in spacing and overlap maths.

## 6. Negative `letterSpacing` wraps auto-width text (0.4.0)

Measured on 0.4.0: a `Txt` with the default `textWrap` and no fixed width breaks onto two lines at a space as soon as its `letterSpacing` is negative. It happens whether the value is set in JSX or tweened, inside a flex container or free. In a flex column with other children, the second line can even vanish, so "Hello, motion" renders as "Hello,". Positive spacing and `fontSize` tweens stay on one line.

Tight tracking on large display type is common, so single-line titles should switch wrapping off:

```tsx
<Txt text="Hello, motion" textWrap={false} letterSpacing={-3} fontSize={96} fontWeight={800} />
```

Check a still or the contact sheet whenever a title tightens: a missing word is a fact the frames show.

## Per-glyph animation without hand-built cells (new in 0.4.0)

```ts
const pieces = label().split('grapheme'); // or 'word' / 'sentence'
view.add(
  <Node position={label().position()} rotation={label().rotation()} scale={label().scale()}>
    {pieces}
  </Node>,
);
label().opacity(0);
const rest = pieces.map(p => p.y());
pieces.forEach((p, i) => p.opacity(0).y(rest[i] + 14));
yield* sequence(0.06, ...pieces.map((p, i) => all(p.opacity(1, 0.3, ease), p.y(rest[i], 0.4, ease))));
```

`split()` returns one standalone, centre-anchored `Txt` per unit, positioned to reproduce the source render. Caveats from the source: splitting by grapheme breaks ligatures; `filters`, `shadow*` and `cache` on the source are not copied; each piece still scales about its own line-box centre (sections 2 and 3 apply per piece).

Read-only layout queries: `textGlyphs()`, `textWords()`, `textSentences()` return `{text, x, y, width, height}` centres in the `Txt`'s local space (the `y` is the line-box centre, not the ink centre); `textLines()`, `lineCount()`, `fitFontSize(maxWidth, maxHeight)`, `canvasFont()`.

## Line-level optical centring

The same offset applies to a whole line: a flex-centred word sits low because flexbox centres its box. Shift the line up by its ink offset to centre the text optically in the frame. To line up an animated glyph with a static word, pin it at that word's ink centre plus a nudge, so a nudge of 0 means aligned.
