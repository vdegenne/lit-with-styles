/**
 * @license
 * Copyright (c) 2023 Valentin Degenne
 * SPDX-License-Identifier: MIT
 */
import {getCompatibleStyle, unsafeCSS} from 'lit';
import type {ReactiveElement, ReactiveController, CSSResultOrNative, LitElement} from 'lit';

let _baseStyles: string | CSSResultOrNative = '';

/**
 * Set the base styles shared among components.
 * @param content base CSS literal to inject in every element that uses the decorator.
 */
export async function setBaseStyles(content: string | CSSResultOrNative) {
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
	base?: string | CSSResultOrNative
) {
	// Here one trick is to called protected method `finalize`
	// to make sure the `elementStyles` static field is
	// initialized with user-custom styles.
	// @ts-ignore
	ctor.finalize();
	// add styles
	base = base ?? _baseStyles;
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
	base?: string | CSSResultOrNative
) {
	return function (ctor: LitElementClass) {
		_withStylesDecorativeFunction(ctor, elementStyles, base);
		return ctor as any;
	};
}

const localStorageHandler = 'color-mode';
export type ColorMode =
	(typeof ThemeManager.Mode)[keyof typeof ThemeManager.Mode];

export class ThemeManager {
	static Mode = {
		LIGHT: 'light',
		DARK: 'dark',
		SYSTEM: 'system',
	} as const;

	static #active = false;
	static #mode: ColorMode = this.Mode.SYSTEM;
	static #lightQuery = window.matchMedia('(prefers-color-scheme: light)');
	static #darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

	static get prefersColorScheme(): 'light' | 'dark' | undefined {
		if (this.#darkQuery.matches) {
			return 'dark';
		} else if (this.#lightQuery.matches) {
			return 'light';
		}
		return undefined;
	}

	static get appliedTheme() {
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
		this.#applyThemeToDOM();
		this.#saveModeInLocalStorage();
	}

	static init() {
		if (this.#active) {
			return;
		}
		this.#active = true;

		// The light media query only get triggered
		// when the dark one is changed
		this.#darkQuery.addEventListener(
			'change',
			this.#onPrefersColorSchemeChange.bind(this)
		);

		this.#loadModeValue();
		this.#saveModeInLocalStorage();
		this.#applyThemeToDOM();
	}

	static #onPrefersColorSchemeChange(e: MediaQueryListEvent) {
		this.#applyThemeToDOM();
	}

	static #loadModeValue() {
		this.#mode =
			(localStorage.getItem(`${localStorageHandler}`) as ColorMode) ||
			this.Mode.SYSTEM;
	}
	static #saveModeInLocalStorage() {
		localStorage.setItem(`${localStorageHandler}`, this.#mode);
	}

	static #resolveTheme() {
		switch (this.#mode) {
			case 'light':
			case 'dark':
				return this.#mode;
			case 'system':
				switch (this.prefersColorScheme) {
					case 'light':
					case 'dark':
						return this.prefersColorScheme;
					default:
						// undetermined (default to light)
						return 'light';
				}
		}
	}

	static #applyThemeToDOM() {
		const theme = this.#resolveTheme();
		if (theme == this.appliedTheme) {
			return;
		}
		this.#removeThemeClassesFromCandidates();
		document.documentElement.classList.add(theme);
		for (const instance of instances) {
			instance.classList.add(theme);
		}
	}

	static #removeThemeClassesFromCandidates() {
		['light', 'dark'].forEach((theme) => {
			document.documentElement.classList.remove(theme);
			for (const instance of instances) {
				instance.classList.remove(theme);
			}
		});
	}
}
