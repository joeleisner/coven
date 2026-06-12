/**
 * Attaches an open shadow root to the element (idempotent) and populates
 * it with the given HTML or template. Returns the shadow root.
 *
 * No grimoire writes; no parts tracking. For full parts tracking and
 * bewitch integration, use the hex version via `hexes.$shdw`.
 *
 * @param component - The element to attach the shadow root to.
 * @param html - Optional HTML string or template to populate the shadow with.
 * @returns The shadow root.
 *
 * @see {@link $template}
 *
 * @example
 * ```ts ignore
 * import { charms } from '@joeleisner/coven';
 *
 * const el = document.querySelector('my-el')! as HTMLElement;
 * charms.$shdw(el, '<button part="btn">click</button>');
 * ```
 */
export function $shdw(
	component: HTMLElement,
	html?: HTMLTemplateElement | string,
): ShadowRoot {
	if (!component.shadowRoot) {
		component.attachShadow({ mode: 'open' });
		if (html) {
			let template: HTMLTemplateElement;
			if (typeof html === 'string') {
				template = document.createElement('template');
				template.innerHTML = html;
			} else {
				template = html;
			}
			component.shadowRoot!.appendChild(template.content.cloneNode(true));
		}
	}
	return component.shadowRoot!;
}

export default $shdw;
