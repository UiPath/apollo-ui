import { defineConfig } from '@rslib/core';
import { pluginReact } from '@rsbuild/plugin-react';

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
  plugins: [pluginReact()],
});
