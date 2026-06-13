import { test } from '../_test/setup.ts';
import { assertEquals } from '@std/assert';
import { $wake } from './$wake.ts';
import { grimoire, type GrimoireElement } from '../grimoire.ts';

// happy-dom always reports readyState as 'complete', so only the immediate
// path can be tested in this environment. The DOMContentLoaded path is
// exercised by integration (running the playground dev server).

test('$wake runs callback immediately when DOM is already ready', () => {
	const el = document.createElement('div');
	let ran = false;
	$wake(el, () => {
		ran = true;
	});
	assertEquals(ran, true);
});

test('$wake does not write to the grimoire', () => {
	const el = document.createElement('div');
	$wake(el, () => {});
	const symbols = Object.getOwnPropertySymbols(grimoire(el as GrimoireElement));
	assertEquals(
		symbols.length,
		0,
		`expected no grimoire slots; got ${symbols.map((s) => s.description).join(', ')}`,
	);
});

test('$wake passes an optional signal to the DOMContentLoaded listener', () => {
	// Verify the signal is accepted without throwing — actual deferred behavior
	// is not testable in happy-dom (readyState is always 'complete').
	const el = document.createElement('div');
	const ctrl = new AbortController();
	let ran = false;
	$wake(el, () => {
		ran = true;
	}, ctrl.signal);
	// readyState === 'complete' in happy-dom, so callback still runs immediately
	assertEquals(ran, true);
});
