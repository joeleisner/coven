/**
 * @module
 * {@link $morph} — {@link ResizeObserver} binding. Watch an element reshape
 * with automatic cleanup via `$bewitch`. Completes the observer trio
 * alongside `$mut` and `$scry`.
 */
import { grimoire } from '../grimoire.ts';
import { $bewitch } from './$bewitch.ts';

/**
 * Direct access to $morph's grimoire slot. Identifies the per-element state
 * bucket used internally by {@link $morph}.
 * @advanced
 */
export const $MORPH_GRIMOIRE_SYMBOL = Symbol('$morph');

/**
 * Per-element state stored under {@link $MORPH_GRIMOIRE_SYMBOL}.
 * @advanced
 */
export type $MorphGrimoire = {
	/** The set of active ResizeObservers on this element. */
	observers?: Set<ResizeObserver>;
};

/**
 * Configuration accepted by `$morph`. Extends `ResizeObserverOptions`
 * with the required `callback`.
 */
export type $MorphConfig = ResizeObserverOptions & {
	/** Called on each resize observation. */
	callback: ResizeObserverCallback;
};

/**
 * Creates and starts a `ResizeObserver` on the element with automatic
 * cleanup via the element's `$bewitch` signal. Each call creates a new
 * observer (intentional, since different call sites usually want different
 * `box` options); use `$morph.observers` to inspect them.
 *
 * @param element - The element to observe.
 * @param config - `ResizeObserverOptions` plus the required `callback`.
 * @returns The created `ResizeObserver`.
 *
 * @example
 * ```ts ignore
 * import { $morph } from '@joeleisner/coven/hexes/morph';
 *
 * const el = document.querySelector('my-el')! as HTMLElement;
 * $morph(el, {
 * 	callback: (entries) => console.log(entries[0]?.contentRect),
 * });
 * ```
 */
export function $morph(
	element: Element,
	{
		callback,
		...init
	}: $MorphConfig,
): ResizeObserver {
	const signal = $bewitch(element);
	const store = grimoire<$MorphGrimoire>(element, $MORPH_GRIMOIRE_SYMBOL);

	store.observers ??= new Set();

	const observer = new ResizeObserver(callback);

	if (signal.aborted) {
		return observer;
	}

	store.observers.add(observer);
	observer.observe(element, init);

	signal.addEventListener('abort', () => {
		observer.disconnect();
		store.observers?.delete(observer);
	}, { once: true });

	return observer;
}

/**
 * Returns the `Set` of `ResizeObserver`s registered for this element
 * via `$morph`, or `undefined` if none have been registered.
 *
 * @param element - The element to look up.
 * @returns The `Set` of observers, or `undefined`.
 */
$morph.observers = (element: Element): Set<ResizeObserver> | undefined =>
	grimoire<$MorphGrimoire>(element, $MORPH_GRIMOIRE_SYMBOL).observers;

/**
 * Disconnects every `ResizeObserver` registered for this element via
 * `$morph`, then clears the internal `Set`.
 *
 * @param element - The element whose observers should be disconnected.
 */
$morph.disconnect = (element: Element): void => {
	const store = grimoire<$MorphGrimoire>(element, $MORPH_GRIMOIRE_SYMBOL);
	store.observers?.forEach((o) => o.disconnect());
	store.observers = undefined;
};

export default $morph;
