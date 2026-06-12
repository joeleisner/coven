/**
 * Defines a custom element for the given html element constructor if
 * it doesn't already exist. Safe to call more than once with the same
 * tag name; subsequent calls are no-ops.
 *
 * @param name - The custom tag name to associate with the html element constructor.
 * @param constructor - The html element constructor to define as a custom element.
 *
 * @example
 * ```ts ignore
 * import { Familiar, $define } from '@joeleisner/coven';
 *
 * class MyEl extends Familiar {}
 * $define('my-el', MyEl);
 * ```
 */
export function $define(
	name: string,
	constructor: typeof HTMLElement,
): void {
	if (!customElements.get(name)) {
		customElements.define(name, constructor as unknown as CustomElementConstructor);
	}
}

export default $define;
