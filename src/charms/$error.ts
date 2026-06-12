/**
 * The `name` value attached to every error thrown by `$error`. Use it
 * to identify Coven-originated errors in catch blocks.
 */
export const COVEN_ERROR_NAME = 'CovenError' as const;

type CovenErrorOptions = ErrorOptions & {
	prototype?: HTMLElement;
};

class CovenError extends Error {
	constructor(
		message: string,
		{ prototype, ...options }: CovenErrorOptions = {},
	) {
		super(message, options);
		this.name = COVEN_ERROR_NAME;

		if (prototype) {
			Object.setPrototypeOf(this, Object.getPrototypeOf(prototype));
		}
	}
}

/**
 * Throws a tagged `CovenError` whose message is prefixed with the
 * component's lowercased tag name. The thrown error's prototype is
 * set to the component's, so `instanceof` checks against the custom
 * element class succeed.
 *
 * @param component - The component the error is thrown from.
 * @param message - The error message (the tag name is prepended).
 *
 * @see {@link $assert}
 *
 * @example
 * ```ts ignore
 * import { $error } from '@joeleisner/coven';
 *
 * const el = document.createElement('my-el');
 * if (!el.isConnected) $error(el, 'must be connected first');
 * ```
 */
export function $error(
	component: HTMLElement,
	message: string,
): never {
	message = `[${component.tagName.toLowerCase()}]: ${message}`;
	throw new CovenError(message, {
		prototype: component,
	});
}

export default $error;
