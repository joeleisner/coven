export const COVEN_ERROR_NAME = 'CovenError' as const;

type CovenErrorOptions = ErrorOptions & {
	prototype?: HTMLElement;
};

class CovenError extends Error {
	constructor(
		message: string,
		{ prototype, ...options }: CovenErrorOptions = {}
	) {
		super(message, options);
		this.name = COVEN_ERROR_NAME;

		if (prototype)
			Object.setPrototypeOf(this, Object.getPrototypeOf(prototype));
	}
}

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
