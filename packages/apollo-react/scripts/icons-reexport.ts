#!/usr/bin/env tsx

/**
 * Write the per-icon `@uipath/apollo-react/icons/<Name>` subpaths into dist.
 *
 * The components live in `@uipath/apollo-ui-icons-react`. Each subpath is a thin
 * re-export of that package's module, so consumers mixing both import paths
 * still get a single copy of every icon.
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const SOURCE = '@uipath/apollo-ui-icons-react';
const SOURCE_DIR = path.dirname(require.resolve(SOURCE));
const OUTPUT_DIR = path.join(__dirname, '../dist/icons');

const names = fs
  .readdirSync(SOURCE_DIR)
  .filter((file) => file.endsWith('.d.ts') && file !== 'index.d.ts')
  .map((file) => file.slice(0, -'.d.ts'.length));

if (names.length === 0) {
  console.error(
    `❌ No icon modules found in ${SOURCE_DIR}. Build @uipath/apollo-ui-icons-react first.`
  );
  process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const name of names) {
  const target = `${SOURCE}/${name}`;
  const esm = `export * from '${target}';\nexport { default } from '${target}';\n`;
  fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.js`), esm, 'utf8');
  fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.d.ts`), esm, 'utf8');
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${name}.cjs`),
    `module.exports = require('${target}');\n`,
    'utf8'
  );
}

console.log(`✅ Wrote ${names.length} icon subpath re-exports → ${OUTPUT_DIR}`);
