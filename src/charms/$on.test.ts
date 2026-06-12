import { test } from '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $on } from './$on.ts';
import { grimoire, type GrimoireElement } from '../grimoire.ts';

test('$on binds a listener to the given element', () => {
	const el = document.createElement('div');
	let count = 0;
	$on(el, { type: 'click', callback: () => { count++; } });
	el.dispatchEvent(new Event('click'));
	assertEquals(count, 1);
});

test('$on forwards the provided signal to addEventListener', () => {
	// happy-dom v15 does not honor AbortSignal in addEventListener options
	// (the behavior was added later). To still verify $on's contract, we
	// spy on addEventListener and confirm the signal is forwarded.
	const el = document.createElement('div');
	const controller = new AbortController();
	const callback = () => {};
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

	$on(el, { type: 'click', callback, signal: controller.signal });
	assert(capturedOptions !== undefined, 'expected options to be forwarded');
	assertEquals(capturedOptions!.signal, controller.signal);
});

test('$on does not write to grimoire (it is a charm, not a hex)', () => {
	const el = document.createElement('div');
	$on(el, { type: 'click', callback: () => {} });
	const symbols = Object.getOwnPropertySymbols(grimoire(el as GrimoireElement));
	assert(
		!symbols.some((s) => s.description === '$on'),
		'expected no $on grimoire slot',
	);
});
