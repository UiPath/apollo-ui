import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/postcss';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

import scopePreflight, { scopeSelector } from '../../postcss-scope-preflight.js';

const ROOTS = ['my-canvas', '[data-my-portal]'];

/** The shape Tailwind v4 prints for Preflight, reduced to the rules the plugin treats specially. */
const PREFLIGHT = `
@layer theme { :root, :host { --font-sans: ui-sans-serif; } }
@layer base {
  *, :after, :before, ::backdrop, ::file-selector-button { box-sizing: border-box; margin: 0; border: 0 solid; }
  html, :host { line-height: 1.5; font-family: var(--font-sans); font-feature-settings: normal; tab-size: 4; }
  hr { height: 0; }
  @supports (not (-webkit-appearance: -apple-pay-button)) { ::placeholder { color: currentColor; } }
  button, input:where([type="button"]) { appearance: button; }
  [hidden]:where(:not([hidden="until-found"])) { display: none !important; }
  body { background: red; }
  * { border-color: var(--color-border-de-emp); }
}
@layer utilities { .flex { display: flex; } }
`;

const run = (css: string, options: Parameters<typeof scopePreflight>[0] = { roots: ROOTS }) =>
  postcss([scopePreflight(options)]).process(css, { from: undefined }).css;

const scopeBlocks = (css: string) => {
  const root = postcss.parse(css);
  const blocks: postcss.AtRule[] = [];
  root.walkAtRules('scope', (r) => blocks.push(r));
  return blocks;
};

describe('scopePreflight', () => {
  it('wraps the Preflight run and the bare `*` reset in @scope blocks with the given roots', () => {
    const out = run(PREFLIGHT);
    const blocks = scopeBlocks(out);
    expect(blocks.map((b) => b.params)).toEqual([
      '(my-canvas, [data-my-portal])',
      '(my-canvas, [data-my-portal])',
    ]);
    // Preflight (minus the html rule) is one block; `body` splits it from the `*` reset.
    const selectors = (b: postcss.AtRule) => {
      const out: string[] = [];
      b.walkRules((r) => out.push(r.selector));
      return out;
    };
    expect(selectors(blocks[0])).toHaveLength(5);
    expect(selectors(blocks[1])).toEqual(['*:where(:scope), *']);
  });

  it('gives every rule a `:where(:scope)` copy for the root and keeps the bare selector for descendants', () => {
    const out = run(PREFLIGHT);
    expect(out).toContain('hr:where(:scope), hr {');
    expect(out).toContain(
      'button:where(:scope), input:where([type="button"]):where(:scope), button, input:where([type="button"]) {'
    );
    expect(out).toContain(
      '[hidden]:where(:not([hidden="until-found"])):where(:scope), [hidden]:where(:not([hidden="until-found"])) {'
    );
  });

  it('puts the scope ahead of pseudo-elements, including the single-colon forms Tailwind prints', () => {
    const out = run(PREFLIGHT);
    expect(out).toContain(
      '*:where(:scope), :where(:scope):after, :where(:scope):before, :where(:scope)::backdrop, :where(:scope)::file-selector-button, *, :after, :before, ::backdrop, ::file-selector-button {'
    );
    expect(scopeSelector('input::-webkit-inner-spin-button')).toBe(
      'input:where(:scope)::-webkit-inner-spin-button'
    );
    expect(scopeSelector('a:first-letter')).toBe('a:where(:scope):first-letter');
    expect(scopeSelector(':-moz-focusring')).toBe(':-moz-focusring:where(:scope)');
  });

  it('nests at-rules inside the Preflight run in the block and scopes their rules', () => {
    const out = run(PREFLIGHT);
    const block = scopeBlocks(out)[0];
    const supports = block.nodes.find(
      (n) => n.type === 'atrule' && n.name === 'supports'
    ) as postcss.AtRule;
    expect(supports).toBeDefined();
    expect((supports.first as postcss.Rule).selector).toBe(
      ':where(:scope)::placeholder, ::placeholder'
    );
  });

  it('keeps `html, :host` outside the block, on the outermost root only', () => {
    const out = run(PREFLIGHT);
    expect(out).toContain(
      ':where(my-canvas, [data-my-portal]):where(:not(my-canvas *, [data-my-portal] *)) { line-height: 1.5; font-family: var(--font-sans); font-feature-settings: normal; tab-size: 4; }'
    );
    expect(out.indexOf(':where(my-canvas, [data-my-portal]):where(:not(')).toBeLessThan(
      out.indexOf('@scope')
    );
  });

  it('moves the font declarations to `documentRoot`, or drops them, when asked', () => {
    const withDocument = run(PREFLIGHT, { roots: ROOTS, documentRoot: '[data-my-document]' });
    expect(withDocument).toContain(
      ':where(my-canvas, [data-my-portal]):where(:not(my-canvas *, [data-my-portal] *)) { line-height: 1.5; tab-size: 4; }'
    );
    expect(withDocument).toContain(
      ':where([data-my-document]) { font-family: var(--font-sans); font-feature-settings: normal; }'
    );

    const dropped = run(PREFLIGHT, { roots: ROOTS, documentRoot: false });
    expect(dropped).toContain(
      ':where(my-canvas, [data-my-portal]):where(:not(my-canvas *, [data-my-portal] *)) { line-height: 1.5; tab-size: 4; }'
    );
    expect(dropped).not.toContain('font-family');
  });

  it('leaves everything else alone and never emits `:is()`', () => {
    const out = run(PREFLIGHT);
    expect(out).toContain('@layer theme { :root, :host { --font-sans: ui-sans-serif; } }');
    expect(out).toContain('body { background: red; }');
    expect(out).toContain('@layer utilities { .flex { display: flex; } }');
    expect(out).not.toContain(':is(');
    // No `R *` descendant lists inside the blocks: that is the walk `@scope` replaces.
    for (const block of scopeBlocks(out)) {
      block.walkRules((r) => expect(r.selector).not.toMatch(/[^\s,]\s+\*\s*(?:[,)]|$)/));
    }
  });

  it('requires at least one root', () => {
    expect(() => scopePreflight({ roots: [] })).toThrow(/roots/);
  });

  it('throws when Preflight starts but its last rule is missing, instead of scoping the rest of the layer', () => {
    const truncated = PREFLIGHT.replace(
      '[hidden]:where(:not([hidden="until-found"])) { display: none !important; }',
      ''
    );
    expect(() => run(truncated)).toThrow(/last rule/);
  });
});

/**
 * Against real Tailwind output, built as production so the optimiser has re-parsed it (single-colon
 * pseudo-elements, no source positions). The fixture above is what we think Preflight looks like;
 * this is what it does look like, and it is the test that fails when a Tailwind bump moves either
 * end of the run.
 */
describe('scopePreflight on Tailwind output', { timeout: 60_000 }, () => {
  const build = async () => {
    const from = resolve(__dirname, 'preflight-probe.css');
    const base = __dirname;
    const input =
      '@import "tailwindcss"; @layer base { * { border-color: red; } body { color: red; } }';
    const { root } = await postcss([
      tailwindcss({ base, optimize: { minify: true } }),
      scopePreflight({ roots: ROOTS }),
    ]).process(input, { from });
    return root;
  };

  it('confines every Preflight rule and the bare `*` reset to one @scope block, and leaves `body` alone', async () => {
    const root = await build();
    const blocks: postcss.AtRule[] = [];
    const unscoped: string[] = [];
    let scopedRules = 0;
    root.walkAtRules('layer', (layer) => {
      if (layer.params !== 'base') return;
      layer.walkAtRules('scope', (block) => {
        blocks.push(block);
        block.walkRules(() => scopedRules++);
      });
      layer.walkRules((rule) => {
        let inScope = false;
        for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) {
          if (p.type === 'atrule' && (p as postcss.AtRule).name === 'scope') inScope = true;
        }
        if (!inScope) unscoped.push(rule.selector);
      });
    });
    expect(blocks.map((b) => b.params)).toEqual(['(my-canvas, [data-my-portal])']);
    expect(scopedRules).toBeGreaterThan(40);
    // Only the document-root rule (moved onto the outermost root) and the consumer's own `body`.
    expect(unscoped).toEqual([
      ':where(my-canvas, [data-my-portal]):where(:not(my-canvas *, [data-my-portal] *))',
      'body',
    ]);
    const css = root.toString();
    expect(css).toMatch(
      /\[hidden\]:where\(:not\(\[hidden=until-found\]\)\):where\(:scope\),\s*\[hidden\]/
    );
    expect(css).toMatch(/\*:where\(:scope\),\s*\*\s*\{\s*border-color:\s*red/);
    // The minifier would turn `:before:where(:scope)` into `:where()`; the scope must come first.
    expect(css).not.toMatch(/:(before|after):where\(/);
    expect(css).not.toContain(':where()');
  });
});
