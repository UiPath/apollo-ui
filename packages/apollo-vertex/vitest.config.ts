import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // tsconfig maps `@/*` and each `@/components/ui/*` import to its registry
    // folder, so component tests can render components that import siblings.
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    include: ["registry/**/*.test.tsx", "lib/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary", "html", "lcov"],
    },
  },
});
