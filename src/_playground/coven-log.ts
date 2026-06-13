import './coven-log.css';

import { Familiar } from '@src/mod.ts';
import { $attr } from '@src/hexes/mod.ts';
import { $define } from '@src/charms/mod.ts';

$define(
	'coven-log',
	class CovenLog extends Familiar {
		declare cap: number;
		declare listen: string;

		#cap = 0;
		#listenerCtrl: AbortController | null = null;

		override connected(signal: AbortSignal): void {
			const cap = $attr<number>(this, {
				name: 'cap',
				value: 0,
				callback: (value) => this.#updateCap(value),
			});
			this.#updateCap(cap);

			const events = $attr<string>(this, {
				name: 'listen',
				value: '',
				callback: (value) => this.#rebind(value),
			});
			this.#rebind(events);

			signal.addEventListener('abort', () => {
				this.#listenerCtrl?.abort();
			}, { once: true });
		}

		#updateCap(value: number): void {
			this.#cap = value;
			if (value > 0) {
				this.style.setProperty('--cap', String(value));
			} else {
				this.style.removeProperty('--cap');
			}
		}

		#log(type: string, message: string): void {
			const ol = this.querySelector('ol');
			if (!ol) return;
			const li = document.createElement('li');
			li.textContent = `${type}: ${message}`;
			ol.prepend(li);
			if (this.#cap > 0) {
				const items = ol.querySelectorAll('li');
				for (let i = this.#cap; i < items.length; i++) items[i].remove();
			}
		}

		#rebind(types: string): void {
			this.#listenerCtrl?.abort();
			this.#listenerCtrl = new AbortController();
			const { signal } = this.#listenerCtrl;

			for (const type of types.trim().split(/\s+/).filter(Boolean)) {
				document.addEventListener(
					type,
					(event) => {
						if (!(event instanceof CustomEvent)) return;
						this.#log(event.type, String(event.detail ?? ''));
					},
					{ signal },
				);
			}
		}
	},
);
