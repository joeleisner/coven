# The grimoire and the coven

The grimoire is per-element symbol-keyed storage. Every hex owns a
symbol and stores its state under that symbol. Reading the grimoire is
the canonical way to audit what magic is active.

```ts
import { grimoire } from '@joeleisner/coven';

// Symbols of every active hex on this element:
Object.getOwnPropertySymbols(grimoire(el));
```

## Instance vs. shared

- **`grimoire(element)`** / **`grimoire(element, type)`** — per-element
  storage. Each instance has its own.
- **`grimoire.shared(element, type)`** — per-constructor storage. Every
  instance of the same class sees the same slot. Used by `$template`
  to cache parsed templates once per custom-element class.

## Debugging with the grimoire

Dump the grimoire to see which hexes have touched an element:

```ts
console.log(grimoire(el));
// → { Symbol($bewitch): { signal, controller },
//     Symbol($shdw): { parts: Set(3) { 'header', ... } },
//     Symbol($attr): { names: Set(2) { 'mode', 'disabled' } },
//     ... }
```

If you see a hex you didn't expect, something invoked it. If you don't
see one you expect, the call didn't reach the hex.
