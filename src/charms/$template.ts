/**
 * Creates a fresh `HTMLTemplateElement` from an HTML string. No caching;
 * each call returns a new element. For a cached, class-shared template,
 * use the hex version via `hexes.$template`.
 *
 * @param html - The HTML string to parse.
 * @returns A new HTMLTemplateElement.
 *
 * @see {@link $shdw}
 *
 * @example
 * ```ts ignore
 * import { charms } from '@joeleisner/coven';
 *
 * const tpl = charms.$template('<span>hi</span>');
 * document.body.appendChild(tpl.content.cloneNode(true));
 * ```
 */
export function $template(html: string): HTMLTemplateElement {
	const template = document.createElement('template');
	template.innerHTML = html;
	return template;
}

export default $template;
