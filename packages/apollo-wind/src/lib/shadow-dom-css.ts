import { registerCssPropertyRules } from './register-shadow-dom-properties';

export const TAILWIND_INJECT_ATTR = 'data-tailwind-inject';

const PROBES: ReadonlyArray<{
  className: string;
  property: string;
  expected: string;
}> = [
  { className: 'grid', property: 'display', expected: 'grid' },
  { className: 'flex', property: 'display', expected: 'flex' },
  { className: 'hidden', property: 'display', expected: 'none' },
  { className: 'relative', property: 'position', expected: 'relative' },
];

/**
 * Returns true if apollo-wind Tailwind CSS rules are in scope inside the given
 * root (so injection would be redundant). Two checks:
 *
 *  1. Fast path: look for a `<style data-tailwind-inject>` tag already present.
 *  2. Computed-style probe: apply several known apollo-wind utility classes to a
 *     temp div and require ALL of them to produce their expected computed value.
 *     Consensus prevents a stray single-class definition from false-positiving
 *     into skipping a needed injection.
 *
 * NOTE: we deliberately do NOT probe a custom property (e.g. `--surface`).
 * Custom properties inherit across the shadow boundary, so a host that ships
 * apollo-wind globally in the light DOM would false-positive — the bridge
 * variables reach the shadow root via inheritance even though the utility
 * *rulesets* (which do NOT cross the boundary) are absent.
 */
export function hasApolloWindCss(root: Document | ShadowRoot): boolean {
  if (root.querySelector(`style[${TAILWIND_INJECT_ATTR}]`)) {
    return true;
  }

  const probeParent = root instanceof Document ? root.body : root;
  const probe = document.createElement('div');
  probeParent.appendChild(probe);

  try {
    const computed = getComputedStyle(probe);
    return PROBES.every((p) => {
      probe.className = p.className;
      return computed.getPropertyValue(p.property) === p.expected;
    });
  } finally {
    probe.remove();
  }
}

/**
 * Inject an apollo-wind Tailwind stylesheet into a shadow root and register
 * `@property` rules at the document level. No-ops if a `data-tailwind-inject`
 * style tag is already present in the root.
 *
 * Returns the created `<style>` element, or `null` if injection was skipped.
 *
 * @example
 * ```ts
 * import { injectTailwindIntoShadowRoot } from '@uipath/apollo-wind';
 * import css from '@uipath/apollo-react/canvas/styles/tailwind.canvas.css?raw';
 *
 * // In a web component's connectedCallback:
 * const shadow = this.attachShadow({ mode: 'open' });
 * injectTailwindIntoShadowRoot(shadow, css);
 * ```
 */
export function injectTailwindIntoShadowRoot(
  root: ShadowRoot,
  css: string,
): HTMLStyleElement | null {
  if (root.querySelector(`style[${TAILWIND_INJECT_ATTR}]`)) return null;

  const style = document.createElement('style');
  style.setAttribute(TAILWIND_INJECT_ATTR, '');
  style.textContent = css;
  root.prepend(style);
  registerCssPropertyRules(css);
  return style;
}
