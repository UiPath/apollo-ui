/**
 * PostCSS plugin: confine Tailwind's Preflight reset to the DOM a consumer renders.
 *
 * A micro-frontend's CSS lands in its host's document. Preflight is written for a page you own:
 * left global it restyles the host's markup, and its `[hidden] { display: none !important }` beats
 * the host's own unlayered `display` rules. This plugin wraps the Preflight rules, and the bare `*`
 * resets apollo-wind adds to `@layer base`, in `@scope (roots) { … }`, so they match only inside the
 * consumer's own root elements.
 *
 * `@scope` is the cheap way to do this. The older `X:where(R1, …, Rn, R1 *, …, Rn *)` wrapper makes
 * Chrome walk every element's ancestor chain once per root for every universal Preflight rule, which
 * showed up as 100+ ms style recalcs in Studio Web (MST-17369). Inside `@scope`, a bare selector
 * matches descendants of the root only, so each rule also gets an `X:where(:scope)` copy for the root
 * itself. `:where()` keeps Preflight at zero specificity, as upstream.
 *
 * Runs after Tailwind. Preflight is found by shape, not source file: Tailwind's production optimise
 * pass re-parses its output, so every rule reports the entry file as its source. The run starts at
 * the `::backdrop` box-sizing rule and ends at `[hidden]:where(:not([hidden=until-found]))`; if a
 * Tailwind update moves the end, the plugin throws rather than scope the rest of the base layer. If
 * the start moves, nothing is scoped: the test against real Tailwind output in `src/styles` is what
 * catches that, so keep it when bumping Tailwind.
 *
 * Two cascade details for consumers:
 *
 * - Scoping proximity ranks below specificity but above source order. A scoped Preflight
 *   declaration therefore beats an unscoped one of equal specificity in the same layer, whatever
 *   the order, which the old wrapper did not. Override Preflight from an unlayered rule or with
 *   higher specificity, not from a later rule in `@layer base`.
 * - Safari 26.0 to 26.3 do not apply `@scope` rules to elements with a UA shadow root (`input`,
 *   `textarea`; WebKit 305369, fixed in 26.4). Form controls render with UA styles there. Those
 *   versions are outside UiPath's support matrix (Safari: latest version only), and `@supports`
 *   cannot detect the bug, so there is no workaround.
 *
 * Usage, in a consumer's postcss config:
 *
 *   import apolloWind from '@uipath/apollo-wind/postcss';
 *   import scopePreflight from '@uipath/apollo-wind/postcss-scope-preflight';
 *   export default { plugins: [...apolloWind.plugins, scopePreflight({ roots: ['my-canvas', '[data-my-portal]'] })] };
 *
 * Anything the consumer portals onto `document.body` must carry one of the roots, or it renders
 * without Preflight. apollo-wind stamps `data-slot` on its components, including what it portals, so
 * `[data-slot]` is a sensible root for apollo-wind consumers.
 */

/**
 * @typedef {object} ScopePreflightOptions
 * @property {string[]} roots
 *   Selectors for the elements that own the consumer's DOM: web-component tags, portal markers,
 *   `[data-slot]`. Preflight applies to these elements and their descendants.
 * @property {string | false} [documentRoot]
 *   Preflight's `html, :host` rule sets the page font from `--font-sans`, a `:root` variable every
 *   consumer in a shared document redefines. By default the font declarations stay on the outermost
 *   root. Pass the selector of the element the consumer renders when it owns the whole document to
 *   apply them there only, so embedded roots inherit the host's font; pass `false` to drop them.
 */

/** Preflight's first rule: the `*, ::before, ::after, ::backdrop` box-sizing reset. */
const isPreflightStart = (/** @type {import('postcss').Rule} */ rule) =>
  rule.selectors.some((s) => s.trim() === '::backdrop') &&
  rule.some((d) => d.type === 'decl' && d.prop === 'box-sizing');

/** Preflight's last rule. */
const isPreflightEnd = (/** @type {import('postcss').Rule} */ rule) =>
  /^\[hidden\]:where\(:not\(\[hidden=["']?until-found["']?\]\)\)$/.test(rule.selector.trim());

/** @param {string} selector */
const isDocumentRoot = (selector) => selector === 'html' || selector === ':host';

/** The inherited typography `html, :host` sets; on an embedded root these follow the host instead. */
const DOCUMENT_FONT_PROPS = new Set([
  'font-family',
  'font-feature-settings',
  'font-variation-settings',
]);

// Tailwind's production pass prints `::before`/`::after` in their single-colon form; a pseudo-class
// after one is invalid, and the minifier empties it to `:where()`.
const LEGACY_PSEUDO_ELEMENT = /^:(before|after|first-line|first-letter)(?![\w-])/;

/**
 * Inserts `:where(:scope)` into the subject (last compound) of a selector, ahead of any pseudo-element.
 * @param {string} selector
 */
export function scopeSelector(selector) {
  const s = selector.trim();
  let depth = 0;
  let subjectStart = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (depth === 0 && (c === ' ' || c === '>' || c === '+' || c === '~'))
      subjectStart = i + 1;
  }
  depth = 0;
  for (let i = subjectStart; i < s.length; i++) {
    const c = s[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (
      depth === 0 &&
      c === ':' &&
      (s[i + 1] === ':' || LEGACY_PSEUDO_ELEMENT.test(s.slice(i)))
    )
      return `${s.slice(0, i)}:where(:scope)${s.slice(i)}`;
  }
  return `${s}:where(:scope)`;
}

/**
 * @param {ScopePreflightOptions} options
 * @returns {import('postcss').Plugin}
 */
const scopePreflight = (options) => {
  const roots = options?.roots?.map((r) => r.trim()).filter(Boolean) ?? [];
  if (roots.length === 0)
    throw new Error('scope-preflight: `roots` must list at least one selector');
  const { documentRoot } = options;

  const ROOTS = roots.join(', ');
  // The outermost root only: `html, :host` sets inherited typography, and on every nested root it
  // would override what the component's parent chose. Flat lists, no `:is()`: minifiers lower `:is()`
  // into `:-webkit-any()`/`:-moz-any()` copies.
  const SCOPE_TOP = `:where(${ROOTS}):where(:not(${roots.map((r) => `${r} *`).join(', ')}))`;

  /**
   * Rewrites one rule for use inside the `@scope` block: a `:where(:scope)` copy for the root, the
   * bare selector for its descendants.
   * @param {import('postcss').Rule} rule
   */
  const scopeRule = (rule) => {
    const selectors = rule.selectors.map((s) => s.trim());
    rule.selectors = [...selectors.map(scopeSelector), ...selectors];
  };

  /**
   * `html, :host` becomes a rule on the outermost root, outside the block. Its font declarations move
   * to `documentRoot`, or are dropped, when the consumer asked for that.
   * @param {import('postcss').Rule} rule
   * @param {import('postcss').Helpers} helpers
   */
  const scopeDocumentRule = (rule, { Rule }) => {
    if (documentRoot !== undefined) {
      const fontDecls = rule.nodes.filter(
        (n) => n.type === 'decl' && DOCUMENT_FONT_PROPS.has(n.prop)
      );
      for (const decl of fontDecls) decl.remove();
      if (documentRoot && fontDecls.length) {
        rule.after(
          new Rule({ selector: `:where(${documentRoot})`, nodes: fontDecls.map((d) => d.clone()) })
        );
      }
    }
    rule.selector = SCOPE_TOP;
    if (rule.nodes.length === 0) rule.remove();
  };

  return {
    postcssPlugin: 'scope-preflight',
    OnceExit(root, helpers) {
      const { AtRule } = helpers;
      root.walkAtRules('layer', (layer) => {
        if (layer.params !== 'base') return;
        // Collect the nodes to scope first, so the walk is not disturbed by the rewrite.
        /** @type {import('postcss').ChildNode[]} */
        const toScope = [];
        let inPreflight = false;
        for (const node of layer.nodes ?? []) {
          if (node.type === 'atrule') {
            if (inPreflight) toScope.push(node);
            continue;
          }
          if (node.type !== 'rule') continue;
          if (isPreflightStart(node)) inPreflight = true;
          if (inPreflight) {
            toScope.push(node);
            if (isPreflightEnd(node)) inPreflight = false;
          } else if (node.selector.trim() === '*') {
            // A bare `*` in the base layer (apollo-wind's `border-color`) is the same kind of page-wide reset.
            toScope.push(node);
          }
        }
        if (inPreflight) {
          // Scoping on to the end of the layer would also wrap the consumer's own base rules
          // (`body { … }` matches nothing inside a root), with no build error. Fail instead.
          throw layer.error(
            'scope-preflight: found the start of Preflight but not its last rule, `[hidden]:where(:not([hidden=until-found]))`. Tailwind may have changed Preflight; update isPreflightEnd.',
            { plugin: 'scope-preflight' }
          );
        }

        // One `@scope` block per run of consecutive nodes. Chrome resolves scope activations per
        // block, so hundreds of single-rule blocks cost measurably more than a handful.
        /** @type {import('postcss').AtRule | null} */
        let block = null;
        for (const node of toScope) {
          if (!block || node.prev() !== block) {
            block = new AtRule({ name: 'scope', params: `(${ROOTS})` });
            node.before(block);
          }
          if (node.type === 'rule' && node.selectors.map((s) => s.trim()).every(isDocumentRoot)) {
            // Stays outside the block, ahead of it, so its position in the cascade does not change.
            block.before(node);
            scopeDocumentRule(node, helpers);
            // The next node is still adjacent to the block.
            continue;
          }
          if (node.type === 'rule') scopeRule(node);
          else node.walkRules(scopeRule);
          block.append(node);
        }
      });
    },
  };
};
scopePreflight.postcss = true;

export default scopePreflight;
