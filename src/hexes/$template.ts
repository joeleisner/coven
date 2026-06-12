import { grimoire, type GrimoireElement } from '../grimoire.ts';

const $TEMPLATE_GRIMOIRE_SYMBOL = Symbol('$template');

type $TemplateGrimoire = {
	templates?: Map<string, HTMLTemplateElement>;
};

/**
 * Cached <template> factory. Templates are cached on the element's
 * constructor, so every instance of the same custom-element class
 * shares one parsed template per distinct HTML string.
 *
 * @param element - The element whose class owns the cache.
 * @param html - The HTML string to parse.
 * @returns The cached HTMLTemplateElement.
 *
 * @see {@link $shdw}
 *
 * @example
 * ```ts ignore
 * import { Familiar, $template } from '@joeleisner/coven';
 *
 * class MyEl extends Familiar {
 * 	setup() {
 * 		const tpl = $template(this, `<span>hi</span>`);
 * 		this.appendChild(tpl.content.cloneNode(true));
 * 	}
 * }
 * ```
 */
export function $template(
	element: HTMLElement,
	html: string,
): HTMLTemplateElement {
	const store = grimoire.shared<$TemplateGrimoire>(
		element as GrimoireElement,
		$TEMPLATE_GRIMOIRE_SYMBOL,
	);
	store.templates ??= new Map();

	let template = store.templates.get(html);
	if (!template) {
		template = document.createElement('template');
		template.innerHTML = html;
		store.templates.set(html, template);
	}
	return template;
}

/**
 * Read the per-class template cache for an element.
 *
 * @param element - The element whose class cache should be returned.
 * @returns The cache map, or undefined if no template has been registered yet.
 */
$template.cache = (
	element: HTMLElement,
): Map<string, HTMLTemplateElement> | undefined =>
	grimoire.shared<$TemplateGrimoire>(
		element as GrimoireElement,
		$TEMPLATE_GRIMOIRE_SYMBOL,
	).templates;

/**
 * Returns a fresh cloned DocumentFragment from the cached template.
 *
 * @param element - The element whose class owns the cache.
 * @param html - The HTML string to parse.
 * @returns A cloned DocumentFragment ready to append.
 */
$template.clone = (
	element: HTMLElement,
	html: string,
): DocumentFragment => $template(element, html).content.cloneNode(true) as DocumentFragment;

export default $template;
