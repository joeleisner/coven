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

## 30-second example — on a plain element

```ts
import { $bewitch, $on, $attr } from '@joeleisner/coven';

const button = document.querySelector('button')!;
const signal = $bewitch(button);
$on(button, { type: 'click', callback: () => console.log('clicked!'), signal });
$attr(button, { name: 'disabled', value: false });
```

Coven hexes work on any HTMLElement. If you only want a couple of
helpers and don't want to rewrite your components, you can.

## 30-second example — using `Familiar`

```ts
import { Familiar, $shdw, $attr, $define } from '@joeleisner/coven';

class Counter extends Familiar {
	declare count: number;

	setup() {
		$shdw(this, '<button part="btn"><slot></slot> <span part="n">0</span></button>');
	}

	connected() {
		$attr<number>(this, {
			name: 'count',
			value: 0,
			callback: (v) => {
				$shdw.root(this)!.querySelector('span')!.textContent = String(v);
			},
		});
	}
}

$define('my-counter', Counter);
```

## Concepts (the magical naming guide)

- **Familiar** — a witch's animal companion. The base custom-element class
  Coven provides. It has a signal and three lifecycle hooks
  (`setup`, `connected`, `disconnected`).
- **Grimoire** — a witch's spellbook. Per-element (and per-class)
  symbol-keyed storage. Coven uses it as the audit log: every active
  hex shows up as a slot.
- **Hex** — a binding that hides convenience work. Hexes write to the
  grimoire so their effect is visible and auditable.
- **Charm** — a small helper that does one thing transparently. Touches
  no grimoire.
- **`$bewitch`** — casts the spell that makes an element ready for
  hexes. Binds (or adopts) an AbortSignal.
- **`$scry`** — to scry is to observe by magical means from afar; here,
  IntersectionObserver.
- **`$shdw`**, **`$mut`** — abbreviated names for high-frequency
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

| Export       | Kind  | What it does                                                |
| ------------ | ----- | ----------------------------------------------------------- |
| `Familiar`   | class | Base custom-element with lifecycle hooks and a signal.      |
| `grimoire`   | fn    | Per-element symbol-keyed storage; `.shared` is class-level. |
| `$bewitch`   | hex   | Binds an AbortSignal to an element.                         |
| `$attr`      | hex   | Two-way property↔attribute binding.                         |
| `$prop`      | hex   | Defines a get/set property with optional change callback.   |
| `$mut`       | hex   | Wraps MutationObserver.                                     |
| `$scry`      | hex   | Wraps IntersectionObserver.                                 |
| `$shdw`      | hex   | Attaches & populates a shadow root; tracks `[part]` values. |
| `$template`  | hex   | Cached `<template>` factory, shared per class.              |
| `$assert`    | charm | Throws a CovenError on a falsey condition.                  |
| `$define`    | charm | Idempotent `customElements.define`.                         |
| `$emit`      | charm | Dispatches an event named for the element's tag.            |
| `$error`     | charm | Throws a CovenError with `[tagname]:` prefix.               |
| `$on`        | charm | Type-safe addEventListener; pass an optional signal for cleanup. |

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
