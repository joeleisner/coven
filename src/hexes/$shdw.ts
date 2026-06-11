import { $template } from "../charms/$template.ts";

/**
 * Attaches a shadow DOM to the given component if it doesn't already exist, and populates it with the content of the provided template.
 *
 * @param component - The component to which the shadow DOM will be attached.
 * @param html - The HTML template whose content will be cloned into the shadow DOM.
 * @returns The attached shadow root of the component.
 */
export function $shdw(
	component: HTMLElement,
	html?: HTMLTemplateElement | string
): ShadowRoot {
	if (typeof html === 'string')
		html = $template(html);

	if (!component.shadowRoot) {
		component.attachShadow({ mode: 'open' });

		if (html) {
			component.shadowRoot!.appendChild(
				html.content.cloneNode(true)
			);
		}
	}

	return component.shadowRoot!;
}

export default $shdw;
