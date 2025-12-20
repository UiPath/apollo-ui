import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginReact } from '@rsbuild/plugin-react';
import type { RslibConfig } from '@rslib/core';
import { defineConfig } from '@rslib/core';

// Shared externals list to avoid duplication
const externals = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  '@emotion/react',
  '@emotion/styled',
  '@mui/material',
  '@mui/system',
  '@mui/icons-material',
  '@mui/x-tree-view',
  '@mui/x-date-pickers',
];

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
        externals,
      },
      dts: true,
      bundle: false,
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
        externals,
      },
      dts: false,
      bundle: false,
    },
  ],
  source: {
    entry: {
      index: [
        './src/**',
        '!./src/**/*.test.{ts,tsx}',
        '!./src/test/**',
        '!./src/icons/.cache',
        '!./src/**/*.md',
        '!./src/**/locales/*.js',
      ],
    },
  },
  plugins: [
    pluginReact(),
    pluginBabel({
      include: /\.(?:jsx?|tsx?)$/,
      babelLoaderOptions(opts) {
        // Ensure plugins array exists
        if (!opts.plugins) {
          opts.plugins = [];
        }
        opts.plugins.push('@lingui/babel-plugin-lingui-macro');
        return opts;
      },
    }),
  ],
  output: {
    target: 'web',
    cleanDistPath: true,
    copy: [
      // Copy all token files from apollo-core to make them available at @uipath/apollo-react/core/tokens/*
      { from: '../apollo-core/dist/tokens/css', to: './core/tokens/css' },
      { from: '../apollo-core/dist/tokens/scss', to: './core/tokens/scss' },
      { from: '../apollo-core/dist/tokens/less', to: './core/tokens/less' },
      { from: '../apollo-core/dist/tokens/jss', to: './core/tokens/jss' },
    ],
  },
  tools: {
    rspack: {
      resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      },
      module: {
        rules: [
          {
            test: /\.svg$/,
            use: ['@svgr/webpack'],
            type: 'javascript/auto',
          },
          {
            test: /\.json$/,
            type: 'asset/source',
          },
        ],
      },
    },
  },
} satisfies RslibConfig);
