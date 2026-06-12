import { test } from '../_test/setup.ts';
import { assert, assertEquals, assertStrictEquals } from '@std/assert';
import { $mut } from './$mut.ts';

test('$mut observes the given node when it is an element', async () => {
	const el = document.createElement('div');
	let fired = false;
	$mut(el, {
		type: 'childList',
		callback: () => { fired = true; },
	});

	el.appendChild(document.createElement('span'));
	await new Promise((r) => setTimeout(r, 0));

	assert(fired, 'expected childList observer to fire on the element');
});

test('$mut observes a non-element Node (e.g. a shadow root)', async () => {
	const host = document.createElement('div');
	host.attachShadow({ mode: 'open' });
	const root = host.shadowRoot!;

	let observedChild: Node | null = null;
	$mut(root, {
		type: 'childList',
		callback: (nodes) => {
			observedChild = nodes[0] ?? null;
		},
	});

	const span = document.createElement('span');
	root.appendChild(span);
	await new Promise((r) => setTimeout(r, 0));

	assertEquals(observedChild, span);
});

test('$mut returns the same observer on repeat calls for the same node', () => {
	const el = document.createElement('div');
	const a = $mut(el, { type: 'attributes', callback: () => {} });
	const b = $mut(el, { type: 'attributes', callback: () => {} });
	assertStrictEquals(a, b);
});

test('$mut.observer(element) returns the underlying MutationObserver', () => {
	const el = document.createElement('div');
	$mut(el, { type: 'attributes', callback: () => {} });
	assert($mut.observer(el) instanceof MutationObserver);
});

test('$mut.listeners(element, type) returns the listener Set', () => {
	const el = document.createElement('div');
	const cb = () => {};
	$mut(el, { type: 'attributes', callback: cb });
	const listeners = $mut.listeners(el, 'attributes');
	assert(listeners?.has(cb));
});
