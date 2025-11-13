import { defineConfig } from '@rslib/core';
import { pluginReact } from '@rsbuild/plugin-react';

const entry: Record<string, string> = {
  components: './src/components/index.ts',
  css: './src/css/index.ts',
};

export default defineConfig({
  lib: [
    {
      format: 'esm',
      source: {
        entry,
      },
      bundle: true,
      dts: true,
    },
    {
      format: 'cjs',
      source: {
        entry,
      },
      dts: false,
    },
  ],
  output: {
    target: 'web',
    cleanDistPath: true,
  },
  plugins: [pluginReact()],
});
