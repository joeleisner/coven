/**
 * @module
 * {@link $on} (hex) — type-safe `addEventListener` with automatic signal
 * wiring. Sources its {@link AbortSignal} from `$bewitch` — no `signal`
 * option is needed or accepted. Use `charms.$on` when supplying your own signal.
 */
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
