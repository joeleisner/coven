import { test } from '../_test/setup.ts';
import { assertThrows } from '@std/assert';
import { $assert } from './$assert.ts';

test('$assert throws on falsey', () => {
	const el = document.createElement('div');
	assertThrows(() => $assert(el, false, 'nope'));
});

test('$assert passes through truthy', () => {
	const el = document.createElement('div');
	$assert(el, true, 'fine');
});
