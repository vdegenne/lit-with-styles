import type {ReactiveElement} from 'lit';
import {_withStylesDecorativeFunction} from '../decoration.js';

export function withStyles(ctor: typeof ReactiveElement) {
	_withStylesDecorativeFunction(ctor);
}

export {ThemeManager, setBaseStyles} from '../decoration.js';
