import type { SignalElement } from "../elements";
import $mut from "./$mut";
import $prop from "./$prop";

export type $AttrValue = string | number | boolean;

export type $AttrConfig<TValue extends $AttrValue> = {
	name: string;
	value: TValue;
	callback?: (newValue: TValue, oldValue: TValue) => void;
};

/**
 * Binds a property of a component to an attribute, with optional default value and change callback.
 *
 * @param element - The component instance.
 * @param name - The name of the property/attribute.
 * @param value - The default value for the property.
 * @param callback - Optional callback to be invoked when the property changes.
 * @returns The initial value of the property.
 */
export function $attr<
	TValue extends $AttrValue = string,
>(
	element: SignalElement,
	{
		name,
		value,
		callback,
	}: $AttrConfig<TValue>
): TValue {
	const parseAttributeValue = (attrValue: string | null): TValue => {
		if (attrValue === null)
			return value;

		if (typeof value === 'boolean')
			return true as TValue;

		if (typeof value === 'number')
			return Number(attrValue) as TValue;

		return attrValue as TValue;
	};

	const reflectAttributeValue = (value: TValue): void => {
		if (value === false || value === null || value === undefined)
			return element.removeAttribute(name);

		if (value === true)
			return element.setAttribute(name, '');

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

			if (callback && !element.signal?.aborted) {
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
			if ((element as any)[name] === parsedValue) return;

			syncingFromAttribute = true;
			try {
				(element as any)[name] = parsedValue;
			} finally {
				syncingFromAttribute = false;
			}
		},
	});

	return initialValue;
}

export default $attr;
