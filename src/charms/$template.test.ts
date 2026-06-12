import { test } from '../_test/setup.ts';
import { assertEquals, assertNotStrictEquals } from '@std/assert';
import { $template } from './$template.ts';

test('$template charm creates an HTMLTemplateElement from an HTML string', () => {
	const t = $template('<span>hi</span>');
	assertEquals(t instanceof HTMLTemplateElement, true);
	assertEquals(t.content.querySelector('span')?.textContent, 'hi');
});

test('$template charm returns a fresh element on each call (no caching)', () => {
	const a = $template('<i>x</i>');
	const b = $template('<i>x</i>');
	assertNotStrictEquals(a, b);
});

test('$template charm sets innerHTML from the provided string', () => {
	const t = $template('<section><p>nested</p></section>');
	assertEquals(t.content.querySelector('section p')?.textContent, 'nested');
});
