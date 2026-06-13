import './coven-counter.css';

import { Familiar } from '@src/mod.ts';
import { $attr, $shdw } from '@src/hexes/mod.ts';
import { $define, $emit, $on } from '@src/charms/mod.ts';

$define(
	'coven-counter',
	class CovenCounter extends Familiar {
		declare count: number;

		override setup(_signal: AbortSignal): void {
			$shdw(
				this,
				`<button part="dec">-</button><slot></slot><button part="inc">+</button>`,
			);
		}

		override connected(_signal: AbortSignal): void {
			$attr<number>(this, {
				name: 'count',
				value: 0,
				callback: (value) => {
					const output = this.querySelector('output');
					if (output) output.textContent = String(value);
				},
			});

			const dec = $shdw.root(this)!.querySelector<HTMLElement>('[part="dec"]')!;
			const inc = $shdw.root(this)!.querySelector<HTMLElement>('[part="inc"]')!;

			$on(dec, {
				type: 'click',
				signal: this.signal,
				callback: () => {
					this.count--;
					$emit(this, { name: 'change', detail: `decremented to ${this.count}` });
				},
			});

			$on(inc, {
				type: 'click',
				signal: this.signal,
				callback: () => {
					this.count++;
					$emit(this, { name: 'change', detail: `incremented to ${this.count}` });
				},
			});
		}
	},
);
