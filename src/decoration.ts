/**
 * @license
 * Copyright (c) 2023 Valentin Degenne
 * SPDX-License-Identifier: MIT
 */
import type {
	CSSResultOrNative,
	LitElement,
	ReactiveController,
	ReactiveElement,
} from 'lit';
import {getCompatibleStyle, unsafeCSS} from 'lit';

let _baseStyles: string | CSSResultOrNative = '';

/**
 * Set the base styles shared among components.
 *
 * @param content base CSS literal to inject in every element that uses the decorator.
 */
export function setBaseStyles(content: string | CSSResultOrNative) {
	_baseStyles = content;
}

const instances: Set<ReactiveElement> = new Set();

class InstancesController implements ReactiveController {
	_host: ReactiveElement;

	constructor(host: ReactiveElement) {
		(this._host = host).addController(this);
	}

	hostConnected(): void {
		instances.add(this._host);
	}

	hostDisconnected(): void {
		instances.delete(this._host);
	}
}

const cachedStyleSheets: {[plain: string]: CSSResultOrNative | undefined} = {};

function getStylesheet(input: string | CSSResultOrNative) {
	if (typeof input === 'string') {
		return (
			cachedStyleSheets[input] ??
			(cachedStyleSheets[input] = getCompatibleStyle(unsafeCSS(input)))
		);
	} else {
		// Probably a Stylesheet that lit can understand so we return as-is.
		return input;
	}
}

export type LitElementClass = Omit<typeof LitElement, 'new'>;

export function _withStylesDecorativeFunction(
	ctor: LitElementClass,
	elementStyles?: (string | CSSResultOrNative) | (string | CSSResultOrNative)[],
	base?: string | CSSResultOrNative,
) {
	// One trick here is to call protected method `finalize`
	// to make sure the `elementStyles` static field is
	// initialized with user-custom styles.
	// @ts-ignore
	ctor.finalize();
	// add styles
	base ??= _baseStyles;
	ctor.elementStyles.unshift(getStylesheet(base));
	// add element-specific styles
	if (elementStyles !== undefined) {
		for (const style of Array.isArray(elementStyles)
			? elementStyles
			: [elementStyles]) {
			const stylesheet = getStylesheet(style);
			const elementStyles = ctor.elementStyles;
			if (elementStyles.includes(stylesheet)) {
				return;
			} else {
				elementStyles.push(stylesheet);
			}
		}
	}
	// dark/light mode controller on instances
	ctor.addInitializer((instance: ReactiveElement) => {
		new InstancesController(instance);
	});
}

export function withStyles(
	elementStyles?: (string | CSSResultOrNative) | (string | CSSResultOrNative)[],
	base?: string | CSSResultOrNative,
) {
	return function (ctor: LitElementClass) {
		_withStylesDecorativeFunction(ctor, elementStyles, base);
		return ctor as any;
	};
}

export enum ColorMode {
	LIGHT = 'light',
	DARK = 'dark',
	SYSTEM = 'system',
}

export class ThemeManager {
	static #active = false;
	static #mode: ColorMode = ColorMode.SYSTEM;
	static #lightQuery = window.matchMedia('(prefers-color-scheme: light)');
	static #darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

	static get preferredColorScheme(): 'light' | 'dark' | undefined {
		if (this.#darkQuery.matches) {
			return 'dark';
		} else if (this.#lightQuery.matches) {
			return 'light';
		}
		return undefined;
	}

	static get appliedColorScheme() {
		if (document.documentElement.classList.contains('dark')) {
			return 'dark';
		} else if (document.documentElement.classList.contains('light')) {
			return 'light';
		} else {
			return undefined;
		}
	}

	static get mode() {
		return this.#mode;
	}
	static set mode(value: ColorMode) {
		this.#mode = value;
		this.#applyScheme();
		this.#saveModeInLocalStorage();
	}

	static init() {
		if (this.#active) {
			return;
		}
		this.#active = true;

		this.#loadModeValue();
		this.#applyScheme();

		this.#darkQuery.addEventListener(
			'change',
			this.#onPrefersColorSchemeChange.bind(this),
		);

		// The following shouldn't be necessary
		// this.#saveModeInLocalStorage();
	}

	static #onPrefersColorSchemeChange() {
		this.#applyScheme();
	}

	static #loadModeValue() {
		this.#mode =
			(localStorage.getItem('color-mode') as ColorMode) ?? ColorMode.SYSTEM;
	}
	static #saveModeInLocalStorage() {
		localStorage.setItem('color-mode', this.#mode);
	}

	/**
	 * Find out which scheme should be applied
	 * based on the selected color mode.
	 */
	static #resolveColorScheme() {
		switch (this.#mode) {
			case ColorMode.LIGHT:
				return 'light';
			case ColorMode.DARK:
				return 'dark';
			case ColorMode.SYSTEM:
				switch (this.preferredColorScheme) {
					case 'light':
					case 'dark':
						return this.preferredColorScheme;
					default:
						return 'light';
				}
		}
	}

	/**
	 * Apply proper scheme to document and registered elements
	 */
	static #applyScheme() {
		const scheme = this.#resolveColorScheme();
		if (scheme == this.appliedColorScheme) {
			// If the theme to apply is the same as the applied scheme, pass
			return;
		}
		this.#removeScheme();
		document.documentElement.classList.add(scheme);
		for (const instance of instances) {
			instance.classList.add(scheme);
		}
	}

	/**
	 * Remove scheme classes from document and registered elements
	 */
	static #removeScheme() {
		['light', 'dark'].forEach((scheme) => {
			document.documentElement.classList.remove(scheme);
			for (const instance of instances) {
				instance.classList.remove(scheme);
			}
		});
	}
}
