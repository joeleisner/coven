import { $bewitch } from './hexes/$bewitch.ts';
import { $soul } from './hexes/$soul.ts';

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
 * @see {@link $soul}
 *
 * @example
 * ```ts ignore
 * import { Familiar, charms } from '@joeleisner/coven';
 *
 * class MyButton extends Familiar {
 * 	connected(signal: AbortSignal) {
 * 		charms.$on(this, { type: 'click', callback: () => {}, signal });
 * 	}
 * }
 *
 * charms.$define('my-button', MyButton);
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

		$soul(this, {
			connected: this.connected?.bind(this),
			disconnected: this.disconnected?.bind(this),
		});
	}

	disconnectedCallback(): void {
		$bewitch.abort(this);
	}
}
