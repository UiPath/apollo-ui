import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { compile } from 'tailwindcss';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

async function build(candidates: string[]) {
  const compiler = await compile('@import "tailwindcss";\n@import "./tailwind.utilities.css";', {
    base: __dirname,
    loadStylesheet: async (id, base) => {
      const path = id.startsWith('.')
        ? resolve(base, id)
        : require.resolve(id === 'tailwindcss' ? 'tailwindcss/index.css' : id);
      return { path, base: dirname(path), content: readFileSync(path, 'utf8') };
    },
  });
  return compiler.build(candidates);
}

/** The declarations of the first rule whose selector contains `selector`. */
function rule(css: string, selector: string) {
  const start = css.indexOf(selector);
  if (start < 0) return '';
  return css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
}

describe('enter and exit animation utilities', () => {
  it('plays the enter and exit keyframes', async () => {
    const css = await build(['data-[state=open]:animate-in', 'animate-out']);
    expect(css).toContain('@keyframes apollo-enter');
    expect(css).toContain('@keyframes apollo-exit');
    expect(rule(css, '.animate-out')).toContain('animation: apollo-exit');
    expect(rule(css, '.data-\\[state\\=open\\]\\:animate-in')).toContain('apollo-enter');
  });

  it('turns them off for reduced motion outside any layer, for every variant', async () => {
    const css = await build(['data-[state=open]:animate-in']);
    const start = css.indexOf("[class~='animate-in']");
    expect(start).toBeGreaterThan(-1);
    // Unlayered: the rule sits after the utilities layer has closed, not inside it.
    const utilities = css.indexOf('@layer utilities');
    const layerEnd = css.indexOf('\n}\n', utilities);
    expect(start).toBeGreaterThan(layerEnd);
    expect(css.slice(css.lastIndexOf('@media', start), start)).toContain('prefers-reduced-motion');
    expect(css.slice(start)).toMatch(/\[class\*=':animate-in'\][^{]*{\s*animation: none/);
  });

  it.each([
    ['fade-in-0', '--tw-enter-opacity: calc(0 / 100)'],
    ['fade-out-0', '--tw-exit-opacity: calc(0 / 100)'],
    ['zoom-in-95', '--tw-enter-scale: calc(95 / 100)'],
    ['zoom-out-95', '--tw-exit-scale: calc(95 / 100)'],
    ['slide-in-from-top-2', '--tw-enter-translate-y: calc(2 * var(--spacing) * -1)'],
    ['slide-in-from-right-2', '--tw-enter-translate-x: calc(2 * var(--spacing))'],
    ['slide-in-from-right', '--tw-enter-translate-x: 100%'],
    ['slide-out-to-left', '--tw-exit-translate-x: -100%'],
    ['slide-out-to-left-1/2', '--tw-exit-translate-x: calc(1 / 2 * -100%)'],
    ['slide-in-from-top-[48%]', '--tw-enter-translate-y: calc(48% * -1)'],
  ])('%s sets %s', async (candidate, declaration) => {
    const css = await build([candidate]);
    expect(css.replace(/\s+/g, ' ')).toContain(declaration);
  });
});
