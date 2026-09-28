import type { RslibConfig } from '@rslib/core';
import { defineConfig } from '@rslib/core';

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
      types: './src/types.ts',
    },
  },
  output: {
    target: 'web',
    cleanDistPath: true,
  },
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
