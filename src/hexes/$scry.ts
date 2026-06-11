import type { SignalElement } from "../elements.d.ts";
import { grimoire } from "../grimoire.ts";

export const $INT_GRIMOIRE_SYMBOL = Symbol('$int');

export type $IntGrimoire = {
	observers?: Set<IntersectionObserver>;
};

export type $IntConfig = IntersectionObserverInit & {
	callback: IntersectionObserverCallback;
};

export function $scry(
	element: SignalElement,
	{
		callback,
		...init
	}: $IntConfig
): IntersectionObserver {
	const store = grimoire<$IntGrimoire>(element, $INT_GRIMOIRE_SYMBOL);

	store.observers ??= new Set();

	const observer = new IntersectionObserver(callback, {
		...init,
	});

	if (element.signal?.aborted)
		return observer;

	store.observers.add(observer);

	observer.observe(element);

	element.signal?.addEventListener('abort', () => {
		observer.disconnect();
	});

	return observer;
}

export default $scry;
