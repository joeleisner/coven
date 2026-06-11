import './_test/setup.ts';
import { assert, assertEquals, assertStrictEquals } from '@std/assert';
import { grimoire, type GrimoireElement } from './grimoire.ts';

const SLOT_A = Symbol('test-a');
const SLOT_B = Symbol('test-b');

Deno.test('grimoire(element) creates a per-element store', () => {
	const el = document.createElement('div') as GrimoireElement;
	const store = grimoire(el);
	assert(typeof store === 'object');
});

Deno.test('grimoire(element) returns the same store on repeat calls', () => {
	const el = document.createElement('div') as GrimoireElement;
	assertStrictEquals(grimoire(el), grimoire(el));
});

Deno.test('grimoire(element, type) creates a typed slot', () => {
	const el = document.createElement('div') as GrimoireElement;
	const slot = grimoire<{ value?: number }>(el, SLOT_A);
	slot.value = 42;
	assertEquals(grimoire<{ value?: number }>(el, SLOT_A).value, 42);
});

Deno.test('different slot symbols do not collide', () => {
	const el = document.createElement('div') as GrimoireElement;
	const a = grimoire<{ x?: string }>(el, SLOT_A);
	const b = grimoire<{ x?: string }>(el, SLOT_B);
	a.x = 'A';
	b.x = 'B';
	assertEquals(grimoire<{ x?: string }>(el, SLOT_A).x, 'A');
	assertEquals(grimoire<{ x?: string }>(el, SLOT_B).x, 'B');
});

Deno.test('different elements have isolated grimoires', () => {
	const a = document.createElement('div') as GrimoireElement;
	const b = document.createElement('div') as GrimoireElement;
	const slotA = grimoire<{ v?: number }>(a, SLOT_A);
	const slotB = grimoire<{ v?: number }>(b, SLOT_A);
	slotA.v = 1;
	slotB.v = 2;
	assertEquals(grimoire<{ v?: number }>(a, SLOT_A).v, 1);
	assertEquals(grimoire<{ v?: number }>(b, SLOT_A).v, 2);
});
