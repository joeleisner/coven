import { grimoire, type GrimoireElement } from '../grimoire.ts';

const $BEWITCH_GRIMOIRE_SYMBOL = Symbol('$bewitch');

type $BewitchGrimoire = {
	controller?: AbortController;
	signal?: AbortSignal;
};

/**
 * Casts Coven's spell on a node, binding an AbortSignal to it so any
 * hex applied later can register cleanup. Idempotent — a second call
 * returns the same signal.
 *
 * Pass an existing signal to adopt it (the node is bewitched but
 * $bewitch does not own the lifecycle). Without an argument, $bewitch
 * creates and owns an AbortController.
 *
 * Accepts any `Node` — elements, shadow roots, text nodes, etc. Most
 * callers pass an `HTMLElement`, which still satisfies `Node`.
 *
 * @param node - The node to bewitch.
 * @param signal - Optional external signal to adopt.
 * @returns The node's signal.
 *
 * @see {@link Familiar}
 *
 * @example
 * ```ts ignore
 * import { $bewitch, $on } from '@joeleisner/coven';
 *
 * const el = document.querySelector('button')! as HTMLElement;
 * const signal = $bewitch(el);
 * $on(el, { type: 'click', callback: () => {}, signal });
 * ```
 */
export function $bewitch(
	node: Node,
	signal?: AbortSignal,
): AbortSignal {
	const store = grimoire<$BewitchGrimoire>(
		node as GrimoireElement,
		$BEWITCH_GRIMOIRE_SYMBOL,
	);
	if (store.signal) return store.signal;

	if (signal) {
		store.signal = signal;
		return signal;
	}

	const controller = new AbortController();
	store.controller = controller;
	store.signal = controller.signal;
	return controller.signal;
}

/**
 * Returns the current signal bound to the node, or undefined if not
 * yet bewitched. Read-only; does not trigger bewitching.
 *
 * @param node - The node to inspect.
 * @returns The node's signal, or undefined.
 */
$bewitch.signal = (node: Node): AbortSignal | undefined =>
	grimoire<$BewitchGrimoire>(
		node as GrimoireElement,
		$BEWITCH_GRIMOIRE_SYMBOL,
	).signal;

/**
 * Aborts the controller owned by $bewitch. No-op for adopted signals.
 *
 * @param node - The node whose owned signal should be aborted.
 */
$bewitch.abort = (node: Node): void => {
	const store = grimoire<$BewitchGrimoire>(
		node as GrimoireElement,
		$BEWITCH_GRIMOIRE_SYMBOL,
	);
	store.controller?.abort();
};

/**
 * Aborts the current owned controller (if any) and creates a fresh
 * one. Returns the new signal. Used by Familiar on reconnection.
 *
 * Note: calling `.renew` on a node that was bewitched with an
 * *adopted* external signal will replace it with a freshly-owned
 * controller. The original external signal is left untouched but is
 * no longer the node's tracked signal — any hex registered after
 * the renew will live on the new owned signal, not the original one.
 *
 * @param node - The node to renew.
 * @returns The new signal.
 */
$bewitch.renew = (node: Node): AbortSignal => {
	const store = grimoire<$BewitchGrimoire>(
		node as GrimoireElement,
		$BEWITCH_GRIMOIRE_SYMBOL,
	);
	store.controller?.abort();
	const controller = new AbortController();
	store.controller = controller;
	store.signal = controller.signal;
	return controller.signal;
};

export default $bewitch;
