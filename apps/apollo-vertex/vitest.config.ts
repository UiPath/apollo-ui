import { defineConfig } from "vitest/config";

export default defineConfig({
  // Vite 8 reads the tsconfig paths, so tests import as the app does.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: "node",
    passWithNoTests: true,
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary", "html", "lcov"],
      include: [
        "registry/composition/composition.ts",
        "templates/detail-page/detail-page.template.ts",
      ],
    },
  },
});
