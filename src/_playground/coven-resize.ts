import './coven-resize.css';

import { Familiar } from '@src/mod.ts';
import { $morph, $shdw } from '@src/hexes/mod.ts';
import { $define, $emit } from '@src/charms/mod.ts';

$define(
	'coven-resize',
	class CovenResize extends Familiar {
		override setup(_signal: AbortSignal): void {
			$shdw(this, `<span part="dims"></span><slot></slot>`);
		}

		override connected(_signal: AbortSignal): void {
			const dims = $shdw.root(this)!.querySelector<HTMLElement>('[part="dims"]')!;

			$morph(this, {
				callback: (entries) => {
					const entry = entries[0];
					if (!entry) return;
					const { inlineSize: w, blockSize: h } = entry.contentBoxSize[0]!;
					dims.textContent = `${Math.round(w)} × ${Math.round(h)}`;
					$emit(this, {
						name: 'change',
						detail: `${Math.round(w)}×${Math.round(h)}`,
					});
				},
			});
		}
	},
);
