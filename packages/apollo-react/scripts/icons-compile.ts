#!/usr/bin/env tsx
/**
 * Fast transpilation of individual icon files using esbuild
 * Much faster than rslib for 1,317+ files (~1s vs ~20s)
 */
import { build } from 'esbuild';
import { glob } from 'glob';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.resolve(__dirname, '../src/icons');
const DIST_ICONS_DIR = path.resolve(__dirname, '../dist/icons');

async function compileIcons() {
  console.log('🔨 Compiling icons with esbuild...');

  if (!fs.existsSync(DIST_ICONS_DIR)) {
    fs.mkdirSync(DIST_ICONS_DIR, { recursive: true });
  }

  const iconFiles = await glob('*.tsx', { cwd: ICONS_DIR, absolute: true });
  const indexFile = path.join(ICONS_DIR, 'index.ts');
  const allFiles = [...iconFiles, indexFile];

  // ESM build
  await build({
    entryPoints: allFiles,
    outdir: DIST_ICONS_DIR,
    format: 'esm',
    outExtension: { '.js': '.js' },
    bundle: false, // Key: don't bundle, preserve modules
    jsx: 'automatic',
    platform: 'browser',
    target: 'es2020',
    sourcemap: true,
  });

  // CJS build
  await build({
    entryPoints: allFiles,
    outdir: DIST_ICONS_DIR,
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
    bundle: false,
    jsx: 'automatic',
    platform: 'browser',
    target: 'es2020',
    sourcemap: true,
  });

  console.log(`✅ Compiled ${iconFiles.length} icons in <1s`);
}

compileIcons().catch((error) => {
  console.error('Failed to compile icons:', error);
  process.exit(1);
});
