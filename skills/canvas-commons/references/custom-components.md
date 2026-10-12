# Custom components

When the same JSX block appears a second or third time, make it a component. Scenes shrink, and a change happens in one place. Two kinds exist.

## Function components (start here)

A plain function returning JSX, with refs bundled by `makeRefs`. Good for compositions of existing nodes reused within a project. Define it inside the scene generator to close over a theme colour or a master signal.

```tsx
import {Layout, Rect, Txt} from '@canvas-commons/2d';
import {makeRef, makeRefs} from '@canvas-commons/core';

function Stat({refs, label, value = 0}: {refs: {box: Layout; bar: Rect; num: Txt}; label: string; value?: number}) {
  const node = (
    <Layout ref={makeRef(refs, 'box')} layout direction="column" gap={8} opacity={0}>
      <Txt text={label} fontSize={24} fill={'#6B7672'} />
      <Txt ref={makeRef(refs, 'num')} fontSize={92} fontWeight={700} fill={'#0B7A83'} />
      <Rect ref={makeRef(refs, 'bar')} width={0} height={4} fill={'#0B7A83'} />
    </Layout>
  );
  refs.num.text(() => `${Math.round(refs.bar.width() / 2)}`); // the number follows the bar
  return node;
}

const speed = makeRefs<typeof Stat>();
view.add(<Stat refs={speed} label="speed" />);
yield* speed.bar.width(184, 0.6, ease);
```

## Node subclasses

Extend `Node`, `Layout` or `Shape` for new drawing, for a component used across scenes, or for one whose orientation derives from its props. On 0.4.0 everything imports from the package roots.

```tsx
import {Node, NodeProps, computed, initial, signal, vector2Signal} from '@canvas-commons/2d';
import {BBox, PossibleVector2, SignalValue, SimpleSignal, Vector2Signal} from '@canvas-commons/core';

export interface PinProps extends NodeProps {
  from?: SignalValue<PossibleVector2>;
  to?: SignalValue<PossibleVector2>;
  radius?: SignalValue<number>;
}

export class Pin extends Node {
  @vector2Signal('from') declare public readonly from: Vector2Signal<this>;
  @vector2Signal('to') declare public readonly to: Vector2Signal<this>;
  @initial(8) @signal() declare public readonly radius: SimpleSignal<number, this>;

  public constructor(props: PinProps) {
    super(props);
  }

  @computed()
  public length(): number {
    return this.from().sub(this.to()).magnitude;
  }

  protected override getCacheBBox(): BBox {
    const r = this.radius();
    return new BBox(-this.length() / 2 - r, -r, this.length() + 2 * r, 2 * r);
  }

  protected override draw(context: CanvasRenderingContext2D) {
    // ...paint with this.length(), this.radius()...
    super.draw(context); // children on top
  }
}
```

### Decorators (0.4.0, legacy `experimentalDecorators`)

| decorator | purpose |
|---|---|
| `@signal()` | a simple signal-backed property |
| `@initial(value)` | its default; must sit **above** `@signal()`, or the engine logs "Missing property decorator" |
| `@computed()` | a cached derived method that tracks its dependencies |
| `@vector2Signal('name')` | a compound Vector2 signal (`.x`, `.y`) |
| `@colorSignal()` | a Color signal |
| `@canvasStyleSignal()` | fill/stroke style, including gradients |
| `@interpolation(fn)`, `@parser(fn)`, `@wrapper(Class)` | custom tweening and parsing; also above `@signal()` |

Declare properties as `declare public readonly name: SimpleSignal<T, this>` so TypeScript does not emit a field that would shadow the decorator's accessor.

### Overrides worth knowing

| override | when |
|---|---|
| `draw(context)` | paint anything; call `super.draw(context)` to render children |
| `getPath()` (Shape) | return a `Path2D`; Shape applies fill, stroke and line width for you |
| `localToParent()` | a transform derived from props, e.g. children laid out along `from` to `to` |
| `getCacheBBox()` | the local box of what `draw` paints. Needed when the node uses `cache`, filters, shadows or compositing, otherwise the cached render clips it |

## One public signal in, everything derived

A good component exposes one or a few signals and binds every internal property to them in the constructor. Outside code tweens the public signal and never reaches inside.

```tsx
import {Layout, LayoutProps, Rect, initial, signal} from '@canvas-commons/2d';
import {SignalValue, SimpleSignal, createRef} from '@canvas-commons/core';

export class Meter extends Layout {
  @initial(0) @signal() declare public readonly value: SimpleSignal<number, this>;
  private readonly bar = createRef<Rect>();

  public constructor(props: LayoutProps & {value?: SignalValue<number>}) {
    super({layout: true, ...props});
    this.add(<Rect ref={this.bar} height={'100%'} fill={'#E0306E'} />);
    this.bar().width(() => `${this.value() * 100}%`);
  }
}
// view.add(<Meter ref={meter} width={300} height={8} />);
// yield* meter().value(0.8, 0.6, ease);
```

## `tween()`: one progress, many outputs

For values outside the node graph (three.js objects, audio, a custom simulation):

```ts
import {tween, map} from '@canvas-commons/core';

yield* tween(0.6, t => {
  const e = ease(t);
  mesh.scale.setScalar(map(1, 2, e));
  mesh.position.z = map(0, 80, e);
});
```

Every timing function also accepts `(t, from, to)`, so `ease(t, 0, 80)` maps directly.

## `clampRemap`: staged secondary motion

```ts
import {clampRemap} from '@canvas-commons/core';

// stays 0 while radius < size/3, then ramps to 60 as radius reaches size
startOffset: () => clampRemap(size / 3, size, 0, 60, radius()),
```

`clampRemap(fromIn, toIn, fromOut, toOut, value)` maps with clamping. Use it inside bindings so secondary elements wake up partway through a primary motion. `remap` is the unclamped version.

## Frame hooks for things outside the graph

```ts
import {useScene} from '@canvas-commons/core';

const apply = () => {
  group.rotation.z = (orbit() / 180) * Math.PI; // read signals, write the external object
};
useScene().lifecycleEvents.onBeginRender.subscribe(() => apply());
apply(); // pose the external objects once at build, so the first frame is already right
```

`lifecycleEvents` on 0.4.0 has `onBeforeRender`, `onBeginRender`, `onFinishRender` and `onAfterRender`; each handler receives the 2D context as its first argument, so subscribe a wrapper (`() => apply()`) rather than `apply` itself, which keeps `apply` free to take its own arguments later. Call `apply()` once at build so the first frame is posed. One `apply()` that reads every signal and writes every external object, once per frame, is the pattern the `motion-3d` skill builds its three.js host on.

## Which kind

| need | use |
|---|---|
| reuse a block 2-3 times in one scene | function component |
| reuse across scenes in a project | either |
| new drawing (a shape, a vector, a burst) | Node or Shape subclass |
| children positioned in a derived frame | subclass with `localToParent()` |
| several refs in one object | `makeRefs<typeof Component>()` |
