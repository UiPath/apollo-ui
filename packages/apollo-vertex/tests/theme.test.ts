// @vitest-environment node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('theme.css', () => {
  it('ships Vertex tokens including AI gradient and insight palette', () => {
    const css = readFileSync(join(root, 'src/styles/theme.css'), 'utf8');
    expect(css).toContain('@theme inline');
    expect(css).toContain(':root');
    expect(css).toContain('.dark');
    expect(css).toContain('--primary:');
    expect(css).toContain('--ai-gradient');
    expect(css).toMatch(/--insight-600:/);
  });
});

describe('package.json public API', () => {
  it('exports the root barrel and CSS files only', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('@uipath/apollo-vertex');
    expect(pkg.sideEffects).toEqual(['**/*.css']);
    expect(Object.keys(pkg.exports).sort()).toEqual(['.', './tailwind.css', './theme.css']);
    expect(pkg.exports['./button']).toBeUndefined();
    expect(pkg.exports['./components/ui/*']).toBeUndefined();
  });
});
