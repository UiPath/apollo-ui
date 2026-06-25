import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  hasApolloWindCss,
  injectTailwindIntoShadowRoot,
  TAILWIND_INJECT_ATTR,
} from './shadow-dom-css';

const SELECTOR = `style[${TAILWIND_INJECT_ATTR}]`;
const PROPERTY_SELECTOR = 'style[data-tw-property-rules]';

const SAMPLE_CSS = `
@property --tw-border-style{syntax:"*";inherits:false;initial-value:solid}
.flex { display: flex; }
.grid { display: grid; }
`;

function createShadowHost(): { host: HTMLElement; root: ShadowRoot } {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });
  return { host, root };
}

beforeEach(() => {
  document.querySelectorAll(SELECTOR).forEach((el) => el.remove());
  document.querySelectorAll(PROPERTY_SELECTOR).forEach((el) => el.remove());
});

afterEach(() => {
  document.querySelectorAll(SELECTOR).forEach((el) => el.remove());
  document.querySelectorAll(PROPERTY_SELECTOR).forEach((el) => el.remove());
  document
    .querySelectorAll('div')
    .forEach((el) => el.parentNode?.removeChild(el));
});

describe('injectTailwindIntoShadowRoot', () => {
  it('creates a style element in the shadow root', () => {
    const { host, root } = createShadowHost();

    const style = injectTailwindIntoShadowRoot(root, SAMPLE_CSS);

    expect(style).not.toBeNull();
    expect(style?.parentNode).toBe(root);
    expect(style?.textContent).toBe(SAMPLE_CSS);
    expect(style?.getAttribute(TAILWIND_INJECT_ATTR)).toBe('');

    host.remove();
  });

  it('prepends the style element (before existing content)', () => {
    const { host, root } = createShadowHost();
    const existing = document.createElement('div');
    root.appendChild(existing);

    injectTailwindIntoShadowRoot(root, SAMPLE_CSS);

    expect(root.firstChild).toBeInstanceOf(HTMLStyleElement);

    host.remove();
  });

  it('registers @property rules at the document level', () => {
    const { host, root } = createShadowHost();

    injectTailwindIntoShadowRoot(root, SAMPLE_CSS);

    const propertyStyle = document.querySelector(PROPERTY_SELECTOR);
    expect(propertyStyle).not.toBeNull();
    expect(propertyStyle?.textContent).toContain('@property --tw-border-style');

    host.remove();
  });

  it('returns null and skips injection when already present', () => {
    const { host, root } = createShadowHost();

    const first = injectTailwindIntoShadowRoot(root, SAMPLE_CSS);
    const second = injectTailwindIntoShadowRoot(root, SAMPLE_CSS);

    expect(first).not.toBeNull();
    expect(second).toBeNull();
    expect(root.querySelectorAll(SELECTOR)).toHaveLength(1);

    host.remove();
  });

  it('injects into separate shadow roots independently', () => {
    const host1 = document.createElement('div');
    const host2 = document.createElement('div');
    document.body.appendChild(host1);
    document.body.appendChild(host2);
    const root1 = host1.attachShadow({ mode: 'open' });
    const root2 = host2.attachShadow({ mode: 'open' });

    const style1 = injectTailwindIntoShadowRoot(root1, SAMPLE_CSS);
    const style2 = injectTailwindIntoShadowRoot(root2, SAMPLE_CSS);

    expect(style1).not.toBeNull();
    expect(style2).not.toBeNull();

    host1.remove();
    host2.remove();
  });
});

describe('hasApolloWindCss', () => {
  it('returns true when data-tailwind-inject tag exists in document', () => {
    const style = document.createElement('style');
    style.setAttribute(TAILWIND_INJECT_ATTR, '');
    document.head.appendChild(style);

    expect(hasApolloWindCss(document)).toBe(true);

    style.remove();
  });

  it('returns true when data-tailwind-inject tag exists in shadow root', () => {
    const { host, root } = createShadowHost();

    injectTailwindIntoShadowRoot(root, SAMPLE_CSS);

    expect(hasApolloWindCss(root)).toBe(true);

    host.remove();
  });

  it('returns false when no styles are present', () => {
    // jsdom does not apply CSS rulesets, so computed-style probes fail —
    // correct fail-closed behavior (inject redundantly rather than skip).
    expect(hasApolloWindCss(document)).toBe(false);
  });

  it('returns false for an empty shadow root', () => {
    const { host, root } = createShadowHost();

    expect(hasApolloWindCss(root)).toBe(false);

    host.remove();
  });
});

describe('TAILWIND_INJECT_ATTR', () => {
  it('equals data-tailwind-inject', () => {
    expect(TAILWIND_INJECT_ATTR).toBe('data-tailwind-inject');
  });
});
