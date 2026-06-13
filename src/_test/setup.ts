import { Window } from 'happy-dom';

const window = new Window();

const globals = [
	'document',
	'HTMLElement',
	'HTMLTemplateElement',
	'customElements',
	'MutationObserver',
	'IntersectionObserver',
	'ResizeObserver',
	'Event',
	'CustomEvent',
	'Node',
	'NodeList',
	'ShadowRoot',
	'DocumentFragment',
	'Element',
] as const;

for (const name of globals) {
	// deno-lint-ignore no-explicit-any
	(globalThis as any)[name] ??= (window as any)[name];
}

/**
 * Project-local Deno.test wrapper. Disables per-test op/resource
 * sanitization because happy-dom keeps an internal async task manager
 * that the sanitizer flags as a "leaked timer." We tolerate this
 * because the tests run in a single shared DOM and don't need
 * per-test resource hygiene.
 */
export function test(name: string, fn: () => void | Promise<void>): void {
	Deno.test({
		name,
		fn,
		sanitizeOps: false,
		sanitizeResources: false,
	});
}
