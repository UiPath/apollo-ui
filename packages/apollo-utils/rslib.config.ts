import { defineConfig } from '@rslib/core';

import { pluginYalcPush } from '../../scripts/plugin-yalc-push';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      output: {
        distPath: {
          root: './dist',
        },
      },
      dts: true,
    },
    {
      format: 'cjs',
      output: {
        distPath: {
          root: './dist',
        },
      },
      dts: false,
    },
  ],
  source: {
    entry: {
      index: './src/index.ts',
    },
  },
  output: {
    target: 'web',
  },
  plugins: [
    ...(process.env.YALC_PUSH === 'true' ? [pluginYalcPush('@uipath/apollo-utils')] : []),
  ],
});
