import { pluginReact } from "@rsbuild/plugin-react";
import { defineConfig, type RslibConfig } from "@rslib/core";

export default defineConfig({
  lib: [
    {
      format: "esm",
      bundle: false,
      dts: { distPath: "./dist" },
      output: { filename: { js: "[name].js" } },
    },
  ],
  source: {
    entry: {
      index: [
        "./entries/**/*.ts",
        "./registry/**/*.{ts,tsx}",
        "./lib/**/*.ts",
        "!./**/*.d.ts",
        "!./**/*.test.{ts,tsx}",
        "!./**/*.mock.ts",
      ],
    },
    tsconfigPath: "./tsconfig.build.json",
  },
  plugins: [pluginReact()],
  output: {
    target: "web",
    cleanDistPath: true,
    distPath: { root: "./dist" },
    // Locale JSON ships as-is; the consumer's bundler loads it. Keeping the
    // import external stops rslib from rewriting `en.json` to `en.js`.
    externals: [/\/locales\/[^/]+\.json$/],
    copy: [
      { from: "./locales", to: "./locales" },
      { from: "./styles/tailwind.css", to: "./tailwind.css" },
      // Generated from registry.json by scripts/generate-theme-css.ts.
      { from: "./styles/theme.css", to: "./theme.css" },
    ],
  },
} satisfies RslibConfig);
