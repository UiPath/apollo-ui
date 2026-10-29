import { pluginReact } from '@rsbuild/plugin-react';
import type { LibConfig, RslibConfig } from '@rslib/core';
import { defineConfig } from '@rslib/core';

const formats = [
  { format: 'esm', js: '[name].js' },
  { format: 'cjs', js: '[name].cjs' },
] as const;

// Bundleless, so each icon is its own module behind `@uipath/apollo-ui-icons-react/<Name>`.
// Each format gets its own declarations with extensioned imports (`.d.ts` → `.js`, `.d.cts` →
// `.cjs`), which node16/nodenext resolution needs for both `import` and `require`.
const libs: LibConfig[] = formats.map(({ format, js }) => ({
  format,
  bundle: false,
  output: { distPath: { root: './dist' }, filename: { js } },
  dts: { autoExtension: true },
  redirect: { dts: { extension: true } },
  source: { entry: { index: ['./src/**', '!./src/.cache'] } },
}));

export default defineConfig({
  lib: libs,
  plugins: [pluginReact()],
  output: { target: 'web', cleanDistPath: true },
} satisfies RslibConfig);
