import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

function tsconfigAliases(): { find: string; replacement: string }[] {
  // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- tsconfig.json paths are a static string map
  const tsconfig = JSON.parse(
    readFileSync(new URL("./tsconfig.json", import.meta.url), "utf8"),
  ) as { compilerOptions: { paths: Record<string, string[]> } };
  const aliases: { find: string; replacement: string }[] = [];
  for (const [key, targets] of Object.entries(tsconfig.compilerOptions.paths)) {
    const target = targets[0];
    if (!target) continue;
    const find = key.endsWith("/*") ? key.slice(0, -2) : key;
    const replacement = resolve(
      __dirname,
      target.endsWith("/*") ? target.slice(0, -2) : target,
    );
    aliases.push({ find, replacement });
  }
  aliases.sort(
    (left, right) => String(right.find).length - String(left.find).length,
  );
  return aliases;
}

export default defineConfig({
  resolve: {
    alias: tsconfigAliases(),
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
