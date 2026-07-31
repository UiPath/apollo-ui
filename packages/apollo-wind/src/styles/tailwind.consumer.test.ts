import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));

describe('tailwind.consumer.css', () => {
  it('includes Sonner structural styles for Shadow DOM consumers', () => {
    const css = readFileSync(resolve(here, 'tailwind.consumer.css'), 'utf8');

    expect(css).toContain('@import "sonner/dist/styles.css";');
  });
});
