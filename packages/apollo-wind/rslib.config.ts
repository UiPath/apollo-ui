import { readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const entry: Record<string, string> = {
  components: './src/components/index.ts',
  css: './src/css/index.ts',
};

export default defineConfig({
  lib: [
    {
      format: 'esm',
      source: {
        entry,
      },
      bundle: true,
      dts: true,
    },
    {
      format: 'cjs',
      source: {
        entry,
      },
      dts: false,
    },
  ],
  output: {
    target: 'web',
    cleanDistPath: true,
  },
  plugins: [
    pluginReact(),
    {
      name: 'copy-theme-selectors',
      setup(api) {
        api.onAfterBuild(() => {
          const source = resolve(__dirname, '../apollo-core/dist/tokens/css/theme-variables.css');
          const dest = resolve(__dirname, 'dist/theme-selectors.css');

          // Read the file and replace the relative import with apollo-core import
          let content = readFileSync(source, 'utf-8');
          content = content.replace(
            '@import "./variables.css";',
            '@import "@uipath/apollo-core/tokens/css/variables.css";'
          );

          writeFileSync(dest, content, 'utf-8');
          console.log('✓ Copied theme-selectors.css from apollo-core');
        });
      },
    },
  ],
});
