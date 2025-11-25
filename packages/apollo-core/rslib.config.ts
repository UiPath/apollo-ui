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
      tokens: './src/tokens/index.ts',
      icons: './src/icons/index.ts',
    },
  },
  output: {
    target: 'web',
    copy: [
      { from: './.tokens-temp/css', to: './tokens/css' },
      { from: './.tokens-temp/scss', to: './tokens/scss' },
      { from: './.tokens-temp/less', to: './tokens/less' },
      { from: './.tokens-temp/jss', to: './tokens/jss' },
      { from: './src/icons/svg', to: './icons/svg' },
    ],
  },
  tools: {
    rspack: {
      module: {
        rules: [
          {
            test: /\.svg$/,
            type: 'asset/source',
          },
        ],
      },
    },
  },
});
