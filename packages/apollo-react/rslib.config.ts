import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginReact } from '@rsbuild/plugin-react';
import type { RslibConfig } from '@rslib/core';
import { defineConfig } from '@rslib/core';

import { pluginCopyLocales } from './scripts/plugin-copy-locales';

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
        '!./src/**/locales/*.json',
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
    pluginCopyLocales(),
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
      // Copy fonts from apollo-core to make them available at @uipath/apollo-react/core/fonts/*
      { from: '../apollo-core/dist/fonts', to: './core/fonts' },
      // Copy xyflow CSS files to make them available at @uipath/apollo-react/canvas/xyflow/*
      { from: './node_modules/@xyflow/react/dist/style.css', to: './canvas/xyflow' },
      { from: './node_modules/@xyflow/react/dist/base.css', to: './canvas/xyflow' },
    ],
  },
  tools: {
    rspack: {
      resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
        alias: {
          '@uipath/apollo-react/icons': './src/icons/index.ts',
          '@uipath/apollo-react/material': './src/material/index.ts',
          '@uipath/apollo-react/material/theme': './src/material/theme/index.ts',
          '@uipath/apollo-react/material/components': './src/material/components/index.ts',
          '@uipath/apollo-react/canvas/xyflow/react': './src/canvas/xyflow/react.ts',
          '@uipath/apollo-react/canvas/xyflow/system': './src/canvas/xyflow/system.ts',
          '@uipath/apollo-react/canvas/layouts': './src/canvas/layouts/index.ts',
          '@uipath/apollo-react/canvas/hooks': './src/canvas/hooks/index.ts',
          '@uipath/apollo-react/canvas/utils': './src/canvas/utils/index.ts',
          '@uipath/apollo-react/canvas/controls': './src/canvas/controls/index.ts',
          '@uipath/apollo-react/canvas/components': './src/canvas/components/index.ts',
          '@uipath/apollo-react/canvas/icons': './src/canvas/icons/index.ts',
          '@uipath/apollo-react/canvas/types': './src/canvas/types.ts',
          '@uipath/apollo-react/canvas/constants': './src/canvas/constants.ts',
          '@uipath/apollo-react/canvas': './src/canvas/index.ts',
        },
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
