import { $error } from "./$error";

export function $assert(
	element: HTMLElement,
	condition: unknown,
	message: string,
): asserts condition {
	if (typeof condition !== "boolean")
		condition = Boolean(condition);

	if (!condition) $error(element, message);
}

export default $assert;
