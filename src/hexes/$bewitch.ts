import { grimoire, type GrimoireElement } from '../grimoire.ts';

const $BEWITCH_GRIMOIRE_SYMBOL = Symbol('$bewitch');

type $BewitchGrimoire = {
	controller?: AbortController;
	signal?: AbortSignal;
};

/**
 * Casts Coven's spell on an element, binding an AbortSignal to it so any
 * hex applied later can register cleanup. Idempotent — a second call
 * returns the same signal.
 *
 * Pass an existing signal to adopt it (the element is bewitched but
 * $bewitch does not own the lifecycle). Without an argument, $bewitch
 * creates and owns an AbortController.
 *
 * @param element - The element to bewitch.
 * @param signal - Optional external signal to adopt.
 * @returns The element's signal.
 */
export function $bewitch(
	element: HTMLElement,
	signal?: AbortSignal,
): AbortSignal {
	const store = grimoire<$BewitchGrimoire>(
		element as GrimoireElement,
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
 * Returns the current signal bound to the element, or undefined if not
 * yet bewitched. Read-only; does not trigger bewitching.
 *
 * @param element - The element to inspect.
 * @returns The element's signal, or undefined.
 */
$bewitch.signal = (element: HTMLElement): AbortSignal | undefined =>
	grimoire<$BewitchGrimoire>(
		element as GrimoireElement,
		$BEWITCH_GRIMOIRE_SYMBOL,
	).signal;

/**
 * Aborts the controller owned by $bewitch. No-op for adopted signals.
 *
 * @param element - The element whose owned signal should be aborted.
 */
$bewitch.abort = (element: HTMLElement): void => {
	const store = grimoire<$BewitchGrimoire>(
		element as GrimoireElement,
		$BEWITCH_GRIMOIRE_SYMBOL,
	);
	store.controller?.abort();
};

/**
 * Aborts the current owned controller and creates a fresh one. Returns
 * the new signal. Used by Familiar on reconnection.
 *
 * @param element - The element to renew.
 * @returns The new signal.
 */
$bewitch.renew = (element: HTMLElement): AbortSignal => {
	const store = grimoire<$BewitchGrimoire>(
		element as GrimoireElement,
		$BEWITCH_GRIMOIRE_SYMBOL,
	);
	store.controller?.abort();
	const controller = new AbortController();
	store.controller = controller;
	store.signal = controller.signal;
	return controller.signal;
};

export default $bewitch;
