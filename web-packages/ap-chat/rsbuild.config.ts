import { createRequire } from 'node:module';

import type { RsbuildConfig } from '@rsbuild/core';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const require = createRequire(import.meta.url);
const isProd = process.env.NODE_ENV === 'production';

const config: RsbuildConfig = defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: isProd
      ? {
          index: './src/index.ts',
          service: './src/service.ts',
        }
      : {
          index: './src/dev.ts',
        },
  },
  dev: {
    hmr: true,
  },
  server: {
    host: 'localhost',
    port: 3000,
    open: true,
  },
  output: isProd
    ? {
        target: 'web',
        distPath: {
          root: 'dist',
          js: '.',
          css: 'static/css',
        },
        filename: {
          js: '[name].js',
        },
        minify: true,
        sourceMap: {
          js: 'hidden-source-map',
          css: false,
        },
        filenameHash: false,
        cleanDistPath: true,
      }
    : {
        target: 'web',
        distPath: {
          root: 'dist',
        },
        minify: false,
        sourceMap: {
          js: 'cheap-module-source-map',
          css: true,
        },
        filenameHash: false,
        cleanDistPath: true,
        assetPrefix: '/',
      },
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
      override: {
        chunks: 'all',
        minSize: 500000,
        maxSize: 1000000,
      },
    },
  },
  tools: {
    htmlPlugin: isProd ? false : true, // Disable HTML plugin in production
    rspack: async (config, { isProd: rsbuildIsProd }) => {

      // Add bundle analyzer when BUNDLE_ANALYZE env var is set
      if (process.env.BUNDLE_ANALYZE) {
        try {
          // @ts-expect-error - webpack-bundle-analyzer doesn't have TypeScript definitions
          const { BundleAnalyzerPlugin } = await import('webpack-bundle-analyzer');
          config.plugins = config.plugins || [];
          (config.plugins as unknown[]).push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              reportFilename: '../bundle-report.html',
              openAnalyzer: true,
              generateStatsFile: true,
              statsFilename: '../bundle-stats.json',
            })
          );
        } catch (error) {
          console.warn('Failed to load bundle analyzer:', error);
        }
      }

      return {
        ...config,
        optimization: {
          ...config.optimization,
          moduleIds: 'deterministic',
          chunkIds: 'named',
          usedExports: rsbuildIsProd,
          sideEffects: false,
          minimize: rsbuildIsProd,
        },
        resolve: {
          ...config.resolve,
          alias: {
            ...config.resolve?.alias,
            react: require.resolve('react'),
            'react-dom': require.resolve('react-dom'),
            '@emotion/react': require.resolve('@emotion/react'),
            '@emotion/styled': require.resolve('@emotion/styled'),
          },
          extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
        },
        module: {
          ...config.module,
          rules: [
            ...(config.module?.rules || []),
            {
              // Support importing CSS as raw strings for Shadow DOM injection
              test: /\.css$/,
              resourceQuery: /raw/,
              type: 'asset/source',
            },
          ],
        },
        snapshot: {
          ...config.snapshot,
          module: {
            hash: true,
            timestamp: true,
          },
          resolve: {
            hash: true,
            timestamp: true,
          },
        },
        output: {
          ...config.output,
          library: {
            type: 'module',
          },
          // Shorter chunk filenames
          chunkFilename: rsbuildIsProd
            ? 'static/js/[name].[contenthash:6].js'
            : 'static/js/[name].js',
        },
        experiments: {
          ...config.experiments,
          outputModule: true,
        },
      };
    },
  },
});

export default config;
