# Layout: flexbox instead of hand-placed coordinates

0.4.0 lays out nodes with yoga (CSS flexbox semantics). Use it for anything repeated or anything whose content length can change: card internals, rows, lists, labels. Place scene-level stages and free-floating elements by hand.

## Opting in

```tsx
// any Layout-derived node (Rect, Layout, Txt, ...) with the `layout` prop becomes a flex container
<Rect layout direction="row" gap={12} padding={20} fill={'#FBFCFB'}>
  <Circle size={10} fill={'#E0306E'} />
  <Txt text="Hello" />
</Rect>

// <Layout> has no paint of its own
<Layout layout direction="column" gap={28} padding={40}>...</Layout>
```

The container's own position stays under your control; flex arranges its children.

## Three switches on 0.4.0

| prop | meaning | resolves from |
|---|---|---|
| `layout` | sets both of the below | |
| `layoutSelf` | does this node take part in its parent's flex flow? | `layoutSelf`, then `layout`, then the parent's `layoutChildren` |
| `layoutChildren` | does this node lay out its own children? | `layoutChildren`, then `layout`, then the parent's `layoutChildren` |

Children inherit, so one `layout` on the root makes the whole subtree flex. `Txt` never lays out children of its own (nested `Txt` folds into the parent's text run).

## Props (CSS names)

`direction`, `gap` / `rowGap` / `columnGap`, `padding` (+ `paddingTop`...), `margin` (+ sides), `alignItems`, `alignSelf`, `alignContent`, `justifyContent`, `wrap`, `grow`, `shrink`, `basis`, `width` / `height` / `size`, `minWidth` / `maxWidth` / `minHeight` / `maxHeight`, `ratio`.

Sizes take pixels, percentages of the parent (`'50%'`), or `null` for automatic.

## Taking a child out of the flow

```tsx
<Layout layout direction="column" gap={20}>
  <Rect />                               {/* in the flow */}
  <Circle layout={false} x={400} y={-40} /> {/* free: placed by its own x/y */}
</Layout>
```

`layout={false}` makes the child its own layout root, and its `x`/`y` read its own signals. 0.1.0 already respects `x`/`y` on a `layout={false}` node; the older guidance claiming it was ignored was wrong. 0.4.0 behaves the same: measured, a `layout={false}` child at (300, 150) inside a row rendered exactly there. For a glyph you scale and move, wrapping it in a plain `Node` is still the most predictable choice; see [txt-gotchas.md](txt-gotchas.md).

## Nudging without leaving the flow: `translate`

New in 0.4.0: `translate` shifts how a node renders, like CSS `transform: translate()`, without changing its slot. Use it for a hover, a lift, or a settle, while siblings keep their places.

```tsx
<Rect ref={card} translate={[0, 14]} opacity={0} />
yield* all(card().translate([0, 0], 0.5, ease), card().opacity(1, 0.4, ease));
```

## Animating layout

**Drive sizes from a master signal.** Bind `grow`, `width` or `basis` to functions of one signal and tween that ([signals.md](signals.md)). The solver reflows every frame and nothing fights the tween.

**Built-in reflow tweens (0.4.0):**

```ts
yield* row().add(<Rect size={40} />, 0.4, ease);   // the new child scales into its slot; siblings glide
yield* chip().remove(0.3, ease);                   // the slot collapses
yield* chip().transitionTo(otherRow(), 0.5, ease); // move into another parent, both rows reflow
row().freezeLayout();                              // pin children at their current spots, flex off
// ...move children by hand...
yield* row().thawLayout(0.5, ease);                // flex back on, children glide to their slots
```

`morphTo(other, seconds)` is a cross-fade with a position tween: two nodes briefly overlap while one fades out. When the brief says "morph", tween the shared properties of one node instead (size, radius, fill, text), as the `motion-craft` skill describes.

## When not to use layout

- Scene-level stages that a camera travels between. Give them fixed world positions.
- A node whose `x`/`y` you tween directly while it is in the flow. The solver owns its position; use `translate`, or take it out with `layout={false}`.
- Decorative overlays floating above structured content. Use `layout={false}`.

## Pitfalls

- **Tweening `width`/`height` of a flex child directly** competes with the solver. Bind it to a signal, or tween the container's inputs.
- **The container's `size` is its own box,** not the bounding box of its children. Leave it `null` to hug the content.
- **Percent sizes need a sized parent.** A `'100%'` child of an auto-sized parent resolves against nothing useful.
- **Strokes are centred on the path.** A `Circle` with `lineWidth={8}` reaches 4 px beyond its `size` on every side; include that in spacing maths.
