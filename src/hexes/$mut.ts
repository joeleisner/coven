/**
 * @module
 * {@link $mut} — shared {@link MutationObserver} binding. Subscribes to DOM
 * mutations on a node with automatic cleanup via `$bewitch`. Multiple
 * callbacks for the same node share one underlying observer.
 */
import { grimoire, type GrimoireElement } from '../grimoire.ts';
import { $bewitch } from './$bewitch.ts';

/** Maps each observable mutation type to the shape of its emitted value. */
export type $MutValueMap = {
	/** The new attribute value (or `null` when removed) for attribute mutations. */
	attributes: string | null;
	/** The current child node list for childList mutations. */
	childList: NodeListOf<ChildNode>;
	/** The new text content (or `null`) for characterData mutations. */
	characterData: string | null;
};

/** Per-type callback signatures used by `$mut`. */
export type $MutCallbacks = {
	/** Fires with the attribute name, new value, and old value on each attribute change. */
	attributes: (
		attr: string,
		newValue: string | null,
		oldValue: string | null,
	) => void;
	/** Fires with the updated child node list on each childList change. */
	childList: (newValue: NodeListOf<ChildNode>) => void;
	/** Fires with the new text content on each characterData change. */
	characterData: (newValue: string | null) => void;
};

/**
 * Direct access to $mut's grimoire slot. Identifies the per-node state
 * bucket used internally by {@link $mut}.
 * @advanced
 */
export const $MUT_GRIMOIRE_SYMBOL = Symbol('$mut');

/**
 * Per-node state stored under {@link $MUT_GRIMOIRE_SYMBOL}.
 * @advanced
 */
export type $MutGrimoire = {
	/** The shared MutationObserver for this node. */
	observer?: MutationObserver;
	/** Per-type sets of registered callbacks. */
	listeners?: {
		[TType in keyof $MutValueMap]?: Set<$MutCallbacks[TType]>;
	};
};

/** Configuration accepted by `$mut`. */
export type $MutConfig<
	TType extends keyof $MutValueMap = keyof $MutValueMap,
> = {
	/** Which mutation type to observe (`'attributes'` | `'childList'` | `'characterData'`). */
	type: TType;
	/** Called on each observed mutation of this type. */
	callback: $MutCallbacks[TType];
	/** When `true`, also observes descendant nodes. Forwarded to `MutationObserverInit`. */
	subtree?: boolean;
};

/**
 * Subscribes to mutations on a node via a shared `MutationObserver`.
 *
 * The first argument is the node to observe — it can be any `Node`,
 * including an `HTMLElement`, a `ShadowRoot`, a text node, or any other
 * DOM node a `MutationObserver` is allowed to watch. The `type` field
 * of the config selects which `MutationObserverInit` flag is set
 * (`attributes` | `childList` | `characterData`); `subtree` is forwarded
 * through.
 *
 * Repeat calls for the same node share the underlying observer; multiple
 * callbacks for the same `type` are all invoked. Cleanup is bound to the
 * node's `$bewitch` signal, so aborting the signal disconnects the
 * observer.
 *
 * @param node - The node to observe.
 * @param config - The mutation type, callback, and `subtree` flag.
 * @returns The shared `MutationObserver` for this node.
 *
 * @example
 * ```ts ignore
 * import { $mut } from '@joeleisner/coven';
 *
 * const el = document.querySelector('my-el')!;
 * $mut(el, {
 * 	type: 'attributes',
 * 	callback: (attr, next) => console.log(attr, '=', next),
 * });
 * ```
 */
export function $mut(
	node: Node,
	config: $MutConfig<'attributes'>,
): MutationObserver;
/** Observes `childList` mutations on `node` via a shared `MutationObserver`. */
export function $mut(
	node: Node,
	config: $MutConfig<'childList'>,
): MutationObserver;
/** Observes `characterData` mutations on `node` via a shared `MutationObserver`. */
export function $mut(
	node: Node,
	config: $MutConfig<'characterData'>,
): MutationObserver;
export function $mut<
	TType extends keyof $MutValueMap,
>(
	node: Node,
	{
		type,
		callback,
		subtree = false,
	}: $MutConfig<TType>,
): MutationObserver {
	const signal = $bewitch(node);
	const store = grimoire<$MutGrimoire>(
		node as GrimoireElement,
		$MUT_GRIMOIRE_SYMBOL,
	);

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
					const target = mutation.target as Element;
					const newValue = target.getAttribute(attrName);
					const oldValue = mutation.oldValue;
					callbacks.forEach(
						(cb) => cb(attrName, newValue, oldValue),
					);
					break;
				}
				case 'childList': {
					const callbacks = store.listeners?.childList;
					if (!callbacks || !callbacks.size) break;

					callbacks.forEach((cb) => cb(node.childNodes));
					break;
				}
				case 'characterData': {
					const callbacks = store.listeners?.characterData;
					if (!callbacks || !callbacks.size) break;

					callbacks.forEach((cb) => cb(mutation.target.textContent));
					break;
				}
			}
		}
	};

	const observer = new MutationObserver(onChange);
	store.observer = observer;

	observer.observe(node, {
		attributes: type === 'attributes',
		childList: type === 'childList',
		characterData: type === 'characterData',
		subtree,
		attributeOldValue: type === 'attributes',
		characterDataOldValue: type === 'characterData',
	});

	signal.addEventListener('abort', () => {
		if (store.listeners) delete store.listeners[type];
		observer.disconnect();
		store.observer = undefined;
	}, { once: true });

	return observer;
}

/**
 * Returns the underlying `MutationObserver` shared by all `$mut` calls
 * on this node, or `undefined` if `$mut` has not been called for it yet.
 *
 * @param node - The node to look up.
 * @returns The shared `MutationObserver`, or `undefined`.
 */
$mut.observer = (node: Node): MutationObserver | undefined =>
	grimoire<$MutGrimoire>(
		node as GrimoireElement,
		$MUT_GRIMOIRE_SYMBOL,
	).observer;

/**
 * Returns the `Set` of registered callbacks for a given mutation `type`
 * on this node, or `undefined` if none have been registered.
 *
 * @param node - The node to look up.
 * @param type - The mutation type (`attributes` | `childList` | `characterData`).
 * @returns The `Set` of callbacks for that type, or `undefined`.
 */
$mut.listeners = <TType extends keyof $MutValueMap>(
	node: Node,
	type: TType,
): Set<$MutCallbacks[TType]> | undefined => {
	const store = grimoire<$MutGrimoire>(
		node as GrimoireElement,
		$MUT_GRIMOIRE_SYMBOL,
	);
	return store.listeners?.[type] as Set<$MutCallbacks[TType]> | undefined;
};

export default $mut;
