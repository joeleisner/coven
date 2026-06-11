import { test } from '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $shdw } from './$shdw.ts';

test('$shdw attaches a shadow root and populates it', () => {
	const el = document.createElement('div');
	const root = $shdw(el, '<span part="label">x</span>');
	assert(root instanceof ShadowRoot);
	assertEquals(root.querySelector('span')?.textContent, 'x');
});

test('$shdw is idempotent on the same element', () => {
	const el = document.createElement('div');
	const a = $shdw(el, '<span>1</span>');
	const b = $shdw(el, '<span>2</span>');
	assertEquals(a, b);
});

test('$shdw.parts(element) returns tracked [part] values', () => {
	const el = document.createElement('div');
	$shdw(el, `
		<div part="header"></div>
		<div part="body footer"></div>
	`);
	const parts = $shdw.parts(el)!;
	assert(parts.has('header'));
	assert(parts.has('body'));
	assert(parts.has('footer'));
});

test('$shdw.root(element) returns the shadow root', () => {
	const el = document.createElement('div');
	const root = $shdw(el, '<i></i>');
	assertEquals($shdw.root(el), root);
});

test('$shdw collects late-added [part] values via internal $mut', async () => {
	const el = document.createElement('div');
	$shdw(el, '<div part="initial"></div>');
	const later = document.createElement('span');
	later.setAttribute('part', 'late');
	$shdw.root(el)!.appendChild(later);
	await new Promise((r) => setTimeout(r, 0));
	const parts = $shdw.parts(el)!;
	assert(parts.has('late'), `expected 'late' in ${[...parts].join(',')}`);
});

test('$shdw auto-sets exportparts on a child host nested inside a parent shadow', async () => {
	const host = document.createElement('div');
	$shdw(host, '<slot></slot>');

	const child = document.createElement('div');
	$shdw(child, '<i part="inner"></i>');
	host.shadowRoot!.appendChild(child);

	await new Promise((r) => setTimeout(r, 0));

	const exported = child.getAttribute('exportparts') ?? '';
	assert(exported.includes('inner'), `exportparts="${exported}"`);
});

test('$shdw.propagate(element) manually triggers propagation', () => {
	const host = document.createElement('div');
	$shdw(host, '<slot></slot>');

	const child = document.createElement('div');
	$shdw(child, '<i part="manual"></i>');
	host.shadowRoot!.appendChild(child);
	child.removeAttribute('exportparts');

	$shdw.propagate(child);
	const exported = child.getAttribute('exportparts') ?? '';
	assert(exported.includes('manual'), `exportparts="${exported}"`);
});
