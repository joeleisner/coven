import { test } from './_test/setup.ts';
import {
	assert,
	assertEquals,
	assertNotStrictEquals,
} from '@std/assert';
import { Familiar } from './familiar.ts';

let counter = 0;
function tagName(): string {
	return `coven-fam-${++counter}`;
}

test('constructor calls setup with a signal', () => {
	let received: AbortSignal | null = null;
	class T extends Familiar {
		override setup(signal: AbortSignal) {
			received = signal;
		}
	}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name) as T;
	assert((received as AbortSignal | null) instanceof AbortSignal);
	assertEquals(received, el.signal);
});

test('connectedCallback invokes connected with the signal', async () => {
	let connectedSignal: AbortSignal | null = null;
	class T extends Familiar {
		override connected(signal: AbortSignal) {
			connectedSignal = signal;
		}
	}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name) as T;
	document.body.appendChild(el);
	await Promise.resolve();
	assertEquals(connectedSignal, el.signal);
	el.remove();
});

test('disconnectedCallback aborts the signal', () => {
	class T extends Familiar {}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name) as T;
	document.body.appendChild(el);
	const sig = el.signal;
	el.remove();
	assert(sig.aborted);
});

test('reconnect renews the signal', async () => {
	class T extends Familiar {}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name) as T;
	document.body.appendChild(el);
	const first = el.signal;
	el.remove();
	document.body.appendChild(el);
	await Promise.resolve();
	assert(first.aborted);
	assertNotStrictEquals(el.signal, first);
	assert(!el.signal.aborted);
	el.remove();
});
