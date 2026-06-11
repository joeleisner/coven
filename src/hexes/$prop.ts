import { $assert } from "../charms/$assert.ts";
import type { SignalElement } from "../elements.d.ts";
import { grimoire } from "../mod.ts";

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
	element: SignalElement,
	{
		name,
		value: defaultValue,
		callback,
		readonly,
	}: $PropConfig<TValue>
): TValue {
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

	element.signal?.addEventListener('abort', () => {
		delete store.props?.[name];
	});

	return entry.value as TValue;
}

export default $prop;
