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
