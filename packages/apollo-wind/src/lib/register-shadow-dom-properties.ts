/**
 * Register Tailwind v4 `@property` CSS declarations at the document level.
 *
 * Tailwind v4 emits `@property` at-rules (e.g. `@property --tw-border-style`)
 * that define initial values for intermediate custom properties used by
 * composable utilities (border, shadow, ring, transform). Browsers register
 * `@property` rules globally — but silently **ignore** them when they appear
 * inside a shadow root's `<style>` element.
 *
 * This means any Tailwind utility that chains through `--tw-*` variables
 * breaks inside shadow DOM: `border`, `shadow-*`, `ring-*`, `translate-*`,
 * etc. produce no visible effect because the intermediate properties are
 * unregistered and fall back to the CSS "guaranteed-invalid" value.
 *
 * This helper extracts `@property` declarations from a CSS string and injects
 * them into `document.head` so they register at the global scope where shadow
 * DOM can see them.
 *
 * @see https://github.com/tailwindlabs/tailwindcss/discussions/16772
 *
 * @example
 * ```ts
 * import { registerCssPropertyRules } from '@uipath/apollo-wind';
 * import css from '@uipath/apollo-react/canvas/styles/tailwind.canvas.css?raw';
 *
 * // Call once at app startup — idempotent, safe to call multiple times.
 * registerCssPropertyRules(css);
 * ```
 */

const PROPERTY_RE = /@property\s+(--[\w-]+)\s*\{[^}]+\}/g;
const MARKER = 'data-tw-property-rules';

export function registerCssPropertyRules(css: string): void {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`style[${MARKER}]`)) return;

  const rules: string[] = [];
  let match: RegExpExecArray | null;
  PROPERTY_RE.lastIndex = 0;
  while ((match = PROPERTY_RE.exec(css)) !== null) {
    rules.push(match[0]);
  }
  if (rules.length === 0) return;

  const style = document.createElement('style');
  style.setAttribute(MARKER, '');
  style.textContent = rules.join('\n');
  document.head.appendChild(style);
}
