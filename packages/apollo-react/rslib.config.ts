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
      components: './src/components/index.ts',
      theme: './src/theme/index.ts',
    },
  },
  output: {
    target: 'web',
    copy: [{ from: '../apollo-core/dist/theme.css', to: './theme.css' }],
  },
  plugins: [pluginReact()],
});
