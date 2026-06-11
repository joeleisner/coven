import { $template } from "./$template.ts";
import { $mut } from "./$mut.ts";
import { grimoire, type GrimoireElement } from "../grimoire.ts";

const $SHDW_GRIMOIRE_SYMBOL = Symbol('$shdw');

type $ShdwGrimoire = {
	parts?: Set<string>;
};

function collectParts(root: ParentNode, into: Set<string>): void {
	for (const node of root.querySelectorAll('[part]')) {
		const raw = node.getAttribute('part') ?? '';
		for (const token of raw.split(/\s+/)) {
			if (token) into.add(token);
		}
	}
}

/**
 * Attaches a shadow root to the element (idempotent), populates it
 * with the given HTML, and tracks every [part] attribute value inside
 * so the parts set can be inspected via $shdw.parts(element). New
 * children with [part] added later are tracked automatically through
 * an internal $mut subscription on the shadow root.
 *
 * @param component - The element to attach the shadow root to.
 * @param html - Optional HTML to populate the shadow with.
 * @returns The shadow root.
 */
export function $shdw(
	component: HTMLElement,
	html?: HTMLTemplateElement | string,
): ShadowRoot {
	if (typeof html === 'string') html = $template(component, html);

	if (!component.shadowRoot) {
		component.attachShadow({ mode: 'open' });
		if (html) {
			component.shadowRoot!.appendChild(html.content.cloneNode(true));
		}
	}

	const store = grimoire<$ShdwGrimoire>(
		component as GrimoireElement,
		$SHDW_GRIMOIRE_SYMBOL,
	);
	store.parts ??= new Set();
	collectParts(component.shadowRoot!, store.parts);

	// Stay in sync with late-added [part] values inside the shadow.
	$mut(component.shadowRoot!, {
		type: 'childList',
		subtree: true,
		callback: () => {
			collectParts(component.shadowRoot!, store.parts!);
		},
	});

	return component.shadowRoot!;
}

/**
 * Returns the readonly set of tracked [part] values.
 *
 * @param element - The host element.
 * @returns The set of tracked parts, or undefined if $shdw has not run on this element.
 */
$shdw.parts = (element: HTMLElement): ReadonlySet<string> | undefined =>
	grimoire<$ShdwGrimoire>(
		element as GrimoireElement,
		$SHDW_GRIMOIRE_SYMBOL,
	).parts;

/**
 * Returns the element's shadow root, or null if none is attached.
 *
 * @param element - The host element.
 * @returns The shadow root.
 */
$shdw.root = (element: HTMLElement): ShadowRoot | null =>
	element.shadowRoot;

export default $shdw;
