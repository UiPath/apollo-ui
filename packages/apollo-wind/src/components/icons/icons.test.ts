import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// These are copies of the shared generator's output; `pnpm sync:icons` refreshes them.
const SOURCE_DIR = resolve(__dirname, '../../../../apollo-ui-icons-react/src');
const icons = readdirSync(__dirname).filter((file) => file.endsWith('.tsx'));

describe('Apollo icon copies', () => {
  it('has icons to check', () => {
    expect(icons.length).toBeGreaterThan(0);
  });

  it.each(icons)('%s matches @uipath/apollo-ui-icons-react', (file) => {
    expect(readFileSync(resolve(__dirname, file), 'utf8')).toBe(
      readFileSync(resolve(SOURCE_DIR, file), 'utf8')
    );
  });
});
