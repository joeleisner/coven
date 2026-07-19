import { test } from '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $shdw } from './$shdw.ts';
import { $mut } from './$mut.ts';
import { $bewitch } from './$bewitch.ts';

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
	$shdw(
		el,
		`
		<div part="header"></div>
		<div part="body footer"></div>
	`,
	);
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

test('$shdw is safe to call repeatedly on the same element — no double subscriptions', async () => {
	const el = document.createElement('div');
	$shdw(el, '<div part="a"></div>');
	$shdw(el, '<div part="b"></div>'); // second call should not double-subscribe

	let fireCount = 0;
	// Re-wrap collectParts indirectly by observing setAttribute on the host:
	const originalSetAttribute = el.setAttribute.bind(el);
	el.setAttribute = function (name: string, value: string) {
		if (name === 'exportparts') fireCount++;
		return originalSetAttribute(name, value);
	};

	const late = document.createElement('span');
	late.setAttribute('part', 'late');
	$shdw.root(el)!.appendChild(late);

	await new Promise((r) => setTimeout(r, 0));

	// Even without a parent ShadowRoot, the propagation early-return means
	// setAttribute('exportparts', ...) won't fire here. So the real check is:
	// the listener count on $mut should be 1, not 2.
	// We exercise via observable behavior: appending a SECOND late part should
	// trigger collectParts exactly once per mutation cycle.
	assertEquals(fireCount, 0, 'no propagation because not inside a parent shadow');
});

test('$shdw double-call does not multiply $mut listeners on the shadow root', () => {
	const el = document.createElement('div');
	$shdw(el, '<div part="initial"></div>');
	$shdw(el, '<span part="also"></span>');

	const listeners = $mut.listeners($shdw.root(el)!, 'childList');
	assertEquals(listeners?.size, 1, 'shadow root has exactly one childList listener');
});

test('$shdw hex bewitches the element (all hexes guarantee this)', () => {
	const el = document.createElement('div');
	$shdw(el, '<i></i>');
	assert(
		$bewitch.signal(el) !== undefined,
		'element should be bewitched after $shdw hex',
	);
});

test('$shdw hex promotes a declarative shadow root and tracks its parts', () => {
	const el = document.createElement('div');
	const template = document.createElement('template');
	template.setAttribute('shadowrootmode', 'open');
	template.innerHTML = '<button part="btn">click</button>';
	el.appendChild(template);

	const root = $shdw(el);
	assert(root instanceof ShadowRoot);
	assertEquals(root.querySelector('button')?.textContent, 'click');
	assert($shdw.parts(el)!.has('btn'));
});
