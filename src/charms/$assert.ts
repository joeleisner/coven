import { $error } from './$error.ts';

/**
 * Asserts a condition from inside a component. Coerces non-boolean
 * values via `Boolean(...)` and, on failure, throws a tagged
 * `CovenError` via `$error` so the message is prefixed with the
 * component's tag name.
 *
 * @param element - The component from which the assertion is made.
 * @param condition - Any value; coerced to boolean.
 * @param message - The failure message (the tag name is prepended).
 *
 * @see {@link $error}
 *
 * @example
 * ```ts ignore
 * import { $assert } from '@joeleisner/coven';
 *
 * const el = document.createElement('my-el');
 * $assert(el, el.isConnected, 'must be connected first');
 * ```
 */
export function $assert(
	element: Element,
	condition: unknown,
	message: string,
): asserts condition {
	if (typeof condition !== 'boolean') {
		condition = Boolean(condition);
	}

	if (!condition) $error(element, message);
}

export default $assert;
