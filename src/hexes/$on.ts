import type { SignalElement } from "../elements";

export type $OnOptions<
	TDetail extends unknown | never = never,
	TEvent = [TDetail] extends [never] ? Event : CustomEvent<TDetail>
> = {
	type: string;
	callback: (event: TEvent) => void;
	target?: EventTarget;
}

export function $on<
	TDetail extends unknown | never = never,
	TEvent = [TDetail] extends [never] ? Event : CustomEvent<TDetail>
>(
	element: SignalElement,
	{
		type,
		callback,
		target = document,
	}: $OnOptions<TDetail, TEvent>
): void {
	target.addEventListener(
		type,
		callback as EventListenerOrEventListenerObject,
		{ signal: element?.signal },
	);
}
