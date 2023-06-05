import {withStyles, setBaseStyles} from '../lib';
import {LitElement as Lit, css, html} from 'lit';
import {customElement} from 'lit/decorators.js';

setBaseStyles(
  css`
    :host {
      background-color: red;
    }
  `
);

@customElement('my-element')
@withStyles(
  [
    ':host { color: white }',
    css`
      :host {
        margin: 12px;
        padding: 4px;
      }
    `,
  ],
  css`:host { background: black }`
)
class MyElement extends Lit {
	static styles = css`b { text-transform: uppercase }`
  render() {
    return html`<b>hey lit</b>`;
  }
}

const ce = new MyElement();
document.body.prepend(ce);
