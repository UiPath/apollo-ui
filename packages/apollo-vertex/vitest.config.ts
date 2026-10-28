import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
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
