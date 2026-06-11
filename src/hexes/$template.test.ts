import { test } from '../_test/setup.ts';
import {
	assert,
	assertEquals,
	assertNotStrictEquals,
	assertStrictEquals,
} from '@std/assert';
import { $template } from './$template.ts';

let counter = 0;
function tagName(): string {
	return `coven-tmpl-${++counter}`;
}

test('$template returns an HTMLTemplateElement with the given HTML', () => {
	class T extends HTMLElement {}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name);
	const t = $template(el, '<span>hi</span>');
	assert(t instanceof HTMLTemplateElement);
	assertEquals(t.content.querySelector('span')?.textContent, 'hi');
});

test('$template caches per constructor: same HTML returns same template across instances', () => {
	class T extends HTMLElement {}
	const name = tagName();
	customElements.define(name, T);
	const a = document.createElement(name);
	const b = document.createElement(name);
	const ta = $template(a, '<i>same</i>');
	const tb = $template(b, '<i>same</i>');
	assertStrictEquals(ta, tb);
});

test('$template stores different HTML strings as different cache entries', () => {
	class T extends HTMLElement {}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name);
	const a = $template(el, '<i>a</i>');
	const b = $template(el, '<i>b</i>');
	assertNotStrictEquals(a, b);
});

test('$template caches are isolated between classes', () => {
	class A extends HTMLElement {}
	class B extends HTMLElement {}
	const nameA = tagName();
	const nameB = tagName();
	customElements.define(nameA, A);
	customElements.define(nameB, B);
	const a = document.createElement(nameA);
	const b = document.createElement(nameB);
	const ta = $template(a, '<i>x</i>');
	const tb = $template(b, '<i>x</i>');
	assertNotStrictEquals(ta, tb);
});

test('$template.cache(element) returns the cache map', () => {
	class T extends HTMLElement {}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name);
	$template(el, '<i>cached</i>');
	const cache = $template.cache(el);
	assert(cache instanceof Map);
	assertEquals(cache!.size, 1);
});

test('$template.clone(element, html) returns a DocumentFragment', () => {
	class T extends HTMLElement {}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name);
	const frag = $template.clone(el, '<i>cloned</i>');
	// happy-dom's DocumentFragment prototype differs from the global we
	// register in setup.ts, so check by nodeType (11 = DOCUMENT_FRAGMENT_NODE).
	assertEquals(frag.nodeType, 11);
	assertEquals(frag.querySelector('i')?.textContent, 'cloned');
});
