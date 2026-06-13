/**
 * @module
 * The {@link Familiar} base class — Coven's canonical custom-element
 * foundation. Provides `setup`, `connected`, and `disconnected` lifecycle
 * hooks and an owned {@link AbortSignal} managed by `$bewitch`.
 */
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
	/**
	 * Called once during construction, before the element is connected to the
	 * DOM. Use for setup that does not depend on the live document (e.g.
	 * initialising state, attaching a shadow root). The signal is live but
	 * will not be aborted until the first disconnect.
	 */
	setup?(signal: AbortSignal): void;

	/**
	 * Called each time the element is inserted into the DOM, deferred to
	 * DOM-ready via `$wake`. On reconnection the signal is renewed before this
	 * runs, so any listeners registered here are automatically cleaned up when
	 * the element is later removed.
	 */
	connected?(signal: AbortSignal): void;

	/**
	 * Called when the element is removed from the DOM. The signal is already
	 * aborted by the time this runs, so any abort-based cleanup has already
	 * fired. Use for teardown that cannot be expressed as an abort listener.
	 */
	disconnected?(): void;

	constructor() {
		super();
		$bewitch(this);
		this.setup?.(this.signal);
	}

	/**
	 * The AbortSignal owned by this element. Aborted on disconnect and
	 * replaced with a fresh signal on every subsequent reconnect.
	 */
	get signal(): AbortSignal {
		return $bewitch.signal(this)!;
	}

	/** @internal Delegates to `$soul`; subclasses should implement `connected` instead. */
	connectedCallback(): void {
		if (this.signal.aborted) $bewitch.renew(this);

		$soul(this, {
			connected: this.connected?.bind(this),
			disconnected: this.disconnected?.bind(this),
		});
	}

	/** @internal Aborts the owned signal; subclasses should implement `disconnected` instead. */
	disconnectedCallback(): void {
		$bewitch.abort(this);
	}
}
