/**
 * Extract `@property` at-rules from a CSS string and inject them into
 * `document.head` so they register at the global scope.
 *
 * Browsers silently ignore `@property` rules inside shadow DOM `<style>`
 * elements, breaking Tailwind v4 utilities that chain through `--tw-*`
 * variables (`border`, `shadow-*`, `ring-*`, `translate-*`, etc.).
 *
 * This is an internal helper — consumers should use
 * {@link injectTailwindIntoShadowRoot} which calls this automatically.
 *
 * @see https://github.com/tailwindlabs/tailwindcss/discussions/16772
 * @internal
 */

const MARKER = 'data-tw-property-rules';
const NEEDLE = '@property';

function extractPropertyRules(css: string): string[] {
  const rules: string[] = [];
  let pos = 0;
  while ((pos = css.indexOf(NEEDLE, pos)) !== -1) {
    const open = css.indexOf('{', pos);
    if (open === -1) break;
    const close = css.indexOf('}', open);
    if (close === -1) break;
    rules.push(css.slice(pos, close + 1));
    pos = close + 1;
  }
  return rules;
}

export function registerCssPropertyRules(css: string): void {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`style[${MARKER}]`)) return;

  const rules = extractPropertyRules(css);
  if (rules.length === 0) return;

  const style = document.createElement('style');
  style.setAttribute(MARKER, '');
  style.textContent = rules.join('\n');
  document.head.appendChild(style);
}
