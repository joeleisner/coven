import { test } from '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $on } from './$on.ts';
import { $bewitch } from './$bewitch.ts';
import { grimoire, type GrimoireElement } from '../grimoire.ts';

test('$on hex registers a listener on the element', () => {
	const el = document.createElement('div');
	let count = 0;
	$on(el, {
		type: 'click',
		callback: () => {
			count++;
		},
	});
	el.dispatchEvent(new Event('click'));
	assertEquals(count, 1);
});

test('$on hex bewitches the element', () => {
	const el = document.createElement('div');
	$on(el, { type: 'click', callback: () => {} });
	assert(
		$bewitch.signal(el) !== undefined,
		'element should be bewitched after hex $on',
	);
});

test('$on hex forwards the element signal to addEventListener', () => {
	// happy-dom v15 does not honor AbortSignal in addEventListener options,
	// so we spy to confirm the signal is forwarded rather than testing cleanup.
	const el = document.createElement('div');
	let capturedOptions: AddEventListenerOptions | undefined;
	const original = el.addEventListener.bind(el);
	el.addEventListener = (
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions,
	): void => {
		capturedOptions = options as AddEventListenerOptions;
		return original(type, listener, options);
	};

	$on(el, { type: 'click', callback: () => {} });
	const signal = $bewitch.signal(el);
	assertEquals(capturedOptions?.signal, signal);
});

test('$on hex does not write its own grimoire slot', () => {
	const el = document.createElement('div');
	$on(el, { type: 'click', callback: () => {} });
	const symbols = Object.getOwnPropertySymbols(grimoire(el as GrimoireElement));
	assert(
		!symbols.some((s) => s.description === '$on'),
		`expected no $on slot; got ${symbols.map((s) => s.description).join(', ')}`,
	);
});

test('$on hex accepts window as a target (EventTarget widening)', () => {
	let count = 0;
	$on(window, {
		type: 'coven-test-window-event',
		callback: () => {
			count++;
		},
	});
	window.dispatchEvent(new Event('coven-test-window-event'));
	assertEquals(count, 1);
});
