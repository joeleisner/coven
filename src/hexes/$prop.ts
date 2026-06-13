/**
 * @module
 * {@link $prop} — reactive property definition. Installs a get/set property
 * on an element that fires a callback on change and supports `readonly`
 * enforcement via `$assert`.
 */
import { $assert } from '../charms/$assert.ts';
import { grimoire, type GrimoireElement } from '../grimoire.ts';
import { $bewitch } from './$bewitch.ts';

/** Change callback signature used by `$prop`. */
export type $PropCallback<TValue = unknown> = (newValue: TValue, oldValue: TValue) => void;

const $PROP_GRIMOIRE_SYMBOL = Symbol('$prop');

type $PropGrimoire = {
	props?: {
		[name: string]: {
			value: unknown;
			listener?: $PropCallback<unknown>;
			readonly: boolean;
		};
	};
};

/** Configuration accepted by `$prop`. */
export type $PropConfig<TValue = unknown> = {
	/** The property name to install on the element. */
	name: string;
	/** The initial value for the property. */
	value: TValue;
	/** Called with `(newValue, oldValue)` after each change. */
	callback?: $PropCallback<TValue>;
	/** When `true`, throws a `CovenError` on write attempts. */
	readonly?: boolean;
};

/**
 * Installs a reactive property on the element. The property holds its
 * own backing value, fires `callback` on change, and can be flagged
 * `readonly` to throw a `CovenError` on writes. Cleanup is bound to
 * the element's `$bewitch` signal — when it aborts, the property
 * descriptor is removed from the internal store.
 *
 * @param element - The element to install the property on.
 * @param config - Property name, default value, callback, and `readonly` flag.
 * @returns The initial value of the property.
 *
 * @see {@link $attr}
 *
 * @example
 * ```ts ignore
 * import { $prop } from '@joeleisner/coven';
 *
 * const el = document.createElement('my-el') as HTMLElement & { count: number };
 * $prop<number>(el, {
 * 	name: 'count',
 * 	value: 0,
 * 	callback: (next, prev) => console.log(prev, '->', next),
 * });
 * el.count = 1;
 * ```
 */
export function $prop<
	TValue = unknown,
>(
	element: HTMLElement,
	{
		name,
		value: defaultValue,
		callback,
		readonly,
	}: $PropConfig<TValue>,
): TValue {
	const signal = $bewitch(element);
	const store = grimoire<$PropGrimoire>(element, $PROP_GRIMOIRE_SYMBOL);

	store.props ??= {};

	const listener = callback
		? ((newValue: unknown, oldValue: unknown) => callback(newValue as TValue, oldValue as TValue))
		: undefined;

	store.props[name] = {
		value: defaultValue,
		listener,
		readonly: !!readonly,
	};

	const entry = store.props[name];

	Object.defineProperty(element, name, {
		get(): TValue {
			return entry.value as TValue;
		},
		set(newValue: TValue) {
			$assert(element, !entry.readonly, `Cannot set read-only property "${name}".`);

			if (entry.value === newValue) return;

			const oldValue = entry.value as TValue;
			entry.value = newValue;

			entry.listener?.(newValue, oldValue);
		},
	});

	signal.addEventListener('abort', () => {
		delete store.props?.[name];
	});

	return entry.value as TValue;
}

/**
 * Returns the names of every property bound to the element via $prop.
 */
$prop.list = (element: HTMLElement): string[] => {
	const store = grimoire<$PropGrimoire>(
		element as GrimoireElement,
		$PROP_GRIMOIRE_SYMBOL,
	);
	return Object.keys(store.props ?? {});
};

/**
 * Returns whether the named property was defined as readonly, or
 * undefined if no such property exists.
 */
$prop.readonly = (
	element: HTMLElement,
	name: string,
): boolean | undefined => {
	const store = grimoire<$PropGrimoire>(
		element as GrimoireElement,
		$PROP_GRIMOIRE_SYMBOL,
	);
	return store.props?.[name]?.readonly;
};

export default $prop;
