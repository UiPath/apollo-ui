#!/usr/bin/env tsx

/**
 * Copy icon components from @uipath/apollo-ui-icons-react into src/components/icons.
 *
 * apollo-wind compiles the few icons it uses into its own dist, so consumers don't install the
 * whole set. With no arguments this refreshes the icons already copied; names add those icons.
 *
 *   pnpm sync:icons            # refresh
 *   pnpm sync:icons ChevronUp  # add ChevronUp
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE_DIR = path.join(__dirname, '../../apollo-ui-icons-react/src');
const OUTPUT_DIR = path.join(__dirname, '../src/components/icons');

const copied = fs
  .readdirSync(OUTPUT_DIR)
  .filter((file) => file.endsWith('.tsx'))
  .map((file) => file.slice(0, -'.tsx'.length));
const names = [...new Set([...copied, ...process.argv.slice(2)])].sort();

const missing = names.filter((name) => !fs.existsSync(path.join(SOURCE_DIR, `${name}.tsx`)));
if (missing.length > 0) {
  console.error(`❌ Not in @uipath/apollo-ui-icons-react: ${missing.join(', ')}`);
  process.exit(1);
}

for (const name of names) {
  fs.copyFileSync(path.join(SOURCE_DIR, `${name}.tsx`), path.join(OUTPUT_DIR, `${name}.tsx`));
}

console.log(`✅ Synced ${names.length} icons → ${OUTPUT_DIR}`);
