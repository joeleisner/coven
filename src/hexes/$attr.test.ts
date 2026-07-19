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

test('$attr reflects the default value onto the DOM attribute when absent', () => {
	const el = document.createElement('div');
	$attr(el, { name: 'count', value: 0 });
	assertEquals(el.getAttribute('count'), '0');
});

test('$attr does not rewrite an attribute value already present in markup', () => {
	const el = document.createElement('div');
	el.setAttribute('count', '007');
	$attr(el, { name: 'count', value: 0 });
	assertEquals(el.getAttribute('count'), '007');
});

test('$attr fires the callback once at setup with (value, value) when the attribute is absent', () => {
	const el = document.createElement('div');
	const calls: Array<[unknown, unknown]> = [];
	$attr(el, {
		name: 'count',
		value: 0,
		callback: (newValue, oldValue) => {
			calls.push([newValue, oldValue]);
		},
	});
	assertEquals(calls, [[0, 0]]);
});

test('$attr fires the callback once at setup with the parsed attribute value when present', () => {
	const el = document.createElement('div');
	el.setAttribute('count', '5');
	const calls: Array<[unknown, unknown]> = [];
	$attr<number>(el, {
		name: 'count',
		value: 0,
		callback: (newValue, oldValue) => {
			calls.push([newValue, oldValue]);
		},
	});
	assertEquals(calls, [[5, 5]]);
});

test('$attr still fires the callback again on a later property change', () => {
	const el = document.createElement('div');
	const calls: Array<[unknown, unknown]> = [];
	$attr<number>(el, {
		name: 'count',
		value: 0,
		callback: (newValue, oldValue) => {
			calls.push([newValue, oldValue]);
		},
	});
	// deno-lint-ignore no-explicit-any
	(el as any).count = 1;
	assertEquals(calls, [[0, 0], [1, 0]]);
});
