/**
 * Fails if a generator placeholder is left anywhere a person reads or the
 * app ships: code, registry.json, locales, and docs. The occupant generator
 * marks every value it can't know with the same token, so nothing unfinished
 * gets through. Runs as part of `lint`.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// Split so this file doesn't flag itself.
export const PLACEHOLDER = ["@fill", "in"].join("-");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIRECTORIES = ["app", "registry", "lib", "templates", "hooks", "tests"];
const FILES = ["registry.json", "locales/en.json"];
const EXTENSIONS = /\.(ts|tsx|mdx|md|json|css)$/;

function* walk(dir: string): Generator<string> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (EXTENSIONS.test(entry)) yield path;
  }
}

const found: string[] = [];
const paths = [
  ...DIRECTORIES.flatMap((d) => [...walk(join(root, d))]),
  ...FILES.map((f) => join(root, f)),
];
for (const path of paths) {
  readFileSync(path, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (line.includes(PLACEHOLDER))
        found.push(`${relative(root, path)}:${i + 1}: ${line.trim()}`);
    });
}

if (found.length) {
  console.error(
    `Unfilled placeholders (${PLACEHOLDER}):\n  ${found.join("\n  ")}`,
  );
  process.exit(1);
}
console.log("No unfilled placeholders.");
