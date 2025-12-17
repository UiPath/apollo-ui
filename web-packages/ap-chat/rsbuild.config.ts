import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './src/dev.ts',
    },
  },
  html: {
    title: 'AP Chat Development',
  },
  output: {
    target: 'web',
  },
  server: {
    port: 3000,
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
        rules: [
          {
            resourceQuery: /raw/,
            type: 'asset/source',
          },
        ],
      },
    },
  },
});
