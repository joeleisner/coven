/**
 * @module
 * {@link $template} — class-shared cached `<template>` factory. Parses an
 * HTML string once per element class and reuses the element across all
 * instances. The hex counterpart to the bare `charms.$template`.
 */
import { $template as $templateCharm } from '../charms/$template.ts';
import { $bewitch } from './$bewitch.ts';
import { grimoire, type GrimoireElement } from '../grimoire.ts';

/**
 * Direct access to $template's grimoire slot. Identifies the per-class state
 * bucket used internally by {@link $template}.
 * @advanced
 */
export const $TEMPLATE_GRIMOIRE_SYMBOL = Symbol('$template');

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
	$bewitch(element);

	const store = grimoire.shared<$TemplateGrimoire>(
		element as GrimoireElement,
		$TEMPLATE_GRIMOIRE_SYMBOL,
	);
	store.templates ??= new Map();

	let template = store.templates.get(html);
	if (!template) {
		template = $templateCharm(html);
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
