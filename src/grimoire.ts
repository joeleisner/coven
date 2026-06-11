const GRIMOIRE_SYMBOL = Symbol('grimoire');

type Grimoire = {
	[key: symbol]: Record<string, unknown>;
};

type GrimoireCarrier = {
	[GRIMOIRE_SYMBOL]?: Grimoire;
};

export type GrimoireElement = Node & GrimoireCarrier;

function readSlot<TInterface extends Record<string, unknown>>(
	carrier: GrimoireCarrier,
	type: symbol,
): TInterface {
	carrier[GRIMOIRE_SYMBOL] ??= {};
	carrier[GRIMOIRE_SYMBOL]![type] ??= {};
	return carrier[GRIMOIRE_SYMBOL]![type] as TInterface;
}

export function grimoire(element: GrimoireElement): Grimoire;
export function grimoire<TInterface extends Record<string, unknown>>(
	element: GrimoireElement,
	type: symbol,
): TInterface;
export function grimoire<TInterface extends Record<string, unknown>>(
	element: GrimoireElement,
	type?: symbol,
): Grimoire | TInterface {
	element[GRIMOIRE_SYMBOL] ??= {};
	if (!type) return element[GRIMOIRE_SYMBOL]!;
	return readSlot<TInterface>(element, type);
}

grimoire.shared = <TInterface extends Record<string, unknown>>(
	element: GrimoireElement,
	type: symbol,
): TInterface =>
	readSlot<TInterface>(
		element.constructor as unknown as GrimoireCarrier,
		type,
	);
