import { test } from '../_test/setup.ts';
import { assert, assertEquals, assertNotStrictEquals } from '@std/assert';
import { $soul } from './$soul.ts';
import { $bewitch } from './$bewitch.ts';
import { grimoire, type GrimoireElement } from '../grimoire.ts';

test('$soul hex bewitches the element', () => {
	const el = document.createElement('div');
	$soul(el, { connected: () => {} });
	assert($bewitch.signal(el) !== undefined);
});

test('$soul hex runs connected callback immediately (DOM ready in test env)', () => {
	const el = document.createElement('div');
	let ran = false;
	$soul(el, {
		connected: () => { ran = true; },
	});
	assertEquals(ran, true);
});

test('$soul hex passes the element signal to the connected callback', () => {
	const el = document.createElement('div');
	let received: AbortSignal | undefined;
	$soul(el, {
		connected: (signal) => { received = signal; },
	});
	assert(received instanceof AbortSignal);
	assertEquals(received, $bewitch.signal(el));
});

test('$soul hex fires disconnected when the signal aborts', () => {
	const el = document.createElement('div');
	let disconnected = false;
	$soul(el, {
		connected: () => {},
		disconnected: () => { disconnected = true; },
	});
	$bewitch.abort(el);
	assertEquals(disconnected, true);
});

test('$soul hex renews the signal on reconnection', () => {
	const el = document.createElement('div');
	$soul(el, { connected: () => {} });
	const first = $bewitch.signal(el)!;
	$bewitch.abort(el);
	assert(first.aborted);

	$soul(el, { connected: () => {} });
	const second = $bewitch.signal(el)!;
	assert(!second.aborted, 'renewed signal should be live');
	assertNotStrictEquals(first, second, 'should be a different signal object');
});

test('$soul hex writes a grimoire slot', () => {
	const el = document.createElement('div');
	$soul(el, { connected: () => {} });
	const symbols = Object.getOwnPropertySymbols(grimoire(el as GrimoireElement));
	assert(
		symbols.some((s) => s.description === '$soul'),
		`expected $soul slot; got ${symbols.map((s) => s.description).join(', ')}`,
	);
});
