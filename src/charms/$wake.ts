/**
 * Runs a callback immediately if the DOM is already ready, or defers it
 * to `DOMContentLoaded`. Accepts an optional signal to cancel the deferred
 * listener if the element is removed before the DOM finishes loading.
 *
 * Stateless; writes nothing to the grimoire. Used internally by the
 * `$soul` hex.
 *
 * @param element - The element this wake-up is associated with (unused internally; present for charm convention).
 * @param callback - The function to run when the DOM is ready.
 * @param signal - Optional AbortSignal to cancel the deferred DOMContentLoaded listener.
 *
 * @see {@link $soul}
 *
 * @example
 * ```ts ignore
 * import { charms } from '@joeleisner/coven';
 *
 * charms.$wake(el, () => {
 * 	// runs when DOM is ready
 * });
 * ```
 */
export function $wake(
	_element: EventTarget,
	callback: () => void,
	signal?: AbortSignal,
): void {
	if (document.readyState !== 'loading') {
		callback();
	} else {
		document.addEventListener('DOMContentLoaded', callback, { once: true, signal });
	}
}

export default $wake;
