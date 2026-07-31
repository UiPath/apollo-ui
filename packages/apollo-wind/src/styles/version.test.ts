import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { renderVersionCss } from '../../scripts/generate-version-css.mjs';

const packageRoot = resolve(__dirname, '../..');
const version = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'))
  .version as string;
const generatedCss = readFileSync(resolve(packageRoot, 'src/styles/version.generated.css'), 'utf8');

describe('--apollo-wind-version', () => {
  it('exposes the token in the generated stylesheet', () => {
    expect(generatedCss).toContain('--apollo-wind-version:');
  });

  it('matches the current package.json version (regenerate via `pnpm build` if this fails)', () => {
    expect(generatedCss).toBe(renderVersionCss(version));
    expect(generatedCss).toContain(`--apollo-wind-version: "${version}";`);
  });
});
