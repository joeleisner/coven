# Progressive enhancement

Most Coven hexes work on any `Element` (not just `HTMLElement` — an
`SVGElement` works too). `$bewitch`, `$on`, and `$soul` reach further
still and accept any `EventTarget`, including `document` and `window`.
You don't need to extend `Familiar`. This means you can adopt Coven
one helper at a time inside an existing component library.

## The soul pattern

For a plain element with full lifecycle management, use `$soul`. It
gives you the same connected/disconnected lifecycle as `Familiar`
without subclassing:

```ts
import { hexes } from '@joeleisner/coven';

const card = document.querySelector('.card')!;

hexes.$soul(card, {
  connected: (signal) => {
    hexes.$on(card, { type: 'click', callback: () => { /* … */ } });
    hexes.$attr(card, { name: 'expanded', value: false });
  },
  disconnected: () => {
    // runs when the element leaves the DOM
  },
});

// When removing from the DOM: hexes.$bewitch.abort(card)
```

`$soul` calls `$wake` internally, so `connected` runs after the DOM is
ready. The hex `$on` auto-wires the element's signal, so no explicit
signal plumbing is needed.

## The bewitch pattern (lower level)

If you only need a signal and want to call charms directly, reach for
`$bewitch` and pass the signal yourself:

```ts
import { hexes, charms } from '@joeleisner/coven';

const card = document.querySelector('.card')!;
const signal = hexes.$bewitch(card);

charms.$on(card, { type: 'click', callback: () => { /* … */ }, signal });
hexes.$attr(card, { name: 'expanded', value: false });
```

Every signal-using hex (`$attr`, `$prop`, `$mut`, `$scry`, `$on`)
calls `$bewitch` internally if you haven't already. Calling `$bewitch`
explicitly is a documentation gesture more than a requirement — it
makes the lifecycle intent visible at a glance.

## Adopting an external signal

If you already manage an `AbortController` for the element's lifecycle,
pass its signal to `$bewitch` so Coven adopts it:

```ts
const ctrl = new AbortController();
hexes.$bewitch(card, ctrl.signal);
// later:
ctrl.abort();
```

`$bewitch.abort(card)` is a no-op for adopted signals — only the owner
of the controller should abort it.

## Cleanup when you don't have a Familiar

If you bewitched explicitly (no external signal, no `$soul`), call
`$bewitch.abort(element)` when you're done with the element. Otherwise
the signal stays open and its listeners stay alive.
