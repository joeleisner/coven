/**
 * @module
 * {@link $attr} — two-way property/attribute binding. Keeps a component
 * property and its HTML attribute in sync in both directions, with an
 * optional change callback.
 */
import { grimoire, type GrimoireElement } from '../grimoire.ts';
import { $bewitch } from './$bewitch.ts';
import $mut from './$mut.ts';
import $prop from './$prop.ts';

const $ATTR_GRIMOIRE_SYMBOL = Symbol('$attr');
type $AttrGrimoire = { names?: Set<string> };

/** The primitive value types `$attr` can reflect to an attribute. */
export type $AttrValue = string | number | boolean;

/** Configuration accepted by `$attr`. */
export type $AttrConfig<TValue extends $AttrValue> = {
	name: string;
	value: TValue;
	callback?: (newValue: TValue, oldValue: TValue) => void;
};

/**
 * Binds a property of a component to a same-named HTML attribute,
 * keeping the two in sync in both directions. The default value seeds
 * the property when the attribute is absent, and an optional callback
 * fires on every change. Internally combines `$prop` (for the property
 * surface) with `$mut` (for attribute observation).
 *
 * @param element - The component instance.
 * @param config - Attribute name, default value, and optional callback.
 * @returns The initial value of the property.
 *
 * @see {@link $prop}
 *
 * @example
 * ```ts ignore
 * import { $attr } from '@joeleisner/coven';
 *
 * const el = document.createElement('my-el') as HTMLElement & { count: number };
 * $attr<number>(el, {
 * 	name: 'count',
 * 	value: 0,
 * 	callback: (next) => console.log('count is now', next),
 * });
 * ```
 */
export function $attr<
	TValue extends $AttrValue = string,
>(
	element: HTMLElement,
	{
		name,
		value,
		callback,
	}: $AttrConfig<TValue>,
): TValue {
	const signal = $bewitch(element);

	const store = grimoire<$AttrGrimoire>(
		element as GrimoireElement,
		$ATTR_GRIMOIRE_SYMBOL,
	);
	store.names ??= new Set();
	store.names.add(name);

	const parseAttributeValue = (attrValue: string | null): TValue => {
		if (attrValue === null) {
			return value;
		}

		if (typeof value === 'boolean') {
			return true as TValue;
		}

		if (typeof value === 'number') {
			return Number(attrValue) as TValue;
		}

		return attrValue as TValue;
	};

	const reflectAttributeValue = (value: TValue): void => {
		if (value === false || value === null || value === undefined) {
			return element.removeAttribute(name);
		}

		if (value === true) {
			return element.setAttribute(name, '');
		}

		element.setAttribute(name, String(value));
	};

	let syncingFromAttribute = false;
	let syncingFromProperty = false;

	const initialAttributeValue = parseAttributeValue(element.getAttribute(name));

	const initialValue = $prop(element, {
		name,
		value: initialAttributeValue,
		callback(newValue, oldValue) {
			if (!syncingFromAttribute) {
				syncingFromProperty = true;
				try {
					reflectAttributeValue(newValue);
				} finally {
					syncingFromProperty = false;
				}
			}

			if (callback && !signal.aborted) {
				callback.call(element, newValue, oldValue);
			}
		},
	});

	$mut(element, {
		type: 'attributes',
		callback(attr, newValue) {
			if (attr !== name) return;

			if (syncingFromProperty) return;

			const parsedValue = parseAttributeValue(newValue);
			const target = element as unknown as Record<string, unknown>;
			if (target[name] === parsedValue) return;

			syncingFromAttribute = true;
			try {
				target[name] = parsedValue;
			} finally {
				syncingFromAttribute = false;
			}
		},
	});

	return initialValue;
}

/**
 * Returns the names of every attribute bound to the element via $attr.
 */
$attr.list = (element: HTMLElement): string[] => [
	...(grimoire<$AttrGrimoire>(
		element as GrimoireElement,
		$ATTR_GRIMOIRE_SYMBOL,
	).names ?? new Set<string>()),
];

export default $attr;
