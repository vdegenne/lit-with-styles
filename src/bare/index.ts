import type {ReactiveElement} from 'lit';
import {LitElementClass, _withStylesDecorativeFunction} from '../decoration.js';

export function withStyles(ctor: LitElementClass) {
	_withStylesDecorativeFunction(ctor);
}

export {ThemeManager, setBaseStyles} from '../decoration.js';
