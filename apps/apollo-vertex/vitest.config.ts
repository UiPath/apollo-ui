import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    // The tsconfig paths the unit-tested specs import. Most specific first.
    alias: [
      {
        find: "@/lib/composition",
        replacement: root("./registry/composition/composition.ts"),
      },
      { find: /^@\/registry\//, replacement: `${root("./registry")}/` },
      { find: /^@\/templates\//, replacement: `${root("./templates")}/` },
    ],
  },
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
