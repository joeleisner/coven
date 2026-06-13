import { test } from '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $morph } from './$morph.ts';

test('$morph creates a ResizeObserver', () => {
	const el = document.createElement('div');
	const obs = $morph(el, { callback: () => {} });
	assert(obs instanceof ResizeObserver);
});

test('$morph.observers(element) returns the set of observers', () => {
	const el = document.createElement('div');
	const obs = $morph(el, { callback: () => {} });
	const set = $morph.observers(el);
	assert(set?.has(obs));
});

test('$morph.disconnect(element) disconnects all observers', () => {
	const el = document.createElement('div');
	const obs = $morph(el, { callback: () => {} });
	let disconnected = false;
	const orig = obs.disconnect.bind(obs);
	obs.disconnect = () => {
		disconnected = true;
		orig();
	};
	$morph.disconnect(el);
	assert(disconnected);
	assertEquals($morph.observers(el), undefined);
});
