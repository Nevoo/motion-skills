# Signals

A signal is a value with dependency tracking. Write a node property as a function of other signals and it recomputes whenever they change. This one mechanism replaces most imperative state in a scene. Everything here imports from `@canvas-commons/core` (0.4.0 root exports).

## Create, read, write, tween

```ts
import {createSignal} from '@canvas-commons/core';

const radius = createSignal(3);
radius();                       // read: 3
radius(8);                      // write
yield* radius(12, 0.4, ease);   // tween over 0.4 s with any (t, from?, to?) => number timing function
yield* radius(12, 0.4, ease).to(4, 0.3, ease);  // chain on the same signal
```

The signal is a function: no argument reads, one argument writes, `(value, seconds, timing)` returns a tween you `yield*`.

Signature on 0.4.0: `createSignal(initial?, interpolation?, owner?)`. Pass an interpolation for non-numeric values that should tween in a custom way.

## Derived signals

```ts
const radius = createSignal(3);
const area = createSignal(() => Math.PI * radius() ** 2);
area();      // 28.27
radius(5);
area();      // 78.54, recomputed lazily on the next read
```

`area` tracks `radius` because it read `radius()` while computing. Reads are cached until a dependency changes.

## Node properties are signals

Every node property is a signal: `circle().fill()` reads, `circle().fill('#0B7A83')` writes, `circle().fill('#0B7A83', 0.4, ease)` tweens. Bind a property to a function once, at construction:

```tsx
const radius = createSignal(120);
view.add(<Circle size={() => radius() * 2} fill={'#0B7A83'} />);
yield* radius(40, 1, ease); // the circle follows; no circle tween in the timeline
```

## The master signal

Drive many properties from one signal you tween. One tween, every derived value moves in lockstep, and the timeline stays short.

```tsx
const state = createSignal(0);
const drive = (from: number, to: number) => () => from + (to - from) * state();

view.add(
  <Layout layout direction="column" gap={28} width={1200} height={700}>
    <Layout grow={1} gap={28}>
      <Rect grow={drive(3, 1)} fill={'#E0306E'} />
      <Rect grow={1} fill={'#111411'} />
    </Layout>
    <Layout grow={drive(1, 2)} gap={28}>
      <Rect grow={drive(2, 4)} fill={'#0A8C84'} />
      <Rect grow={1} fill={'#787E74'} />
    </Layout>
  </Layout>,
);

yield* state(1, 1.2, ease).to(0, 1.2, ease);
```

## Binding vs tween

| situation | use |
|---|---|
| A is always `f(B)`, whenever B changes | binding: `width={() => b() * 2}` |
| A changes once, at one moment of the timeline | tween: `yield* node().width(240, 0.4, ease)` |
| many properties move together | master signal, every property bound to it |
| something must track the leading edge of a draw | binding: `dot.position.y(() => y0 + line().end() * length)` |

## Defaults

```ts
import {DEFAULT} from '@canvas-commons/core';

x(DEFAULT);                   // back to the initial value
yield* node().opacity(DEFAULT, 0.3, ease);  // tween back to the JSX value
```

## Effects

```ts
import {createEffect, createDeferredEffect} from '@canvas-commons/core';

const stop = createEffect(() => console.log('radius', radius())); // runs now, then on every change
const stopLater = createDeferredEffect(() => expensiveSync(radius())); // batched: at most once per frame
```

Use effects sparingly: for syncing state outside the scene graph. Inside the graph, bindings do the job.

## Values that are not signals (the tick)

A plain object such as a live-tuning params object (`P.SIZE`) does not invalidate bindings when it changes, because nothing tracked it. Add a counter signal, read it in every binding that reads the object, and bump it after a change:

```ts
const tick = createSignal(0);
circle.size(() => (tick(), P.SIZE));
// after P.SIZE changes:
tick(tick() + 1);
```

[live-panel.md](live-panel.md) wires this to a slider panel and repaints the paused frame.

## Anti-patterns

- **Mirroring state by hand.** `a.opacity(x); b.opacity(x); c.opacity(x)` repeated through the timeline is a master signal waiting to happen.
- **Writing a signal inside a binding.** Bindings are pure reads. Side effects belong in `createEffect`.
- **Creating signals inside loops that run every frame.** Create them once, at the top of the scene generator.
- **The engine's default curve where a named one is meant.** A tween without a timing function uses the engine default, `easeInOutCubic`; pass the named curves from the `motion-craft` skill instead.
