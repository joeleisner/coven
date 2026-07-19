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

test('$shdw charm promotes an orphaned declarative shadow template (open mode)', () => {
	const el = document.createElement('div');
	const template = document.createElement('template');
	template.setAttribute('shadowrootmode', 'open');
	template.innerHTML = '<button>click</button>';
	el.appendChild(template);

	const root = $shdw(el);
	assert(root instanceof ShadowRoot);
	assertEquals(root.mode, 'open');
	assertEquals(root.querySelector('button')?.textContent, 'click');
	assertEquals(
		el.querySelector('template'),
		null,
		'the declarative template should be removed after promotion',
	);
});

test('$shdw charm promotes a closed-mode declarative shadow template', () => {
	const el = document.createElement('div');
	const template = document.createElement('template');
	template.setAttribute('shadowrootmode', 'closed');
	template.innerHTML = '<i>hidden</i>';
	el.appendChild(template);

	const root = $shdw(el);
	assertEquals(root.mode, 'closed');
	assertEquals(root.querySelector('i')?.textContent, 'hidden');
	assertEquals(
		el.shadowRoot,
		null,
		'closed shadow roots are not exposed via the public getter',
	);
});

test("$shdw charm falls back to today's behavior when there is no declarative template", () => {
	const el = document.createElement('div');
	const root = $shdw(el, '<span>x</span>');
	assertEquals(root.mode, 'open');
	assertEquals(root.querySelector('span')?.textContent, 'x');
});

test('$shdw charm prefers an explicit html argument over a leftover declarative template', () => {
	const el = document.createElement('div');
	const template = document.createElement('template');
	template.setAttribute('shadowrootmode', 'open');
	template.innerHTML = '<button>from template</button>';
	el.appendChild(template);

	const root = $shdw(el, '<span>from html arg</span>');
	assertEquals(root.querySelector('span')?.textContent, 'from html arg');
});
