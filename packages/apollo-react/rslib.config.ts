import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';

const enableAnalyzer = process.env['ANALYZE'] === 'true';

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
        opts.plugins?.push('@lingui/babel-plugin-lingui-macro');
        return opts;
      },
    }),
  ],
  output: {
    target: 'web',
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
      ...(enableAnalyzer
        ? {
            plugins: [
              new BundleAnalyzerPlugin({
                analyzerMode: 'static',
                openAnalyzer: true,
                reportFilename: '../bundle-report.html',
              }),
            ],
          }
        : {}),
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
});
