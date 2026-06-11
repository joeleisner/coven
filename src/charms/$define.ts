/**
 * Defines a custom element for the given html element constructor if it doesn't already exist.
 *
 * @param name - The custom tag name to associate with the html element constructor.
 * @param constructor - The html element constructor to define as a custom element.
 */
export function $define(
	name: string,
	constructor: typeof HTMLElement
): void {
	if (!customElements.get(name)) {
		customElements.define(name, constructor as unknown as CustomElementConstructor);
	}
};

export default $define;
