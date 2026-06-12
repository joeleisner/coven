# Coven

A tiny set of runtime conveniences for building (or upgrading) web
components. Coven is magical in name only — the abstractions are small,
explicit, and inspired by Svelte's runes.

## Install

Deno:

```bash
deno add jsr:@joeleisner/coven
```

Node (via JSR's npm bridge):

```bash
npx jsr add @joeleisner/coven
```

## Quick example (plain element)

```ts
import { hexes } from '@joeleisner/coven';

const button = document.querySelector('button')!;

hexes.$soul(button, {
	connected: (signal) => {
		hexes.$on(button, { type: 'click', callback: () => console.log('clicked') });
	},
	disconnected: () => {
		console.log('cleaned up');
	},
});

// When removing from the DOM: hexes.$bewitch.abort(button)
```

Coven hexes work on any HTMLElement. If you only want a couple of
helpers and don't want to rewrite your components, you can.

## Quick example (using `Familiar`)

```ts
import { Familiar, hexes, charms } from '@joeleisner/coven';

class Counter extends Familiar {
	declare count: number;

	setup() {
		hexes.$shdw(this, '<button part="btn"><slot></slot> <span part="n">0</span></button>');
	}

	connected() {
		hexes.$attr<number>(this, {
			name: 'count',
			value: 0,
			callback: (v) => {
				hexes.$shdw.root(this)!.querySelector('span')!.textContent = String(v);
			},
		});
	}
}

charms.$define('my-counter', Counter);
```

## Concepts (the magical naming guide)

- **Familiar**: a witch's animal companion. The base custom-element class
  Coven provides. It has a signal and three lifecycle hooks
  (`setup`, `connected`, `disconnected`).
- **Grimoire**: a witch's spellbook. Per-element (and per-class)
  symbol-keyed storage. Coven uses it as the audit log: every active
  hex shows up as a slot.
- **Hex**: a binding that hides convenience work. Hexes write to the
  grimoire so their effect is visible and auditable.
- **Charm**: a small helper that does one thing transparently. Touches
  no grimoire.
- **`$bewitch`**: casts the spell that makes an element ready for
  hexes. Binds (or adopts) an AbortSignal.
- **`$scry`**: to scry is to observe by magical means from afar; here,
  IntersectionObserver.
- **`$shdw`**, **`$mut`**: abbreviated names for high-frequency
  calls (shadow DOM, MutationObserver).

## If you've used Svelte runes…

The `$rune.subMethod()` shape is the inspiration. Coven hexes are
runtime functions, not compiler primitives, but the mental model is the
same.

| Svelte rune      | Coven analogue                             |
| ---------------- | ------------------------------------------ |
| `$state(value)`  | `$prop(el, { name, value })`               |
| `$derived(expr)` | (compute in `connected()` from `$prop`)    |
| `$effect(fn)`    | `$on(el, ...)` / signal abort listeners    |
| `$bindable()`    | `$attr(el, { name, value })`               |

## API at a glance

| Export       | Kind      | What it does                                                       |
| ------------ | --------- | ------------------------------------------------------------------ |
| `Familiar`   | class     | Base custom-element with lifecycle hooks and a signal.             |
| `grimoire`   | fn        | Per-element symbol-keyed storage; `.shared` is class-level.        |
| `hexes`      | namespace | All hexes. Adopt the bewitched paradigm; call `$bewitch` on entry. |
| `charms`     | namespace | All charms. Bare, stateless helpers; caller manages the signal.    |

**Hexes** (`import { hexes } from '@joeleisner/coven'` or `import { ... } from '@joeleisner/coven/hexes'`):

| Hex         | What it does                                                        |
| ----------- | ------------------------------------------------------------------- |
| `$bewitch`  | Binds an AbortSignal to an element.                                 |
| `$attr`     | Two-way property/attribute binding.                                 |
| `$prop`     | Defines a get/set property with optional change callback.           |
| `$mut`      | Wraps MutationObserver.                                             |
| `$scry`     | Wraps IntersectionObserver.                                         |
| `$shdw`     | Attaches a shadow root, tracks `[part]` values, auto-bewitches.     |
| `$template` | Cached `<template>` factory, shared per class, auto-bewitches.      |
| `$on`       | Type-safe addEventListener; auto-wires the element's signal.        |
| `$soul`     | Full connected/disconnected lifecycle for plain elements.           |

**Charms** (`import { charms } from '@joeleisner/coven'` or `import { ... } from '@joeleisner/coven/charms'`):

| Charm       | What it does                                                                    |
| ----------- | ------------------------------------------------------------------------------- |
| `$assert`   | Throws a CovenError on a falsey condition.                                      |
| `$define`   | Idempotent `customElements.define`.                                             |
| `$emit`     | Dispatches an event named for the element's tag; pass `name` for `tag:name` events. |
| `$error`    | Throws a CovenError with `[tagname]:` prefix.                                   |
| `$on`       | Type-safe addEventListener; pass an optional signal for cleanup.                |
| `$shdw`     | Bare shadow attachment; no parts tracking, no grimoire writes.                  |
| `$template` | Bare `<template>` factory; no caching, no grimoire writes.                      |
| `$wake`     | Runs a callback when the DOM is ready.                                          |

**Twin pairs** (`$on`, `$shdw`, `$template`): charm and hex share the same name. Pick one or the other for a given element. The hex uses the charm for its core operation and layers signal management and grimoire state on top.

**`$wake` and `$soul`** are not twins: `$wake` (charm) defers a single callback; `$soul` (hex) manages a full connected/disconnected lifecycle and uses `$wake` internally.

## Guides

- [Naming and etymology](docs/naming.md)
- [Familiar lifecycle](docs/familiar-lifecycle.md)
- [Writing a hex](docs/writing-a-hex.md)
- [Writing a charm](docs/writing-a-charm.md)
- [The grimoire and the coven](docs/grimoire-and-coven.md)
- [Progressive enhancement](docs/progressive-enhancement.md)
- [Exportparts propagation](docs/exportparts-propagation.md)

## License

Apache-2.0. See [LICENSE](LICENSE).
