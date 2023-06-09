<div align="center">
  <img src="./logo.png" width=512>
</div>

## Usage

```typescript
import {withStyles} from 'lit-with-styles';

@customElement('my-element')
@withStyles(elementStyles)
class MyElement extends LitElement {
}
```
The decorator will create a stylesheet in the background and inject it into the element *(It's optimized in a way elements sharing same styles will share the same stylesheet.)*

You can also pass an array of styles into the decorator. Here's all the accepted types:

```typescript
import {css} from 'lit';
import elementsStyles from './element-styles.css' assert { type: 'css' };

@withStyles([
	// [1]
	':host { background-color: red }',
	// [2]
	css`:host { color: white }`,
	// [3]
	elementStyles
])
```
[1] string version  
[2] css tagged literal version  
[3] css module version  
*(You can also pass a CSSStyleSheet object)*

## Base styles

Sometimes you need to define global styles to share accross all your elements. `lit-with-styles` provides a method for that.

```typescript
import {setBaseStyles} from 'lit-with-styles';

setBaseStyles(css`...`)
// or
// setBaseStyles('...')
```
*(note: If the base styles are not applied to some of your elements then you should try to call that function earlier in your code.)*

Now when you use `@withStyles` base styles are automatically applied. The second argument of the decorator let you redefined the base styles per element if needed:
```typescript
@withStyles(elementStyles, newBaseStyles)
```

## Bare version (for minimalistic addicts)

Sometimes you just want to use `@withStyles` to inject base styles to your element, and do no need to pass any arguments:
```typescript
import {withStyles} from 'lit-with-styles/bare';

@customElement('my-element') @withStyles
class MyElement extends LitElement {}
```
*(You will need to set moduleResolution to `nodenext` in your TS configuration file for that.)*

## Installation

```
npm add -D lit-with-styles
```

## License

MIT (c) 2023 Valentin Degenne
