import { grimoire } from '../grimoire.ts';
import { $bewitch } from './$bewitch.ts';

/** Grimoire slot key for `$scry`'s per-element state. */
export const $INT_GRIMOIRE_SYMBOL = Symbol('$int');

/** Per-element state stored under `$INT_GRIMOIRE_SYMBOL`. */
export type $IntGrimoire = {
	observers?: Set<IntersectionObserver>;
};

/**
 * Configuration accepted by `$scry`. Extends `IntersectionObserverInit`
 * with the required `callback`.
 */
export type $IntConfig = IntersectionObserverInit & {
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
	}: $IntConfig,
): IntersectionObserver {
	const signal = $bewitch(element);
	const store = grimoire<$IntGrimoire>(element, $INT_GRIMOIRE_SYMBOL);

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
	grimoire<$IntGrimoire>(element, $INT_GRIMOIRE_SYMBOL).observers;

/**
 * Disconnects every `IntersectionObserver` registered for this element
 * via `$scry`, then clears the internal `Set`.
 *
 * @param element - The element whose observers should be disconnected.
 */
$scry.disconnect = (element: HTMLElement): void => {
	const store = grimoire<$IntGrimoire>(element, $INT_GRIMOIRE_SYMBOL);
	store.observers?.forEach((o) => o.disconnect());
	store.observers?.clear();
};

export default $scry;
