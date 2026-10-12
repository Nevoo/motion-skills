# Time events: never hard-code timeline times

`waitUntil` takes the **name** of a time event. The editor shows each event as a draggable pill on the timeline and stores its delay in the scene's `.meta` file, so you re-time a piece by dragging, not by editing code. On 0.4.0 the signature is `waitUntil(event: string, after?)`; passing a number is a type error.

## The idiom

```ts
import {waitUntil} from '@canvas-commons/core';

yield* intro();
yield* waitUntil('intro_done');
yield* morphSearchToPill();
yield* waitUntil('pill_settled');
yield* reveal();
```

New events start with a delay of 0, so the first preview plays every beat back to back. Drag a pill to add the pause before it.

## Editor behaviour (0.4.0)

- Dragging a pill moves that event **and every later event** by the same amount, so the spacing after it is kept.
- **SHIFT-drag** moves only that event; later events keep their absolute times and the gaps around it change.
- Durations persist in `src/scenes/<scene>.meta` under `timeEvents`. Commit the file.
- Each name may be used once per scene; a duplicate logs `name "x" has already been used for another event name`.

The usual workflow: place every `waitUntil`, align the first pill to its cue, then work down the list. Each later drag is local.

## Durations from events: `useDuration`

```ts
import {useDuration, waitUntil} from '@canvas-commons/core';

yield* waitUntil('card_in');
yield* card().scale(1, useDuration('card_in'), ease);  // the editor sets how long the scale runs
```

## With narration

1. Add the audio to the project (`audio` in `makeProject`), so it plays under the timeline.
2. Put a `waitUntil('cue')` at each spoken cue.
3. Play, and drag each pill until the picture lands on the word.
4. When the voice-over is re-recorded, drag the same pills again. No code changes.

## Naming

- Snake case, named after what happens: `intro_done`, `morph_starts`, `spots_revealed`.
- No timing in the name (`wait_3s`): the duration is exactly what the name should not freeze.
- Match narration where there is any: "and then it pulls..." becomes `pull_begins`.

## When a literal time is right

Micro-timing inside one beat is fixed rhythm, not an editable concept. Hard-code it with `waitFor`:

```ts
yield* all(
  title().opacity(1, 0.4, ease),
  chain(waitFor(0.08), subtitle().opacity(1, 0.4, ease)),
);
```

Rule: every beat that a person might want to move gets a `waitUntil`. Everything inside a beat is `waitFor` and tween durations.

## Migrating a number-based helper

A custom helper like the one below shadows the real API and defeats the editable timeline:

```ts
// wrong: hard-coded absolute times
function* waitUntil(t: number) {
  yield* waitFor(Math.max(0, t - useThread().time()));
}
yield* waitUntil(3.9);
```

Delete it, import the real `waitUntil`, and give each call a name. The first preview plays back to back until you drag the pills.
