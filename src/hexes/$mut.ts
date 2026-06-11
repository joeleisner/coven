import type { SignalElement } from "../elements";
import { grimoire } from "../grimoire";

export type $MutValueMap = {
	attributes: string | null;
	childList: NodeListOf<ChildNode>;
	characterData: string | null;
};

export type $MutCallbacks = {
	attributes: (
		attr: string,
		newValue: string | null,
		oldValue: string | null
	) => void;
	childList: (newValue: NodeListOf<ChildNode>) => void;
	characterData: (newValue: string | null) => void;
};

export const $MUT_GRIMOIRE_SYMBOL = Symbol('$mut');

export type $MutGrimoire = {
	observer?: MutationObserver;
	listeners?: {
		[TType in keyof $MutValueMap]?: Set<$MutCallbacks[TType]>;
	};
}
	
export type $MutConfig<
	TType extends keyof $MutValueMap = keyof $MutValueMap,
> = {
	type: TType;
	callback: $MutCallbacks[TType];
	subtree?: boolean;
};

export function $mut(
	element: SignalElement,
	config: $MutConfig<'attributes'>
): MutationObserver;
export function $mut(
	element: SignalElement,
	config: $MutConfig<'childList'>
): MutationObserver;
export function $mut(
	element: SignalElement,
	config: $MutConfig<'characterData'>
): MutationObserver;
export function $mut<
	TType extends keyof $MutValueMap,
>(
	element: SignalElement,
	{
		type,
		callback,
		subtree = false,
	}: $MutConfig<TType>
): MutationObserver {
	const store = grimoire<$MutGrimoire>(element, $MUT_GRIMOIRE_SYMBOL);

	store.listeners ??= {};
	(store.listeners[type] as Set<$MutCallbacks[TType]>) ??= new Set();
	(store.listeners[type] as Set<$MutCallbacks[TType]>).add(callback);

	if (store.observer) return store.observer;

	const onChange = (mutations: MutationRecord[]) => {
		for (const mutation of mutations) {
			switch (mutation.type) {
				case 'attributes': {
					const callbacks = store.listeners?.attributes;
					if (!callbacks || !callbacks.size) break;

					const attrName = mutation.attributeName!;
					const newValue = element.getAttribute(attrName);
					const oldValue = mutation.oldValue;
					callbacks.forEach(
						cb => cb(attrName, newValue, oldValue)
					);
					break;
				}
				case 'childList': {
					const callbacks = store.listeners?.childList;
					if (!callbacks || !callbacks.size) break;

					callbacks.forEach(cb => cb(element.childNodes));
					break;
				}
				case 'characterData': {
					const callbacks = store.listeners?.characterData;
					if (!callbacks || !callbacks.size) break;

					callbacks.forEach(cb => cb(mutation.target.textContent));
					break;
				}
			}
		}
	};

	const observer = new MutationObserver(onChange);

	observer.observe(element, {
		attributes: type === 'attributes',
		childList: type === 'childList',
		characterData: type === 'characterData',
		subtree,
		attributeOldValue: type === 'attributes',
		characterDataOldValue: type === 'characterData',
	});

	element.signal?.addEventListener('abort', () => {
		if (store.listeners) delete store.listeners[type];
		observer.disconnect();
		store.observer = undefined;
	}, { once: true });

	return observer;
}

export default $mut;