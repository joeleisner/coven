import { test } from './setup.ts';
import { assert } from '@std/assert';
import { Familiar } from '../familiar.ts';
import { grimoire } from '../grimoire.ts';
import { $attr } from '../hexes/$attr.ts';
import { $shdw } from '../hexes/$shdw.ts';
import { $on } from '../charms/$on.ts';

let counter = 0;

test('audit log shows every hex active on an element', () => {
	class Audited extends Familiar {
		override setup() {
			$shdw(this, '<div part="root"></div>');
			$attr(this, { name: 'mode', value: 'idle' });
			$on(this, { type: 'click', callback: () => {} });
		}
	}

	const name = `coven-audit-${++counter}`;
	customElements.define(name, Audited);
	const el = document.createElement(name) as Audited;

	const descriptions = Object.getOwnPropertySymbols(grimoire(el))
		.map((s) => s.description);

	// $bewitch — Familiar's constructor calls $bewitch(this).
	// $shdw    — writes its slot directly to the host grimoire.
	// $attr    — writes its slot to the host and internally calls
	//            $prop(host, ...) and $mut(host, ...), each of which
	//            writes its own slot to the host.
	// $on      — is a charm and writes nothing.
	for (const expected of ['$bewitch', '$shdw', '$attr', '$prop', '$mut']) {
		assert(
			descriptions.includes(expected),
			`expected ${expected} in audit log; got ${descriptions.join(', ')}`,
		);
	}
});
