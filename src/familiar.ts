import { $bewitch } from './hexes/$bewitch.ts';

/**
 * Coven's canonical custom-element base class. Owns lifecycle hooks
 * (setup / connected / disconnected) and exposes an AbortSignal that
 * hexes use for cleanup. The signal is managed by $bewitch — the same
 * mechanism that powers any bring-your-own web component.
 *
 * Subclasses implement any of the three optional hooks; the base
 * class wires them to the standard custom-element lifecycle and
 * renews the signal on reconnect.
 *
 * @see {@link $bewitch}
 *
 * @example
 * ```ts ignore
 * import { Familiar, $define, $on } from '@joeleisner/coven';
 *
 * class MyButton extends Familiar {
 * 	connected(signal: AbortSignal) {
 * 		$on(this, { type: 'click', callback: () => {}, signal });
 * 	}
 * }
 *
 * $define('my-button', MyButton);
 * ```
 */
export abstract class Familiar extends HTMLElement {
	setup?(signal: AbortSignal): void;
	connected?(signal: AbortSignal): void;
	disconnected?(): void;

	constructor() {
		super();
		$bewitch(this);
		this.setup?.(this.signal);
	}

	get signal(): AbortSignal {
		return $bewitch.signal(this)!;
	}

	connectedCallback(): void {
		if (this.signal.aborted) $bewitch.renew(this);

		const connect = () => {
			this.connected?.(this.signal);
			if (typeof this.disconnected === 'function') {
				this.signal.addEventListener(
					'abort',
					() => this.disconnected!(),
					{ once: true },
				);
			}
		};

		if (document.readyState !== 'loading') {
			connect();
		} else {
			document.addEventListener('DOMContentLoaded', connect, {
				once: true,
				signal: this.signal,
			});
		}
	}

	disconnectedCallback(): void {
		$bewitch.abort(this);
	}
}
