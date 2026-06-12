const defaultEmitOptions: EventInit = {
	bubbles: true,
	cancelable: true,
	composed: true,
};

/**
 * Dispatches an event whose type is the element's lowercased tag name.
 * Defaults to a bubbling, cancelable, composed event so the dispatch
 * crosses shadow boundaries by default. Pass `detail` in `options` to
 * send a `CustomEvent` instead of a plain `Event`.
 *
 * @param element - The element from which the event is dispatched.
 * @param options - Standard `EventInit` or `CustomEventInit` overrides.
 * @returns `false` if the event was canceled, `true` otherwise.
 *
 * @see {@link $on}
 *
 * @example
 * ```ts ignore
 * import { $emit } from '@joeleisner/coven';
 *
 * const el = document.querySelector('my-button')!;
 * $emit<{ id: number }>(el as HTMLElement, { detail: { id: 1 } });
 * ```
 */
export function $emit<
	TDetail extends unknown | never = never,
>(
	element: HTMLElement,
	options: EventInit | CustomEventInit<TDetail> = {},
): boolean {
	options = Object.assign({}, defaultEmitOptions, options);

	const event = 'detail' in options
		? new CustomEvent(element.tagName.toLowerCase(), options as CustomEventInit<TDetail>)
		: new Event(element.tagName.toLowerCase(), options as EventInit);

	return element.dispatchEvent(event);
}
