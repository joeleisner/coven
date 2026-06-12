import { test } from '../_test/setup.ts';
import { assertEquals } from '@std/assert';
import { $emit } from './$emit.ts';

test('$emit dispatches an event named for the tag', () => {
	class T extends HTMLElement {}
	customElements.define('coven-emit-1', T);
	const el = document.createElement('coven-emit-1');
	let type = '';
	el.addEventListener('coven-emit-1', (e) => { type = e.type; });
	$emit(el);
	assertEquals(type, 'coven-emit-1');
});

test('$emit dispatches a CustomEvent when detail is provided', () => {
	class T extends HTMLElement {}
	customElements.define('coven-emit-2', T);
	const el = document.createElement('coven-emit-2');
	let detail: unknown;
	el.addEventListener('coven-emit-2', (e) => {
		detail = (e as CustomEvent).detail;
	});
	$emit(el, { detail: { value: 42 } });
	assertEquals(detail, { value: 42 });
});
