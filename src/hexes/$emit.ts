const defaultEmitOptions: EventInit = {
	bubbles: true,
	cancelable: true,
	composed: true,
};

export function $emit<
	TDetail extends unknown | never = never,
>(
	element: HTMLElement,
	options: EventInit | CustomEventInit<TDetail> = {}
): boolean {
	options = Object.assign({}, defaultEmitOptions, options);

	const event = 'detail' in options
		? new CustomEvent(element.tagName.toLowerCase(), options as CustomEventInit<TDetail>)
		: new Event(element.tagName.toLowerCase(), options as EventInit);

	return element.dispatchEvent(event);
}
