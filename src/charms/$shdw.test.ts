import { test } from '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $shdw } from './$shdw.ts';
import { grimoire, type GrimoireElement } from '../grimoire.ts';

test('$shdw charm attaches a shadow root and populates it from an HTML string', () => {
	const el = document.createElement('div');
	const root = $shdw(el, '<span>hello</span>');
	assert(root instanceof ShadowRoot);
	assertEquals(root.querySelector('span')?.textContent, 'hello');
});

test('$shdw charm accepts an HTMLTemplateElement', () => {
	const el = document.createElement('div');
	const tpl = document.createElement('template');
	tpl.innerHTML = '<b>bold</b>';
	const root = $shdw(el, tpl);
	assertEquals(root.querySelector('b')?.textContent, 'bold');
});

test('$shdw charm is idempotent — second call returns existing root without re-populating', () => {
	const el = document.createElement('div');
	const a = $shdw(el, '<span>first</span>');
	const b = $shdw(el, '<span>second</span>');
	assertEquals(a, b);
	assertEquals(a.querySelectorAll('span').length, 1);
});

test('$shdw charm does not write to the grimoire', () => {
	const el = document.createElement('div');
	$shdw(el, '<i></i>');
	const symbols = Object.getOwnPropertySymbols(grimoire(el as GrimoireElement));
	assert(
		!symbols.some((s) => s.description === '$shdw'),
		`expected no $shdw slot; got ${symbols.map((s) => s.description).join(', ')}`,
	);
});
