import type { RslibConfig } from '@rslib/core';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      bundle: false,
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
      bundle: false,
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
    // Bundleless: one output file per source file.
    //
    // Bundle mode split the shared token code into numbered chunks plus an
    // `rslib-runtime.js` that re-exported `__webpack_require__`. Consumers
    // scope-hoisting that export hit a hard rspack panic
    // (`concatenated_module.rs`: "has no internal name") and their production
    // builds aborted. Bundleless emits no chunks and needs no runtime, so
    // nothing is left to hoist. The namespace re-exports in `tokens/index.ts`
    // (`export * as Colors from './Colors'`) are what pulled the webpack
    // helpers in, so keep this off bundle mode unless those change.
    entry: {
      index: ['./src/**/*.{ts,tsx}', '!./src/**/*.d.ts'],
    },
  },
  output: {
    target: 'web',
    cleanDistPath: true,
    copy: [
      // Deprecated: keeps `@uipath/apollo-core/icons/svg/*` resolving after the
      // icon set moved to @uipath/apollo-ui-icons. An `exports` map can only
      // point at files inside its own package, so the assets have to be present
      // here; flattened to match the paths consumers already import. Drop this
      // together with the ./icons entry in the next major.
      { from: '../apollo-ui-icons/src/svg/**/*.svg', to: './static/svg/[name][ext]' },
      { from: './src/tokens/scss', to: './tokens/scss' },
      // scss-static also lands in src/tokens/scss via build-tokens.js, but dev/watch
      // (rslib without build:tokens) copies a stale generated tree — this entry
      // guarantees the hand-written files always reach dist regardless.
      { from: './src/tokens/scss-static', to: './tokens/scss' },
      { from: './src/tokens/less', to: './tokens/less' },
      { from: './src/tokens/css', to: './tokens/css' },
      {
        from: './src/fonts',
        to: './fonts',
        globOptions: {
          ignore: ['**/*.base-css', '**/postcss.config.js']
        }
      },
    ],
  },
  tools: {
    rspack: {
      resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      },
      optimization: {
        usedExports: true,
      },
    },
  },
} satisfies RslibConfig);
