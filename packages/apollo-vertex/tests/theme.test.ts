// @vitest-environment node
import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { beforeAll, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distTheme = join(root, 'dist/theme.css');

async function ensureDistTheme(): Promise<void> {
  try {
    await access(distTheme);
  } catch {
    await execFileAsync('pnpm', ['build'], { cwd: root });
  }
}

describe('theme.css', () => {
  beforeAll(async () => {
    await ensureDistTheme();
  }, 120_000);

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
  it('exports the root barrel and CSS files only', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('@uipath/apollo-vertex');
    expect(pkg.sideEffects).toEqual(['**/*.css']);
    expect(Object.keys(pkg.exports).sort()).toEqual(['.', './tailwind.css', './theme.css']);
    expect(pkg.exports['./button']).toBeUndefined();
    expect(pkg.exports['./components/ui/*']).toBeUndefined();
    expect(pkg.peerDependencies.react).toBe('>=19.0.0');
    expect(pkg.peerDependencies['react-dom']).toBe('>=19.0.0');
  });
});
