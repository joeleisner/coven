/**
 * @module
 * {@link $scry} — {@link IntersectionObserver} binding. Observe an element's
 * intersection with the viewport or a scroll container, with automatic
 * cleanup via `$bewitch`.
 */
import { grimoire } from '../grimoire.ts';
import { $bewitch } from './$bewitch.ts';

/**
 * Direct access to $scry's grimoire slot. Identifies the per-element state
 * bucket used internally by {@link $scry}.
 * @advanced
 */
export const $SCRY_GRIMOIRE_SYMBOL = Symbol('$scry');

/**
 * Per-element state stored under {@link $SCRY_GRIMOIRE_SYMBOL}.
 * @advanced
 */
export type $ScryGrimoire = {
	/** The set of active IntersectionObservers on this element. */
	observers?: Set<IntersectionObserver>;
};

/**
 * Configuration accepted by `$scry`. Extends `IntersectionObserverInit`
 * with the required `callback`.
 */
export type $ScryConfig = IntersectionObserverInit & {
	/** Called on each intersection observation. */
	callback: IntersectionObserverCallback;
};

/**
 * Creates and starts an `IntersectionObserver` on the element with
 * automatic cleanup via the element's `$bewitch` signal. Each call
 * creates a new observer (intentional, since different call sites
 * usually want different thresholds); use `$scry.observers` to
 * inspect them.
 *
 * @param element - The element to observe.
 * @param config - `IntersectionObserverInit` plus the required `callback`.
 * @returns The created `IntersectionObserver`.
 *
 * @example
 * ```ts ignore
 * import { $scry } from '@joeleisner/coven';
 *
 * const el = document.querySelector('my-el')! as HTMLElement;
 * $scry(el, {
 * 	threshold: 0.5,
 * 	callback: (entries) => console.log(entries[0]?.isIntersecting),
 * });
 * ```
 */
export function $scry(
	element: HTMLElement,
	{
		callback,
		...init
	}: $ScryConfig,
): IntersectionObserver {
	const signal = $bewitch(element);
	const store = grimoire<$ScryGrimoire>(element, $SCRY_GRIMOIRE_SYMBOL);

	store.observers ??= new Set();

	const observer = new IntersectionObserver(callback, {
		...init,
	});

	if (signal.aborted) {
		return observer;
	}

	store.observers.add(observer);

	observer.observe(element);

	signal.addEventListener('abort', () => {
		observer.disconnect();
		store.observers?.delete(observer);
	}, { once: true });

	return observer;
}

/**
 * Returns the `Set` of `IntersectionObserver`s registered for this element
 * via `$scry`, or `undefined` if none have been registered.
 *
 * @param element - The element to look up.
 * @returns The `Set` of observers, or `undefined`.
 */
$scry.observers = (element: HTMLElement): Set<IntersectionObserver> | undefined =>
	grimoire<$ScryGrimoire>(element, $SCRY_GRIMOIRE_SYMBOL).observers;

/**
 * Disconnects every `IntersectionObserver` registered for this element
 * via `$scry`, then clears the internal `Set`.
 *
 * @param element - The element whose observers should be disconnected.
 */
$scry.disconnect = (element: HTMLElement): void => {
	const store = grimoire<$ScryGrimoire>(element, $SCRY_GRIMOIRE_SYMBOL);
	store.observers?.forEach((o) => o.disconnect());
	store.observers?.clear();
};

export default $scry;
