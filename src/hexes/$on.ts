import { $bewitch } from './$bewitch.ts';
import { $on as $onCharm, type $OnOptions } from '../charms/$on.ts';

export function $on<
	TDetail extends unknown | never = never,
	TEvent = [TDetail] extends [never] ? Event : CustomEvent<TDetail>,
>(
	element: HTMLElement,
	options: Omit<$OnOptions<TDetail, TEvent>, 'signal'>,
): void {
	const signal = $bewitch(element);
	$onCharm(element, { ...options, signal });
}

export default $on;
