import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const alias: Record<string, string> = {
  "@": resolve(__dirname, "."),
};

// Optional peer, not installed in this repo. Knip reads this config, so the
// stand-in is only registered when Vitest itself is running.
if (process.env.VITEST === "true") {
  alias["@uipath/proteus-client"] = resolve(
    __dirname,
    "registry/feature-flag-provider/proteus-client.mock.ts",
  );
}

export default defineConfig({
  resolve: {
    alias,
  },
  test: {
    environment: "jsdom",
    include: [
      "registry/**/*.test.tsx",
      "registry/**/*.test.ts",
      "lib/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary", "html", "lcov"],
    },
  },
});
