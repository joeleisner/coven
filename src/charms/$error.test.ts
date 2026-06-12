import { test } from '../_test/setup.ts';
import { assert } from '@std/assert';
import { $error, COVEN_ERROR_NAME } from './$error.ts';

test('$error throws a CovenError with [tagname]: prefix', () => {
	const el = document.createElement('div');
	try {
		$error(el, 'something');
	} catch (e) {
		assert((e as Error).name === COVEN_ERROR_NAME);
		assert((e as Error).message.includes('[div]:'));
	}
});
