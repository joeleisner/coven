/**
 * @module
 * {@link $soul} — full connected/disconnected lifecycle for plain elements.
 * Wraps `$bewitch` and `$wake` to deliver the same lifecycle as
 * {@link Familiar} to any `HTMLElement`.
 */
import { $bewitch } from './$bewitch.ts';
import { $wake } from '../charms/$wake.ts';
import { grimoire, type GrimoireElement } from '../grimoire.ts';

/** @advanced Direct access to $soul's grimoire slot. */
export const $SOUL_GRIMOIRE_SYMBOL = Symbol('$soul');

type $SoulGrimoire = {
	bound?: boolean;
};

/** Lifecycle callbacks accepted by {@link $soul}. */
export type $SoulOptions = {
	/**
	 * Called when the element is connected (or reconnected) to the DOM,
	 * deferred to DOM-ready. Receives the current {@link AbortSignal}.
	 */
	connected?: (signal: AbortSignal) => void;
	/**
	 * Called when the element is disconnected from the DOM. The signal is
	 * already aborted by the time this runs.
	 */
	disconnected?: () => void;
};

/**
 * Manages the full connected/disconnected lifecycle of a plain element.
 * Calls $bewitch on entry, then defers the connected callback to DOM-ready via $wake.
 * On reconnection (when signal is aborted), renews the signal via $bewitch.renew.
 *
 * @param element - The element to bind lifecycle to.
 * @param options - Lifecycle callbacks.
 * @returns Nothing.
 *
 * @example
 * ```ts ignore
 * import { hexes } from '@joeleisner/coven';
 *
 * const el = document.querySelector('div')!;
 * hexes.$soul(el, {
 *   connected: (signal) => {
 *     // runs when DOM is ready
 *   },
 *   disconnected: () => {
 *     // runs when element is removed
 *   }
 * });
 * ```
 */
export function $soul(
	element: HTMLElement,
	{ connected, disconnected }: $SoulOptions,
): void {
	const existing = $bewitch.signal(element);
	const signal = existing?.aborted ? $bewitch.renew(element) : $bewitch(element);

	const store = grimoire<$SoulGrimoire>(
		element as GrimoireElement,
		$SOUL_GRIMOIRE_SYMBOL,
	);
	store.bound = true;

	$wake(element, () => {
		connected?.(signal);
		if (disconnected) {
			signal.addEventListener('abort', disconnected, { once: true });
		}
	}, signal);
}

export default $soul;
