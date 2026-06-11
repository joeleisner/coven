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

const SHARED_SLOT = Symbol('shared');

class MyA extends HTMLElement {}
class MyB extends HTMLElement {}
customElements.define('coven-test-a', MyA);
customElements.define('coven-test-b', MyB);

Deno.test('grimoire.shared(element, type) stores on the constructor', () => {
	const a1 = document.createElement('coven-test-a') as MyA as GrimoireElement;
	const a2 = document.createElement('coven-test-a') as MyA as GrimoireElement;
	const slot = grimoire.shared<{ value?: number }>(a1, SHARED_SLOT);
	slot.value = 99;
	assertEquals(
		grimoire.shared<{ value?: number }>(a2, SHARED_SLOT).value,
		99,
		'instances of the same class share the shared slot',
	);
});

Deno.test('grimoire.shared is isolated between classes', () => {
	const a = document.createElement('coven-test-a') as MyA as GrimoireElement;
	const b = document.createElement('coven-test-b') as MyB as GrimoireElement;
	const slotA = grimoire.shared<{ x?: string }>(a, SHARED_SLOT);
	const slotB = grimoire.shared<{ x?: string }>(b, SHARED_SLOT);
	slotA.x = 'A-class';
	slotB.x = 'B-class';
	assertEquals(grimoire.shared<{ x?: string }>(a, SHARED_SLOT).x, 'A-class');
	assertEquals(grimoire.shared<{ x?: string }>(b, SHARED_SLOT).x, 'B-class');
});

Deno.test('grimoire and grimoire.shared do not collide on the same symbol', () => {
	const el = document.createElement('coven-test-a') as MyA as GrimoireElement;
	const inst = grimoire<{ scope?: string }>(el, SHARED_SLOT);
	const shared = grimoire.shared<{ scope?: string }>(el, SHARED_SLOT);
	inst.scope = 'instance';
	shared.scope = 'class';
	assertEquals(grimoire<{ scope?: string }>(el, SHARED_SLOT).scope, 'instance');
	assertEquals(grimoire.shared<{ scope?: string }>(el, SHARED_SLOT).scope, 'class');
});
