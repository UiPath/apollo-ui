import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: {
    compilerOptions: {
      // rollup-plugin-dts creates programs without a tsconfig project context,
      // so we explicitly disable composite/incremental just for the DTS pass.
      composite: false,
      incremental: false,
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', '@uipath/apollo-wind-css'],
  treeshake: true,
  minify: false, // Set to true for production
});
