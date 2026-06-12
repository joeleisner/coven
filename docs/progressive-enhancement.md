# Progressive enhancement

Coven hexes work on any `HTMLElement`. You don't need to extend
`Familiar`. This means you can adopt Coven one helper at a time inside
an existing component library.

## The bewitch pattern

For any element you want to apply hexes to, call `$bewitch` first
(implicitly via any signal-using hex, or explicitly to make the intent
clear and to get the signal you can hand to charms like `$on`):

```ts
import { $bewitch, $on, $attr } from '@joeleisner/coven';

const card = document.querySelector('.card')!;
const signal = $bewitch(card);

$on(card, { type: 'click', callback: () => { /* … */ }, signal });
$attr(card, { name: 'expanded', value: false });
```

Every signal-using hex (`$attr`, `$prop`, `$mut`, `$scry`) calls
`$bewitch` internally if you haven't already. Calling `$bewitch`
explicitly is a documentation gesture more than a requirement — but
when you want a charm like `$on` to be cleaned up automatically, you
need the signal in hand to pass through. `$shdw` and `$template` are
signal-free hexes and don't bewitch.

## Adopting an external signal

If you already manage an `AbortController` for the element's lifecycle,
pass its signal to `$bewitch` so Coven adopts it:

```ts
const ctrl = new AbortController();
$bewitch(card, ctrl.signal);
// later:
ctrl.abort();
```

`$bewitch.abort(card)` is a no-op for adopted signals — only the owner
of the controller should abort it.

## Cleanup when you don't have a Familiar

If you bewitched explicitly (no external signal), call
`$bewitch.abort(element)` when you're done with the element. Otherwise
the signal stays open and its listeners stay alive.
