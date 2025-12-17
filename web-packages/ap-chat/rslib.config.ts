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
  },
  tools: {
    rspack: {
      resolve: {
        alias: {
          'react': require.resolve('react'),
          'react-dom': require.resolve('react-dom'),
        },
      },
      module: {
        parser: {
          javascript: {
            dynamicImportMode: 'eager',
          },
        },
      },
    },
  },
});
