import { Window } from 'happy-dom';

const window = new Window();

const globals = [
	'document',
	'HTMLElement',
	'HTMLTemplateElement',
	'customElements',
	'MutationObserver',
	'IntersectionObserver',
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
