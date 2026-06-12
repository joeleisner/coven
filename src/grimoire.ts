const GRIMOIRE_SYMBOL = Symbol('grimoire');

type Grimoire = {
	[key: symbol]: Record<string, unknown>;
};

type GrimoireCarrier = {
	[GRIMOIRE_SYMBOL]?: Grimoire;
};

/**
 * A DOM node augmented with an internal grimoire — the per-node bag
 * of state every hex uses to stash its bookkeeping.
 */
export type GrimoireElement = Node & GrimoireCarrier;

function readSlot<TInterface extends Record<string, unknown>>(
	carrier: GrimoireCarrier,
	type: symbol,
): TInterface {
	carrier[GRIMOIRE_SYMBOL] ??= {};
	carrier[GRIMOIRE_SYMBOL]![type] ??= {};
	return carrier[GRIMOIRE_SYMBOL]![type] as TInterface;
}

/**
 * Reads (and lazily initializes) the grimoire bound to a node. Each
 * hex stores its per-node state in its own slot keyed by a private
 * symbol, keeping bookkeeping isolated yet co-located on the node.
 *
 * Call with one argument to get the whole grimoire, or with a slot
 * symbol to get a typed view of a single slot. Slots are created on
 * first read so hex implementations don't need to special-case the
 * empty state.
 *
 * @param element - The node whose grimoire is read.
 * @param type - Optional slot symbol identifying one hex's slice.
 * @returns The full grimoire, or the typed slot when `type` is given.
 *
 * @example
 * ```ts ignore
 * import { grimoire } from '@joeleisner/coven';
 *
 * const SLOT = Symbol('demo');
 * type DemoSlot = { count?: number };
 *
 * const el = document.createElement('div');
 * const slot = grimoire<DemoSlot>(el, SLOT);
 * slot.count = (slot.count ?? 0) + 1;
 * ```
 */
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

/**
 * Reads a grimoire slot from the node's *constructor* rather than the
 * node itself. Useful for state that should be shared across every
 * instance of a custom-element class — for example, the template
 * cache used by `$template`.
 *
 * @param element - The element whose class owns the shared slot.
 * @param type - The slot symbol.
 * @returns The typed slot, lazily initialized.
 */
grimoire.shared = <TInterface extends Record<string, unknown>>(
	element: GrimoireElement,
	type: symbol,
): TInterface =>
	readSlot<TInterface>(
		element.constructor as unknown as GrimoireCarrier,
		type,
	);
