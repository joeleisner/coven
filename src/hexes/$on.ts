/**
 * @module
 * {@link $on} (hex) — type-safe `addEventListener` with automatic signal
 * wiring. Sources its {@link AbortSignal} from `$bewitch` — no `signal`
 * option is needed or accepted. Use `charms.$on` when supplying your own signal.
 */
import { $bewitch } from './$bewitch.ts';
import { $on as $onCharm, type $OnOptions } from '../charms/$on.ts';

/**
 * Type-safe `addEventListener` hex. Sources its cleanup signal from
 * `$bewitch` automatically — no `signal` option is accepted.
 * Use `charms.$on` when you need to supply your own signal.
 *
 * @param element - The element to attach the listener to.
 * @param options - Listener config: `type` and `callback` (signal is auto-wired).
 *
 * @see {@link $emit}
 *
 * @example
 * ```ts ignore
 * import { Familiar, hexes } from '@joeleisner/coven';
 *
 * class MyButton extends Familiar {
 * 	connected() {
 * 		hexes.$on(this, { type: 'click', callback: () => console.log('clicked') });
 * 	}
 * }
 * ```
 */
export function $on<
	TDetail extends unknown | never = never,
	TEvent = [TDetail] extends [never] ? Event : CustomEvent<TDetail>,
>(
	element: HTMLElement,
	options: Omit<$OnOptions<TDetail, TEvent>, 'signal'>,
): void {
	const signal = $bewitch(element);
	$onCharm(element, { ...options, signal });
}

export default $on;
