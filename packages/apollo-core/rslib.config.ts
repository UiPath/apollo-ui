import type { RslibConfig } from '@rslib/core';
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
        filename: {
          js: '[name].js',
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
        filename: {
          js: '[name].cjs',
        },
      },
      dts: false,
    },
  ],
  source: {
    entry: {
      index: './src/index.ts',
      'tokens/index': './src/tokens/index.ts',
      'tokens/jss/palette': './src/tokens/jss/palette.ts',
      'icons/index': './src/icons/index.ts',
    },
  },
  output: {
    target: 'web',
    cleanDistPath: true,
    copy: [
      { from: './src/icons/svg', to: './icons/svg' },
      { from: './src/tokens/scss', to: './tokens/scss' },
      { from: './src/tokens/less', to: './tokens/less' },
      { from: './src/tokens/css', to: './tokens/css' },
      {
        from: './src/fonts',
        to: './fonts',
        globOptions: {
          ignore: ['**/*.base-css', '**/postcss.config.js']
        }
      },
    ],
  },
  plugins: [
    ...(process.env.YALC_PUSH === 'true' ? [pluginYalcPush('@uipath/apollo-core')] : []),
  ],
  tools: {
    rspack: {
      resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      },
      optimization: {
        usedExports: true,
      },
    },
  },
} satisfies RslibConfig);
