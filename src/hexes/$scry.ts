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
	});

	return observer;
}

export default $scry;
