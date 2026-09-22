// @vitest-environment node
import { execFile } from 'node:child_process';
import { access } from 'node:fs/promises';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { build } from 'vite';
import { beforeAll, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distIndex = join(root, 'dist/index.js');

async function ensureDist(): Promise<void> {
  try {
    await access(distIndex);
  } catch {
    await execFileAsync('pnpm', ['build'], { cwd: root });
  }
}

function isExternal(id: string): boolean {
  if (id.startsWith('\0')) {
    return false;
  }
  if (id.includes(`${root}/dist`)) {
    return false;
  }
  if (id.includes('node_modules')) {
    return true;
  }
  return !id.startsWith('.') && !id.startsWith('/');
}

describe('Vite tree-shaking', () => {
  beforeAll(async () => {
    await ensureDist();
  }, 120_000);

  it('drops DataTable when importing only Button from the published dist barrel', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'apollo-vertex-treeshake-'));
    const entry = join(dir, 'entry.js');
    await writeFile(
      entry,
      `import { Button } from ${JSON.stringify(distIndex)};\nexport { Button };\n`
    );

    try {
      await build({
        configFile: false,
        logLevel: 'error',
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

  it('keeps the published dist index as named re-exports, not one concatenated chunk', async () => {
    const index = await readFile(distIndex, 'utf8');
    expect(index).toMatch(/export \* from ["']\.\/components\/ui\/button/);
    expect(index).toMatch(/export \* from ["']\.\/components\/ui\/data-table/);
    expect(index).not.toContain('function Button');
    expect(index).not.toContain('bg-primary');
    expect(index).not.toMatch(/export \{[^}]*\bFieldError\b/);
  });
});
