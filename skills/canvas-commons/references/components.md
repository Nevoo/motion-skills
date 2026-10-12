# Drop-in components and palettes

Copy from [`assets/`](../assets/) into the project's `src/` and import them. All compile against the 0.4.0 typings. Why and when to use a motif (one signature motif as the spine of a piece, a reserved hue for the pointer) is in the `motion-craft` skill; this file covers wiring.

## DotBurst: ring, contract, starburst

[`assets/DotBurst.tsx`](../assets/DotBurst.tsx) is a `Node` subclass with one public `progress` signal (0 to 1). A ring of dots rides to the centre (0 to 0.4), fades (0.4 to 0.6), and fine rays grow outward (0.45 to 1). It reads as "thinking" or "processing".

```tsx
import {DotBurst} from './DotBurst';

const burst = createRef<DotBurst>();
const count = createRef<Txt>();
view.add(<DotBurst ref={burst} rays={56} color={'#E0306E'} ringRadius={90} rayLength={260} />);
view.add(<Txt ref={count} fontSize={56} fontWeight={700} fill={'#E0306E'} />);

// One moment, not two: the number is driven by the same progress, so they peak together.
count().text(() => `${Math.round(burst().progress() * 380)}`);
yield* burst().progress(1, 1.4, ease);
```

Props: `progress`, `rays`, `ringRadius`, `rayLength`, `dotRadius`, `color`, `lineWidth`, all signals, so any of them can be bound or tweened. It overrides `getCacheBBox()`, so `cache`, filters and shadows on it do not clip the drawing. Children draw on top (put a counter inside it to centre it).

## Cursor: a pointer as a recurring character

[`assets/Cursor.tsx`](../assets/Cursor.tsx) exports a `Cursor` function component (a `Path` with its tip at `(0, 0)`, so `position` is the tip) and two generators.

```tsx
import {Cursor, moveCursor, clickCursor} from './Cursor';

const cursor = createRef<Path>();
view.add(<Cursor ref={cursor} position={[-200, 120]} />);   // add after the camera to stay in screen space
yield* moveCursor(cursor, [120, -40], OUT);                 // pass an arriving curve
yield* all(clickCursor(cursor, OUT), button().scale(0.94, 0.07, OUT).to(1, 0.16, OUT));
yield* morphButtonIntoPanel();                              // the click's result starts at once
```

`moveCursor(cursor, to, ease?, seconds = 0.5)` and `clickCursor(cursor, ease?, press = 0.07, release = 0.16)`. The default `easeOutCubic` only keeps the file standalone; pass the named curves from the `motion-craft` skill. Only the pointer and the thing it touches react to a click; the rest of the frame stays still.

## Palettes

| file | register | background |
|---|---|---|
| [`assets/palette.ts`](../assets/palette.ts) | calm explainer | `BG` `#F1F3F2`, pale grey-green |
| [`assets/palette-reel.ts`](../assets/palette-reel.ts) | kinetic reel | `REEL_BG` `#ECEFE6`, pale sage stone; magenta, teal and sunflower accents |

```tsx
import {REEL_BG, REEL_FONT, REEL_INK} from './palette-reel';

view.fontFamily(REEL_FONT);
view.add(<Rect width={1920} height={1080} fill={REEL_BG} />); // first child, outside any camera
```

| role | calm (`palette.ts`) | kinetic (`palette-reel.ts`) |
|---|---|---|
| background, outside the camera | `BG` `#F1F3F2` | `REEL_BG` `#ECEFE6` |
| cards and input surfaces | `SURFACE` `#FBFCFB` | `REEL_SURFACE` `#FDFDFA` |
| primary text, dark pills (softer than pure black) | `INK` `#1A2320` | `REEL_INK` `#111411` |
| secondary text, captions | `MUTED` `#6B7672` | `REEL_MUTED` `#787E74` |
| the one primary accent | `ACCENT` `#0B7A83` | `REEL_ACCENT` `#E0306E` |
| alternate accent word | | `REEL_ACCENT_ALT` `#0A8C84` |
| pills | | `REEL_PILL` `#F2B705` |
| 1px borders, dividers | `HAIRLINE` `#D3DAD7` | |
| muted fills (progress tracks) | `SOFT` `#E6EBE9` | |
| highlighted surface / border | `ACCENT_SOFT` `#E0F1F2` / `ACCENT_LINE` `#A6D6DA` | |
| semantic positive / warning | `POSITIVE` `#2F9A5A` / `WARNING` `#D4861A` | |
| the pointer, and nothing else | | `REEL_CURSOR` `#1798D4` (same as `CURSOR_COLOR`) |

One palette and one background per piece: switching background mid-piece reads as a different video. Each constant has one role (table above); add a colour only when a new role appears. `REEL_CURSOR` is reserved for the pointer. The font constants are system stacks; to use a webfont, load it before frame 0 ([setup.md](setup.md), "Fonts").

## Building more components

Follow [custom-components.md](custom-components.md): one or a few public signals in, every internal property derived from them, `getCacheBBox()` when you paint in `draw()`, and root imports only.
