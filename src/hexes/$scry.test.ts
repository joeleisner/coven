import { test } from '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $scry } from './$scry.ts';

test('$scry creates an IntersectionObserver', () => {
	const el = document.createElement('div');
	const obs = $scry(el, { callback: () => {} });
	assert(obs instanceof IntersectionObserver);
});

test('$scry.observers(element) returns the set of observers', () => {
	const el = document.createElement('div');
	const obs = $scry(el, { callback: () => {} });
	const set = $scry.observers(el);
	assert(set?.has(obs));
});

test('$scry.disconnect(element) disconnects all observers', () => {
	const el = document.createElement('div');
	const obs = $scry(el, { callback: () => {} });
	let disconnected = false;
	const orig = obs.disconnect.bind(obs);
	obs.disconnect = () => { disconnected = true; orig(); };
	$scry.disconnect(el);
	assert(disconnected);
	assertEquals($scry.observers(el)?.size, 0);
});
