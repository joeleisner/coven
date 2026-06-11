import { $assert } from "../charms/$assert.ts";
import { grimoire, type GrimoireElement } from "../grimoire.ts";
import { $bewitch } from "./$bewitch.ts";

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
}

export type $PropConfig<TValue = unknown> = {
	name: string;
	value: TValue;
	callback?: $PropCallback<TValue>;
	readonly?: boolean;
};

export function $prop<
	TValue = unknown,
>(
	element: HTMLElement,
	{
		name,
		value: defaultValue,
		callback,
		readonly,
	}: $PropConfig<TValue>
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
		}
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
