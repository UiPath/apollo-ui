import { pluginReact } from '@rsbuild/plugin-react';
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
      dts: {
        bundle: false,
      },
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
      components: './src/components/index.ts',
      theme: './src/theme/index.ts',
      core: './src/core/index.ts',
    },
  },
  plugins: [pluginReact()],
  output: {
    target: 'web',
    copy: [
      // Copy all token files from apollo-core to make them available at @uipath/apollo-react/core/tokens/*
      { from: '../apollo-core/dist/tokens/css', to: './core/tokens/css' },
      { from: '../apollo-core/dist/tokens/scss', to: './core/tokens/scss' },
      { from: '../apollo-core/dist/tokens/less', to: './core/tokens/less' },
      { from: '../apollo-core/dist/tokens/jss', to: './core/tokens/jss' },
      // Copy SVG icons to enable dynamic imports within apollo-react
      { from: '../apollo-core/dist/icons/svg', to: './icons/svg' },
    ],
  },
});
