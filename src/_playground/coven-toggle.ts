import './coven-toggle.css';

import { Familiar } from '@src/mod.ts';
import { $prop, $scry, $shdw } from '@src/hexes/mod.ts';
import { $define, $emit, $on } from '@src/charms/mod.ts';

$define(
	'coven-toggle',
	class CovenToggle extends Familiar {
		declare open: boolean;

		override setup(_signal: AbortSignal): void {
			$shdw(
				this,
				`<button part="trigger">Hide</button><slot></slot>`,
			);
		}

		override connected(_signal: AbortSignal): void {
			$prop<boolean>(this, { name: 'open', value: true });

			const trigger = $shdw.root(this)!.querySelector<HTMLElement>('[part="trigger"]')!;
			const slot = $shdw.root(this)!.querySelector<HTMLElement>('slot')!;

			$on(trigger, {
				type: 'click',
				signal: this.signal,
				callback: () => {
					this.open = !this.open;
					slot.style.display = this.open ? '' : 'none';
					trigger.textContent = this.open ? 'Hide' : 'Show';
					$emit(this, { name: 'change', detail: this.open ? 'shown' : 'hidden' });
				},
			});

			$scry(this, {
				callback: (entries) => {
					const intersecting = entries.some((e) => e.isIntersecting);
					$emit(this, {
						name: 'viewport',
						detail: intersecting ? 'entered viewport' : 'exited viewport',
					});
				},
			});
		}
	},
);
