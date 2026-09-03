import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fontFamily } from '../foundation/Future/typography';

const css = readFileSync(resolve(__dirname, './tailwind.consumer.css'), 'utf8');

/** Strips quotes and collapses whitespace so a TS stack and a CSS stack compare. */
const normalize = (stack: string) => stack.replace(/["']/g, '').replace(/\s+/g, ' ').trim();

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

describe('future theme typography', () => {
  const block =
    /body\.future-dark,\s*\.future-dark,\s*body\.future-light,\s*\.future-light\s*\{([^}]+)\}/g;
  const typography =
    [...css.matchAll(block)].map((m) => m[1]).find((b) => b.includes('--font-sans')) ?? '';

  it('finds the future theme block', () => {
    expect(typography).not.toBe('');
  });

  it('chains Inter through noto-sans to the bundled Noto CJK families', () => {
    // Neither Inter nor noto-sans covers CJK, so ja/ko/zh depend on
    // these four families being reachable. See apollo-core src/fonts/{JP,KR,SC,TC}.
    expect(typography).toMatch(
      /--font-sans:\s*Inter,\s*noto-sans,\s*"Noto Sans JP",\s*"Noto Sans KR",\s*"Noto Sans SC",\s*"Noto Sans TC",\s*system-ui,\s*sans-serif;/
    );
  });

  it('points every apollo-core sans token at --font-sans', () => {
    // Derived from apollo-core so a new token there fails here instead of
    // silently keeping the old stack.
    const core = readFileSync(
      resolve(__dirname, '../../../apollo-core/src/tokens/css/variables.css'),
      'utf8'
    );
    const sans = new Set(
      [...core.matchAll(/--(font-(?:[a-z0-9-]+-family|normal|title))\s*:/g)]
        .map((m) => m[1])
        .filter((t) => !t.startsWith('font-mono'))
    );

    expect(sans.size).toBeGreaterThan(20);
    for (const token of sans) {
      expect(typography).toContain(`--${token}: var(--font-sans);`);
    }
  });

  it('leaves monospace tokens alone', () => {
    expect(typography).not.toContain('--font-mono');
  });

  it('keeps typography.ts fontFamily.base in sync with --font-sans', () => {
    const cssStack = /--font-sans:\s*([^;]+);/.exec(typography)?.[1];

    expect(normalize(fontFamily.base)).toBe(normalize(cssStack ?? ''));
  });

  it('sets font-family in a repeated-class rule that outranks .apollo-design', () => {
    expect(typography).not.toMatch(/\n\s*font-family:/);
    expect(css).toMatch(
      /body\.future-dark\.future-dark,\s*\.future-dark\.future-dark,\s*body\.future-light\.future-light,\s*\.future-light\.future-light\s*\{\s*font-family:\s*var\(--font-sans\);\s*\}/
    );
  });
});
