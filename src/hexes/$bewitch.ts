/**
 * @module
 * {@link $bewitch} — binds an {@link AbortSignal} to any {@link EventTarget},
 * making it ready for hexes. The foundation every other hex builds on. Also
 * exposes `.signal`, `.abort`, and `.renew` for lifecycle control.
 */
import { grimoire, type GrimoireElement } from '../grimoire.ts';

const $BEWITCH_GRIMOIRE_SYMBOL = Symbol('$bewitch');

type $BewitchGrimoire = {
	controller?: AbortController;
	signal?: AbortSignal;
};

/**
 * Casts Coven's spell on a target, binding an AbortSignal to it so any
 * hex applied later can register cleanup. Idempotent — a second call
 * returns the same signal.
 *
 * Pass an existing signal to adopt it (the target is bewitched but
 * $bewitch does not own the lifecycle). Without an argument, $bewitch
 * creates and owns an AbortController.
 *
 * Accepts any `EventTarget` — elements, shadow roots, text nodes, the
 * document, the window, or any other object that implements
 * `EventTarget`. Most callers pass an `HTMLElement`, which still
 * satisfies `EventTarget`.
 *
 * @param node - The target to bewitch.
 * @param signal - Optional external signal to adopt.
 * @returns The target's signal.
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
	node: EventTarget,
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
 * Returns the current signal bound to the target, or undefined if not
 * yet bewitched. Read-only; does not trigger bewitching.
 *
 * @param node - The target to inspect.
 * @returns The target's signal, or undefined.
 */
$bewitch.signal = (node: EventTarget): AbortSignal | undefined =>
	grimoire<$BewitchGrimoire>(
		node as GrimoireElement,
		$BEWITCH_GRIMOIRE_SYMBOL,
	).signal;

/**
 * Aborts the controller owned by $bewitch. No-op for adopted signals.
 *
 * @param node - The target whose owned signal should be aborted.
 */
$bewitch.abort = (node: EventTarget): void => {
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
 * Note: calling `.renew` on a target that was bewitched with an
 * *adopted* external signal will replace it with a freshly-owned
 * controller. The original external signal is left untouched but is
 * no longer the target's tracked signal — any hex registered after
 * the renew will live on the new owned signal, not the original one.
 *
 * @param node - The target to renew.
 * @returns The new signal.
 */
$bewitch.renew = (node: EventTarget): AbortSignal => {
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
