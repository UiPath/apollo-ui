// @vitest-environment node
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function isExternal(id: string): boolean {
  if (id.startsWith('\0')) {
    return false;
  }
  if (id.startsWith('@/')) {
    return false;
  }
  if (id.includes(`${root}/src`) || id.includes(`${root}/dist`)) {
    return false;
  }
  if (id.includes('node_modules')) {
    return true;
  }
  return !id.startsWith('.') && !id.startsWith('/');
}

describe('Vite tree-shaking', () => {
  it('drops DataTable when importing only Button from the root barrel', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'apollo-vertex-treeshake-'));
    const entry = join(dir, 'entry.js');
    await writeFile(
      entry,
      `import { Button } from ${JSON.stringify(join(root, 'src/index.ts'))};\nexport { Button };\n`
    );

    try {
      await build({
        configFile: false,
        logLevel: 'error',
        resolve: {
          alias: {
            '@': join(root, 'src'),
          },
        },
        build: {
          outDir: join(dir, 'out'),
          emptyOutDir: true,
          minify: false,
          write: true,
          lib: {
            entry,
            formats: ['es'],
            fileName: () => 'bundle.js',
          },
          rollupOptions: {
            external: isExternal,
          },
        },
      });

      const bundle = await readFile(join(dir, 'out/bundle.js'), 'utf8');

      expect(bundle).toMatch(/Button/);
      expect(bundle).toContain('data-slot');
      expect(bundle).not.toMatch(/function DataTable\b/);
      expect(bundle).not.toContain('DataTablePagination');
      expect(bundle).not.toContain('useDataTable');
      expect(bundle).not.toContain('SidebarProvider');
      expect(bundle).not.toContain('sortable-column-list');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('keeps the published index as named re-exports, not one concatenated chunk', async () => {
    const indexSource = await readFile(join(root, 'src/index.ts'), 'utf8');
    expect(indexSource).toContain("export * from './components/ui/button'");
    expect(indexSource).toContain("export * from './components/ui/data-table'");
    expect(indexSource).not.toContain('function Button');
    expect(indexSource).not.toContain('bg-primary');
  });
});
