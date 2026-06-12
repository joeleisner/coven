import './ssd.css';

import { Familiar, grimoire } from '../mod.ts';
import { $attr, $mut, $prop, $scry, $shdw } from '../hexes/mod.ts';
import { $define } from '../charms/mod.ts';

const namespace = 'wcpg-ssd';

class SSDDigit extends Familiar {
	declare value: string;
	declare readonly segments: NodeListOf<HTMLDivElement>;

	static segmentMap = new Map([
		[' ', 0b0000000],
		['0', 0b1111110],
		['1', 0b0110000],
		['2', 0b1101101],
		['3', 0b1111001],
		['4', 0b0110011],
		['5', 0b1011011],
		['6', 0b1011111],
		['7', 0b1110000],
		['8', 0b1111111],
		['9', 0b1111011],
	]);

	updateSegments(): void {
		if (!this.segments) return;

		const segmentBits = SSDDigit.segmentMap.get(this.value) ?? 0;

		this.segments.forEach((segment, index) => {
			const isActive = (segmentBits & (1 << (6 - index))) !== 0;
			if (isActive) {
				segment.setAttribute(
					'part',
					`segment segment-${String.fromCharCode(97 + index)} segment-active`,
				);
			} else {
				segment.setAttribute('part', `segment segment-${String.fromCharCode(97 + index)}`);
			}
		});
	}

	override setup(): void {
		const shadow = $shdw(
			this,
			/*html*/ `
			<span part="digit-value"><slot></slot></span>
			<div part="segment segment-a"></div>
			<div part="segment segment-b"></div>
			<div part="segment segment-c"></div>
			<div part="segment segment-d"></div>
			<div part="segment segment-e"></div>
			<div part="segment segment-f"></div>
			<div part="segment segment-g"></div>
		`,
		);
		$prop(this, {
			name: 'segments',
			value: shadow.querySelectorAll<HTMLDivElement>('div[part^="segment"]'),
			readonly: true,
		});
	}

	override connected(): void {
		$attr<string>(this, {
			name: 'value',
			value: ' ',
			callback: () => this.updateSegments(),
		});

		this.updateSegments();
	}
}

$define(`${namespace}-digit`, SSDDigit);

$define(
	namespace,
	class SSD extends Familiar {
		digits: SSDDigit[] = [];

		updateDisplay(text: string | null = null): void {
			if (!this.shadowRoot) return;

			if (!text) {
				return this.digits.forEach((digit) => digit.remove());
			}

			this.digits = Array.from($shdw(this).querySelectorAll<SSDDigit>(`${namespace}-digit`));

			let diff = text.length - this.digits.length;

			while (diff < 0) {
				this.digits.at(-1)?.remove();
				this.digits.pop();
				diff++;
			}

			while (diff > 0) {
				const digitElement = document.createElement(`${namespace}-digit`) as SSDDigit;
				digitElement.setAttribute(
					'exportparts',
					'segment, segment-active, segment-a, segment-b, segment-c, segment-d, segment-e, segment-f, segment-g',
				);
				digitElement.part.add('digit');
				$shdw(this).appendChild(digitElement);
				this.digits.push(digitElement);
				digitElement.value = ' ';
				diff--;
			}

			this.digits.forEach((digit, index) => {
				digit.value = text[index] ?? ' ';
			});
		}

		override setup() {
			$shdw(
				this,
				/*html*/ `
			<span part="display-value"><slot></slot></span>
		`,
			);
		}

		override connected() {
			this.updateDisplay(this.textContent);

			$mut(this, {
				type: 'characterData',
				callback: this.updateDisplay.bind(this),
				subtree: true,
			});
		}

		override disconnected() {
			this.digits = [];
		}
	},
);

$define(
	'wcpg-int-example',
	class IntExample extends Familiar {
		intersected = false;

		get text(): string {
			return this.intersected ? 'Intersected' : 'Not intersected';
		}

		override setup() {
			// console.log('setup!');
			$shdw(
				this,
				/*html*/ `
			<span part="value">${this.text}</span>
			<slot></slot>
		`,
			);
		}

		override connected() {
			$scry(this, {
				callback: (entries, observer) => {
					this.intersected = entries.some((entry) => entry.isIntersecting);
					if (this.intersected) {
						$shdw(this).querySelector('span')!.textContent = this.text;
						alert('Found me!');
						observer.disconnect();
					}
				},
			});

			console.log(grimoire(this));
		}
	},
);
