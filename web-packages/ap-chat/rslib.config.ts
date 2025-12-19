import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  plugins: [pluginReact()],
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
      bundle: true,
      autoExternal: false,
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
      bundle: true,
      autoExternal: false,
    },
  ],
  source: {
    entry: {
      index: './src/index.ts',
      service: './src/service.ts',
    },
  },
  output: {
    target: 'web',
    minify: {
      js: true,
      css: true,
    },
    sourceMap: {
      js: 'source-map',
    },
  },
  tools: {
    rspack: (config) => {
      // Add bundle analyzer when ANALYZE env var is set
      if (process.env.ANALYZE) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins = config.plugins || [];
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: 'bundle-report.html',
            openAnalyzer: true,
          })
        );
      }

      return {
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            'react': require.resolve('react'),
            'react-dom': require.resolve('react-dom'),
          },
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
          parser: {
            javascript: {
              dynamicImportMode: 'eager',
            },
          },
        },
      };
    },
  },
});
