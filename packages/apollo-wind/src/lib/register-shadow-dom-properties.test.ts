import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { registerCssPropertyRules } from './register-shadow-dom-properties';

const SELECTOR = 'style[data-tw-property-rules]';

const SAMPLE_CSS = `
@layer base { .border { border-style: var(--tw-border-style); border-width: 1px; } }
@property --tw-border-style{syntax:"*";inherits:false;initial-value:solid}
@property --tw-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}
@property --tw-translate-x{syntax:"*";inherits:false;initial-value:0}
.bg-popover { background-color: var(--popover); }
`;

beforeEach(() => {
  document.querySelectorAll(SELECTOR).forEach((el) => el.remove());
});

afterEach(() => {
  document.querySelectorAll(SELECTOR).forEach((el) => el.remove());
});

describe('registerCssPropertyRules', () => {
  it('extracts @property rules from CSS and injects them into document.head', () => {
    registerCssPropertyRules(SAMPLE_CSS);

    const style = document.querySelector(SELECTOR);
    expect(style).not.toBeNull();

    const text = style?.textContent ?? '';
    expect(text).toContain('@property --tw-border-style');
    expect(text).toContain('@property --tw-shadow');
    expect(text).toContain('@property --tw-translate-x');
  });

  it('does not include non-@property rules', () => {
    registerCssPropertyRules(SAMPLE_CSS);

    const text = document.querySelector(SELECTOR)?.textContent ?? '';
    expect(text).not.toContain('.border');
    expect(text).not.toContain('.bg-popover');
    expect(text).not.toContain('@layer');
  });

  it('injects only one style element when called multiple times', () => {
    registerCssPropertyRules(SAMPLE_CSS);
    registerCssPropertyRules(SAMPLE_CSS);
    registerCssPropertyRules(SAMPLE_CSS);

    const elements = document.querySelectorAll(SELECTOR);
    expect(elements).toHaveLength(1);
  });

  it('does nothing when CSS has no @property rules', () => {
    registerCssPropertyRules('.flex { display: flex; }');

    expect(document.querySelector(SELECTOR)).toBeNull();
  });
});
