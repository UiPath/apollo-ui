import { defineConfig } from '@rslib/core';

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
      tokens: './src/tokens/index.ts',
    },
  },
  output: {
    target: 'web',
    copy: [{ from: './src/theme.css', to: './theme.css' }],
  },
});
