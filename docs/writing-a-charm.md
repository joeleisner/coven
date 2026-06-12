# Writing a charm

A charm is a small helper that:

- Takes the element it operates on as the first argument (for symmetry).
- Has no per-element state.
- Does not write to the grimoire.

## Skeleton

```ts
/**
 * Throws a friendly error if condition is falsey.
 *
 * @param element - The element to scope the error to.
 * @param condition - The truthy value to assert.
 * @param message - The message to throw.
 */
export function $myCharm(
	element: HTMLElement,
	condition: unknown,
	message: string,
): asserts condition {
	if (!condition) {
		throw new Error(`[${element.tagName.toLowerCase()}]: ${message}`);
	}
}

export default $myCharm;
```

## When a charm should become a hex

If you find yourself adding any of these to your charm, it's a hex:

- A subscription you need to clean up later.
- A piece of state you want a sibling hex to read.
- An idempotency cache.

## Charms that use signals

Some charms accept an optional `signal` parameter so callers can opt
into cleanup. `$on` is the canonical example: it forwards `signal` to
`addEventListener` but doesn't decide where the signal comes from. The
caller passes `this.signal` (inside a Familiar), `$bewitch(element)`
(for a plain element), or an external `AbortSignal` they manage
themselves.
