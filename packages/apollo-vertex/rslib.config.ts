import { pluginReact } from '@rsbuild/plugin-react';
import type { RslibConfig } from '@rslib/core';
import { defineConfig } from '@rslib/core';

const externals = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  /^@uipath\/vs-core/,
  /^@uipath\/proteus-client/,
  /^@uipath\/uipath-typescript/,
  /^@tanstack\//,
  /^highlight\.js/,
  'recharts',
  'jwt-decode',
  'pkce-challenge',
  'react-error-boundary',
  '@ts-rest/core',
  'eventsource-parser',
  'eventsource-parser/stream',
  'react-markdown',
  'remark-breaks',
  'remark-gfm',
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
      dts: {
        build: true,
        distPath: './dist',
      },
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
        '!./src/**/*.test.ts',
        '!./src/**/*.test.tsx',
        '!./src/**/*.spec.ts',
        '!./src/**/*.spec.tsx',
        '!./src/styles/**',
        '!./src/locales/**',
        '!./src/types/**',
        '!./src/**/*.d.ts',
      ],
    },
  },
  plugins: [pluginReact()],
  output: {
    target: 'web',
    cleanDistPath: true,
    copy: [
      { from: './src/styles/theme.css', to: './theme.css' },
      { from: './src/styles/tailwind.css', to: './tailwind.css' },
      { from: './src/locales', to: './locales' },
    ],
  },
  tools: {
    rspack: {
      resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
        alias: {
          '@': './src',
        },
      },
    },
  },
} satisfies RslibConfig);
