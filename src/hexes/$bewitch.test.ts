import { test } from '../_test/setup.ts';
import {
	assert,
	assertEquals,
	assertNotStrictEquals,
	assertStrictEquals,
} from '@std/assert';
import { $bewitch } from './$bewitch.ts';
import { grimoire, type GrimoireElement } from '../grimoire.ts';

test('$bewitch(element) creates an owned controller and returns its signal', () => {
	const el = document.createElement('div');
	const signal = $bewitch(el);
	assert(signal instanceof AbortSignal);
	assert(!signal.aborted);
});

test('$bewitch is idempotent — repeat calls return the same signal', () => {
	const el = document.createElement('div');
	const s1 = $bewitch(el);
	const s2 = $bewitch(el);
	assertStrictEquals(s1, s2);
});

test('$bewitch(element, externalSignal) adopts the signal without ownership', () => {
	const el = document.createElement('div');
	const ctrl = new AbortController();
	const signal = $bewitch(el, ctrl.signal);
	assertStrictEquals(signal, ctrl.signal);
});

test('$bewitch.signal(element) returns undefined when not yet bewitched', () => {
	const el = document.createElement('div');
	assertEquals($bewitch.signal(el), undefined);
});

test('$bewitch.signal(element) returns the current signal after bewitching', () => {
	const el = document.createElement('div');
	const signal = $bewitch(el);
	assertStrictEquals($bewitch.signal(el), signal);
});

test('$bewitch.abort(element) aborts an owned controller', () => {
	const el = document.createElement('div');
	const signal = $bewitch(el);
	$bewitch.abort(el);
	assert(signal.aborted);
});

test('$bewitch.abort(element) is a no-op for adopted signals', () => {
	const el = document.createElement('div');
	const ctrl = new AbortController();
	$bewitch(el, ctrl.signal);
	$bewitch.abort(el);
	assert(!ctrl.signal.aborted);
});

test('$bewitch.renew(element) aborts owned and creates a fresh signal', () => {
	const el = document.createElement('div');
	const first = $bewitch(el);
	const next = $bewitch.renew(el);
	assert(first.aborted);
	assertNotStrictEquals(first, next);
	assert(!next.aborted);
});

test('$bewitch records itself in the grimoire (audit log)', () => {
	const el = document.createElement('div');
	$bewitch(el);
	const symbols = Object.getOwnPropertySymbols(grimoire(el as GrimoireElement));
	assertEquals(symbols.length, 1, 'one slot: $bewitch itself');
});

test('passing a new external signal after bewitching does not replace the original', () => {
	const el = document.createElement('div');
	const first = $bewitch(el);
	const ctrl = new AbortController();
	const second = $bewitch(el, ctrl.signal);
	assertStrictEquals(second, first, 'idempotent: first signal wins');
});
