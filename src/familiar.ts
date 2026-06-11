export abstract class Familiar extends HTMLElement {
	#controller: AbortController;

	setup?(signal: AbortSignal): void;
	connected?(signal: AbortSignal): void;
	disconnected?(): void;

	constructor() {
		super();
		this.#controller = new AbortController();
		if (typeof this.setup === 'function') {
			this.setup(this.#controller.signal);
		}	
	}

	get signal(): AbortSignal {
		return this.#controller.signal;
	}

	connectedCallback(): void {
		if (this.#controller.signal.aborted) {
			this.#controller = new AbortController();
		}

		const connect = () => {
			if (typeof this.connected === 'function') {
				this.connected(this.signal);
			}
			if (typeof this.disconnected === 'function')
				this.signal.addEventListener(
					'abort',
					() => this.disconnected!(),
					{ once: true }
				);
		};

		if (document.readyState !== 'loading') {
			connect();
		} else {
			document.addEventListener(
				'DOMContentLoaded',
				() => connect(),
				{
					once: true,
					signal: this.signal,
				}
			);
		}
	}

	disconnectedCallback(): void {
		this.#controller.abort();
	}
};
