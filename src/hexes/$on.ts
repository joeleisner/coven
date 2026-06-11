import { $bewitch } from "./$bewitch.ts";

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
	element: HTMLElement,
	{
		type,
		callback,
		target = document,
	}: $OnOptions<TDetail, TEvent>
): void {
	const signal = $bewitch(element);
	target.addEventListener(
		type,
		callback as EventListenerOrEventListenerObject,
		{ signal },
	);
}
