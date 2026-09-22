// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { distTheme, packageRoot } from './ensure-dist';

describe('theme.css', () => {
  it('ships Vertex tokens including AI gradient and insight palette from dist', async () => {
    const css = await readFile(distTheme, 'utf8');
    expect(css).toContain('@theme inline');
    expect(css).toContain(':root');
    expect(css).toContain('.dark');
    expect(css).toContain('--primary:');
    expect(css).toContain('--ai-gradient');
    expect(css).toMatch(/--insight-600:/);
  });
});

describe('package.json public API', () => {
  it('exports the root barrel, CSS files, and optional-peer subpaths', () => {
    const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('@uipath/apollo-vertex');
    expect(pkg.sideEffects).toEqual(['**/*.css']);
    expect(Object.keys(pkg.exports).sort()).toEqual([
      '.',
      './ai-chat',
      './charts',
      './feature-flags',
      './feature-flags/proteus',
      './locales/*',
      './shell',
      './shell/entities',
      './solution-tests',
      './solution-tests/data',
      './tailwind.css',
      './theme.css',
    ]);
    expect(pkg.exports['./button']).toBeUndefined();
    expect(pkg.exports['./components/ui/*']).toBeUndefined();
    expect(pkg.peerDependencies.react).toBe('>=19.0.0');
    expect(pkg.peerDependencies['react-dom']).toBe('>=19.0.0');
  });
});
