import { test } from './setup.ts';
import { assert, assertEquals } from '@std/assert';

test('happy-dom is installed on globalThis', () => {
	assert(typeof HTMLElement === 'function');
	assert(typeof customElements === 'object');
	assert(typeof MutationObserver === 'function');
	assert(typeof IntersectionObserver === 'function');

	const div = document.createElement('div');
	assertEquals(div.tagName, 'DIV');
});
