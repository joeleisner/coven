import { $shdw as $shdwCharm } from '../charms/$shdw.ts';
import { $bewitch } from './$bewitch.ts';
import { $template } from './$template.ts';
import { $mut } from './$mut.ts';
import { grimoire, type GrimoireElement } from '../grimoire.ts';

/** @advanced Direct access to $shdw's grimoire slot. */
export const $SHDW_GRIMOIRE_SYMBOL = Symbol('$shdw');

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
 *
 * @see {@link $template}
 *
 * @example
 * ```ts ignore
 * import { Familiar, $shdw } from '@joeleisner/coven';
 *
 * class MyEl extends Familiar {
 * 	setup() {
 * 		$shdw(this, `<button part="btn">click</button>`);
 * 	}
 * }
 * ```
 */
export function $shdw(
	component: HTMLElement,
	html?: HTMLTemplateElement | string,
): ShadowRoot {
	$bewitch(component);

	if (typeof html === 'string') html = $template(component, html);

	const store = grimoire<$ShdwGrimoire>(
		component as GrimoireElement,
		$SHDW_GRIMOIRE_SYMBOL,
	);
	store.parts ??= new Set();

	const firstCall = !component.shadowRoot;

	$shdwCharm(component, html);

	collectParts(component.shadowRoot!, store.parts);

	if (firstCall) {
		// Stay in sync with late-added [part] values inside the shadow.
		$mut(component.shadowRoot!, {
			type: 'childList',
			subtree: true,
			callback: () => {
				collectParts(component.shadowRoot!, store.parts!);
				propagate(component);
			},
		});

		queueMicrotask(() => propagate(component));
	}

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
$shdw.root = (element: HTMLElement): ShadowRoot | null => element.shadowRoot;

/**
 * Re-run exportparts propagation manually. Useful when shadow
 * contents change outside the internal $mut subscription's view.
 *
 * @param element - The host element whose parts should be merged into its parent shadow host.
 */
$shdw.propagate = (element: HTMLElement): void => propagate(element);

function propagate(element: HTMLElement): void {
	const parts = grimoire<$ShdwGrimoire>(
		element as GrimoireElement,
		$SHDW_GRIMOIRE_SYMBOL,
	).parts;
	if (!parts || !parts.size) return;

	// Walk up to find the enclosing root. We avoid getRootNode() because
	// some DOM implementations (e.g. happy-dom) don't traverse the
	// parentNode chain through shadow boundaries the way the spec requires.
	let node: Node | null = element.parentNode;
	while (node && !(node instanceof ShadowRoot)) {
		node = node.parentNode;
	}
	if (!node) return;

	const existing = (element.getAttribute('exportparts') ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	const merged = new Set<string>([...existing, ...parts]);
	element.setAttribute('exportparts', [...merged].join(', '));
}

export default $shdw;
