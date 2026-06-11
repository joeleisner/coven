export type $OnOptions<
	TDetail extends unknown | never = never,
	TEvent = [TDetail] extends [never] ? Event : CustomEvent<TDetail>
> = {
	type: string;
	callback: (event: TEvent) => void;
	signal?: AbortSignal;
}

/**
 * Type-safe wrapper around addEventListener. Attaches the listener to
 * the given element so events stay encapsulated within the component's
 * scope. Pass `signal` for automatic cleanup; omit it to manage the
 * listener manually.
 *
 * For automatic cleanup on a Familiar instance: pass `this.signal`.
 * For a plain element: call `$bewitch(element)` to obtain a signal.
 *
 * @param element - The element to attach the listener to.
 * @param options - Listener config: type, callback, and optional signal.
 */
export function $on<
	TDetail extends unknown | never = never,
	TEvent = [TDetail] extends [never] ? Event : CustomEvent<TDetail>
>(
	element: HTMLElement,
	{
		type,
		callback,
		signal,
	}: $OnOptions<TDetail, TEvent>
): void {
	element.addEventListener(
		type,
		callback as EventListenerOrEventListenerObject,
		{ signal },
	);
}
