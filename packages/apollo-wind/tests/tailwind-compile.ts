import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { compile } from 'tailwindcss';

const require = createRequire(import.meta.url);
const STYLES = resolve(__dirname, '../src/styles');

/** Compiles Tailwind with apollo-wind's utilities for the given class candidates. */
export async function buildTailwind(candidates: string[]) {
  const compiler = await compile('@import "tailwindcss";\n@import "./tailwind.utilities.css";', {
    base: STYLES,
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
export function ruleBody(css: string, selector: string) {
  const start = css.indexOf(selector);
  if (start < 0) return '';
  return css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
}
