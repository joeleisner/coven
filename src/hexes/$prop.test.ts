import { test } from '../_test/setup.ts';
import { assertEquals, assertThrows } from '@std/assert';
import { $prop } from './$prop.ts';

test('$prop defines a get/set property', () => {
	const el = document.createElement('div');
	$prop(el, { name: 'value', value: 'initial' });
	// deno-lint-ignore no-explicit-any
	assertEquals((el as any).value, 'initial');
	// deno-lint-ignore no-explicit-any
	(el as any).value = 'next';
	// deno-lint-ignore no-explicit-any
	assertEquals((el as any).value, 'next');
});

test('$prop callback fires on change', () => {
	const el = document.createElement('div');
	let calls = 0;
	$prop(el, {
		name: 'count',
		value: 0,
		callback: () => {
			calls++;
		},
	});
	// deno-lint-ignore no-explicit-any
	(el as any).count = 1;
	// deno-lint-ignore no-explicit-any
	(el as any).count = 2;
	assertEquals(calls, 2);
});

test('$prop readonly throws on set', () => {
	const el = document.createElement('div');
	$prop(el, { name: 'frozen', value: 'x', readonly: true });
	assertThrows(() => {
		// deno-lint-ignore no-explicit-any
		(el as any).frozen = 'y';
	});
});

test('$prop.list(element) returns bound property names', () => {
	const el = document.createElement('div');
	$prop(el, { name: 'a', value: 1 });
	$prop(el, { name: 'b', value: 2 });
	const names = $prop.list(el);
	assertEquals(new Set(names), new Set(['a', 'b']));
});

test('$prop.readonly(element, name) reflects state', () => {
	const el = document.createElement('div');
	$prop(el, { name: 'rw', value: 1 });
	$prop(el, { name: 'ro', value: 2, readonly: true });
	assertEquals($prop.readonly(el, 'rw'), false);
	assertEquals($prop.readonly(el, 'ro'), true);
});
