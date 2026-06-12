const defaultEmitOptions: EventInit = {
	bubbles: true,
	cancelable: true,
	composed: true,
};

/**
 * Dispatches an event from the element. The event type is the element's
 * lowercased tag name, optionally suffixed with `:name` when `name` is
 * provided (e.g. `coven-counter:change`). Defaults to a bubbling,
 * cancelable, composed event. Pass `detail` to send a `CustomEvent`.
 *
 * @param element - The element from which the event is dispatched.
 * @param options - Emit options: optional `name` suffix, plus standard `EventInit` or `CustomEventInit` overrides.
 * @returns `false` if the event was canceled, `true` otherwise.
 *
 * @see {@link $on}
 *
 * @example
 * ```ts ignore
 * import { $emit } from '@joeleisner/coven';
 *
 * const el = document.querySelector('my-button')!;
 * // dispatches 'my-button:click'
 * $emit<{ id: number }>(el as HTMLElement, { name: 'click', detail: { id: 1 } });
 * ```
 */
export function $emit<
	TDetail extends unknown | never = never,
>(
	element: HTMLElement,
	options: (EventInit | CustomEventInit<TDetail>) & { name?: string } = {},
): boolean {
	const tag = element.tagName.toLowerCase();
	const type = options.name ? `${tag}:${options.name}` : tag;
	const merged = Object.assign({}, defaultEmitOptions, options) as EventInit | CustomEventInit<TDetail>;

	const event = 'detail' in merged
		? new CustomEvent(type, merged as CustomEventInit<TDetail>)
		: new Event(type, merged as EventInit);

	return element.dispatchEvent(event);
}

export default $emit;
