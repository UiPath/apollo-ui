import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, './tailwind.consumer.css'), 'utf8');

const DARK_VARIANT =
  '@custom-variant dark (&:is(.dark:not(.react-flow), .dark-hc, .future-dark, .dark:not(.react-flow) *, .dark-hc *, .future-dark *));';

describe('tailwind.consumer.css dark variant', () => {
  it('overrides the built-in dark variant with a class-based selector', () => {
    expect(css).toContain(DARK_VARIANT);
  });

  it('declares the override after @import "tailwindcss" so it wins', () => {
    // Tailwind v4 resolves the last declaration of a variant name.
    expect(css.indexOf('@custom-variant dark')).toBeGreaterThan(
      css.indexOf('@import "tailwindcss"')
    );
  });

  it('does not gate theming on the OS colour scheme', () => {
    // Apollo semantic tokens switch on .dark / .dark-hc / .future-dark only.
    expect(css).not.toContain('prefers-color-scheme');
  });
});

describe('dark variant selector behaviour', () => {
  // Parsed from the stylesheet so these cases can't drift from what ships.
  const selector = /@custom-variant dark \((&:is\(.+\))\);/.exec(css)?.[1].replace(/^&/, '');

  const matches = (html: string) => {
    document.body.innerHTML = html;
    const target = document.querySelector('#target');
    if (!target || !selector) throw new Error('missing target or selector');
    return target.matches(selector);
  };

  it('activates inside a .dark subtree', () => {
    expect(matches('<div class="dark"><span id="target"></span></div>')).toBe(true);
  });

  it('activates inside a .dark-hc subtree', () => {
    expect(matches('<div class="dark-hc"><span id="target"></span></div>')).toBe(true);
  });

  it('activates inside a .future-dark subtree', () => {
    expect(matches('<div class="future-dark"><span id="target"></span></div>')).toBe(true);
  });

  it('activates on an element that is itself .dark', () => {
    expect(matches('<span id="target" class="dark"></span>')).toBe(true);
  });

  it('stays off in a light app when ReactFlow sets colorMode="dark"', () => {
    // Tokens deliberately ignore .dark.react-flow, so utilities must too.
    expect(matches('<div class="react-flow dark"><span id="target"></span></div>')).toBe(false);
  });

  it('stays on inside a ReactFlow canvas when the host app is dark', () => {
    expect(
      matches(
        '<div class="dark"><div class="react-flow light"><span id="target"></span></div></div>'
      )
    ).toBe(true);
  });

  it('excludes .react-flow only for .dark, matching apollo-core', () => {
    // Core writes :where(.dark-hc) with no exclusion, since ReactFlow's
    // colorMode prop only ever emits `light` or `dark`.
    expect(matches('<div class="react-flow dark-hc"><span id="target"></span></div>')).toBe(true);
  });

  it('stays off for the prototype-only .vertex / .canvas themes', () => {
    // Both are snapshots of the dark half of a two-mode source, so their
    // class names name a palette rather than a mode. See the css comment.
    expect(matches('<div class="vertex"><span id="target"></span></div>')).toBe(false);
    expect(matches('<div class="canvas"><span id="target"></span></div>')).toBe(false);
  });

  it('stays off with no theme class', () => {
    expect(matches('<span id="target"></span>')).toBe(false);
  });
});

describe('tailwind.consumer.css icon stroke default', () => {
  it('thins lucide icons to the design-system weight', () => {
    expect(css).toMatch(/svg\.lucide\[stroke-width="2"\]\s*\{\s*stroke-width:\s*1\.4;/);
  });

  it('declares the rule inside @layer base so utilities outrank it', () => {
    // stroke-* lands in `utilities`, which the cascade resolves after `base`
    // regardless of specificity — that is what makes stroke-2 an escape hatch.
    // Brace-match the block rather than compare offsets, so the assertion means
    // "contained in" and not merely "appears somewhere after".
    const open = css.indexOf('@layer base {');
    expect(open).toBeGreaterThan(-1);
    let depth = 0;
    let end = -1;
    for (let i = css.indexOf('{', open); i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}' && --depth === 0) {
        end = i;
        break;
      }
    }
    expect(end).toBeGreaterThan(open);
    const rule = css.indexOf('svg.lucide[stroke-width="2"]');
    expect(rule).toBeGreaterThan(open);
    expect(rule).toBeLessThan(end);
  });

  it('safelists stroke-2 so the escape hatch survives into the prebuilt css', () => {
    // Tailwind only emits utilities it finds while scanning source, and nothing
    // here writes stroke-2. Without this, consumers shipping the prebuilt
    // styles.css would have no way to keep an icon at weight 2.
    expect(css).toContain('@source inline("stroke-2");');
  });
});

describe('icon stroke selector behaviour', () => {
  // Parsed from the stylesheet so these cases can't drift from what ships.
  const selector = /(svg\.lucide\[stroke-width="2"\])\s*\{/.exec(css)?.[1];

  const matches = (html: string) => {
    document.body.innerHTML = html;
    const target = document.querySelector('#target');
    if (!target || !selector) throw new Error('missing target or selector');
    return target.matches(selector);
  };

  it('matches a lucide icon left at the default weight', () => {
    expect(matches('<svg id="target" class="lucide lucide-plus" stroke-width="2"></svg>')).toBe(
      true
    );
  });

  it('leaves a deliberate strokeWidth={0} alone', () => {
    // Filled glyphs set 0 and would grow an outline if the rule caught them.
    expect(matches('<svg id="target" class="lucide lucide-square" stroke-width="0"></svg>')).toBe(
      false
    );
  });

  it('leaves other deliberate weights alone', () => {
    for (const weight of ['1', '1.5', '2.5', '3']) {
      expect(
        matches(`<svg id="target" class="lucide lucide-check" stroke-width="${weight}"></svg>`)
      ).toBe(false);
    }
  });

  it('ignores svgs that are not lucide icons', () => {
    // recharts series, edge handles and hand-authored icons all carry
    // stroke-width="2" and default to 1 without it — they must not be caught.
    expect(matches('<svg id="target" stroke-width="2"></svg>')).toBe(false);
    expect(matches('<svg id="target" class="recharts-line" stroke-width="2"></svg>')).toBe(false);
  });
});
