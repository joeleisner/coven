function findDeclarativeTemplate(component: Element): HTMLTemplateElement | null {
	for (const child of component.children) {
		if (child instanceof HTMLTemplateElement && child.hasAttribute('shadowrootmode')) {
			return child;
		}
	}
	return null;
}

/**
 * Attaches a shadow root to the element (idempotent). If the element
 * already has a real `shadowRoot`, it's returned unchanged.
 *
 * Otherwise, if a direct-child `<template shadowrootmode>` is present
 * — left un-promoted because the markup was built outside the
 * browser's streaming HTML parser (a common gotcha with client-side
 * routers, e.g. Astro's view transitions, that construct pages via
 * `DOMParser`) — it's promoted: a real shadow root is attached using
 * the template's mode (and its `shadowrootdelegatesfocus` /
 * `shadowrootclonable` / `shadowrootserializable` attributes, if
 * present), the template's content is moved in, and the template is
 * removed.
 *
 * Otherwise, a new open shadow root is attached and populated with
 * the given HTML or template, if any.
 *
 * An explicit `html` argument always takes precedence over promoting
 * a leftover declarative template.
 *
 * No grimoire writes; no parts tracking. For full parts tracking and
 * bewitch integration, use the hex version via `hexes.$shdw`.
 *
 * @param component - The element to attach the shadow root to.
 * @param html - Optional HTML string or template to populate the shadow with. Takes precedence over promoting a leftover declarative template.
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
	component: Element,
	html?: HTMLTemplateElement | string,
): ShadowRoot {
	if (component.shadowRoot) return component.shadowRoot;

	const declarative = html === undefined ? findDeclarativeTemplate(component) : null;

	if (declarative) {
		const mode = declarative.getAttribute('shadowrootmode') as ShadowRootMode;
		const shadowRoot = component.attachShadow({
			mode,
			delegatesFocus: declarative.hasAttribute('shadowrootdelegatesfocus'),
			clonable: declarative.hasAttribute('shadowrootclonable'),
			serializable: declarative.hasAttribute('shadowrootserializable'),
		});
		shadowRoot.appendChild(declarative.content.cloneNode(true));
		declarative.remove();
		return shadowRoot;
	}

	const shadowRoot = component.attachShadow({ mode: 'open' });
	if (html) {
		let template: HTMLTemplateElement;
		if (typeof html === 'string') {
			template = document.createElement('template');
			template.innerHTML = html;
		} else {
			template = html;
		}
		shadowRoot.appendChild(template.content.cloneNode(true));
	}
	return shadowRoot;
}

export default $shdw;
