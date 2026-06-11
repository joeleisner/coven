import { test } from '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $template } from './$template.ts';

test('$template returns an HTMLTemplateElement with the given HTML', () => {
	const t = $template('<span>hi</span>');
	assert(t instanceof HTMLTemplateElement);
	assertEquals(t.content.querySelector('span')?.textContent, 'hi');
});
