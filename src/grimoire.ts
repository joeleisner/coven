const GRIMOIRE_SYMBOL = Symbol('grimoire');

type Grimoire = {
	[key: symbol]: Record<string, unknown>;
}

export type GrimoireElement = HTMLElement & {
	[GRIMOIRE_SYMBOL]?: Grimoire;
};

export function grimoire(
	element: GrimoireElement
): Grimoire;
export function grimoire<
	TInterface extends Record<string, unknown>,
>(
	element: GrimoireElement,
	type: symbol
): TInterface;
export function grimoire<
	TInterface extends Record<string, unknown>,
>(
	element: GrimoireElement,
	type?: symbol,
): Grimoire | TInterface {
	element[GRIMOIRE_SYMBOL] ??= {};
	
	if (!type)
		return element[GRIMOIRE_SYMBOL];

	element[GRIMOIRE_SYMBOL][type] ??= {};
	
	return element[GRIMOIRE_SYMBOL][type] as TInterface;
}
