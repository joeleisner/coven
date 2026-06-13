# Writing a hex

A hex is any function that **writes to the grimoire**. That's the only
hard rule. In practice, a typical hex:

1. Takes a node as its first argument (usually `HTMLElement`, but some
   hexes accept any `Node` — see `$mut` and `$bewitch`).
2. Stores per-element state in the grimoire under a private symbol.
3. If it has lifecycle-bound side effects, calls `$bewitch(element)` to
   get a signal and registers cleanup on it.
4. Optionally exposes read-only sub-methods.

## Skeleton

```ts
import { $bewitch } from './$bewitch.ts';
import { grimoire, type GrimoireElement } from '../grimoire.ts';

export const $MY_HEX_GRIMOIRE_SYMBOL = Symbol('$myHex');

type $MyHexGrimoire = {
    values?: Set<string>;
};

/**
 * One-line description of what this hex does.
 *
 * @param element - The element to apply the hex to.
 * @param config  - Hex configuration.
 */
export function $myHex(element: HTMLElement, config: { name: string }): void {
    const signal = $bewitch(element);
    const store = grimoire<$MyHexGrimoire>(
        element as GrimoireElement,
        $MY_HEX_GRIMOIRE_SYMBOL,
    );
    store.values ??= new Set();
    store.values.add(config.name);

    signal.addEventListener('abort', () => {
        store.values?.delete(config.name);
    }, { once: true });
}

/**
 * Read the names tracked by $myHex.
 */
$myHex.list = (element: HTMLElement): string[] => [
    ...(grimoire<$MyHexGrimoire>(
        element as GrimoireElement,
        $MY_HEX_GRIMOIRE_SYMBOL,
    ).values ?? new Set<string>()),
];

export default $myHex;
```

The grimoire symbol is exported so advanced callers can read the raw
store. Mark it `@advanced` in JSDoc to signal that it's an escape hatch.

## Sub-method conventions

- The main call does the side effect.
- Sub-methods read state or expose internals (no side effects).
- Names: `list`, `signal`, `abort`, `renew`, `observer`, `observers`,
  `parts`, `root`, `cache`, `clone`, `propagate`.

## Class-level state

If your hex needs state shared across every instance of the same class
(e.g. a template cache), use `grimoire.shared(element, type)` instead
of `grimoire(element, type)`.

## Twin-pair hexes

`$on`, `$shdw`, and `$template` have charm twins with the same name.
When writing a hex in this group, keep the hex's core operation inside
the charm (pure logic, no grimoire, no bewitch), then call the charm
from the hex after setting up the signal. This keeps both variants
consistent and testable in isolation.

## Don't write a hex if…

…the function has no per-element state and doesn't subscribe to
anything cleanup-worthy. That's a charm; see [Writing a charm](writing-a-charm.md).
