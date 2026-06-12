import { test } from '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $define } from './$define.ts';

test('$define registers a custom element', () => {
	class T extends HTMLElement {}
	$define('coven-def-1', T);
	assertEquals(customElements.get('coven-def-1'), T);
});

test('$define is idempotent', () => {
	class T extends HTMLElement {}
	$define('coven-def-2', T);
	$define('coven-def-2', T);
	assert(true);
});
