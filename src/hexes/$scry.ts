import { grimoire } from "../grimoire.ts";
import { $bewitch } from "./$bewitch.ts";

export const $INT_GRIMOIRE_SYMBOL = Symbol('$int');

export type $IntGrimoire = {
	observers?: Set<IntersectionObserver>;
};

export type $IntConfig = IntersectionObserverInit & {
	callback: IntersectionObserverCallback;
};

export function $scry(
	element: HTMLElement,
	{
		callback,
		...init
	}: $IntConfig
): IntersectionObserver {
	const signal = $bewitch(element);
	const store = grimoire<$IntGrimoire>(element, $INT_GRIMOIRE_SYMBOL);

	store.observers ??= new Set();

	const observer = new IntersectionObserver(callback, {
		...init,
	});

	if (signal.aborted)
		return observer;

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
