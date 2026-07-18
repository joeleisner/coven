import { test } from '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $attr } from './$attr.ts';
import { grimoire, type GrimoireElement } from '../grimoire.ts';

test('$attr binds property to attribute', () => {
	const el = document.createElement('div');
	$attr(el, { name: 'data-flag', value: false });
	// deno-lint-ignore no-explicit-any
	(el as any)['data-flag'] = true;
	assertEquals(el.getAttribute('data-flag'), '');
});

test('$attr.list(element) returns names of bound attributes', () => {
	const el = document.createElement('div');
	$attr(el, { name: 'one', value: '' });
	$attr(el, { name: 'two', value: '' });
	assertEquals(new Set($attr.list(el)), new Set(['one', 'two']));
});

test('$attr writes an audit slot to the grimoire', () => {
	const el = document.createElement('div');
	$attr(el, { name: 'audited', value: '' });
	const symbols = Object.getOwnPropertySymbols(grimoire(el as GrimoireElement));
	const found = symbols.some((s) => s.description === '$attr');
	assert(found, 'expected a $attr grimoire slot');
});

test('$attr accepts an SVGElement target (Element widening)', () => {
	const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	$attr(el, { name: 'data-flag', value: false });
	// deno-lint-ignore no-explicit-any
	(el as any)['data-flag'] = true;
	assertEquals(el.getAttribute('data-flag'), '');
});
