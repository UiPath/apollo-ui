/**
 * Generates index.json from registry.json for MCP server compatibility.
 *
 * The shadcn build command generates registry.json with metadata:
 *   { "$schema": "...", "name": "...", "items": [...] }
 *
 * MCP servers expect index.json as a flat array:
 *   [...]
 *
 * This script extracts the items array into index.json.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const registryPath = join(__dirname, "../public/r/registry.json");
const indexPath = join(__dirname, "../public/r/index.json");

let fileContent: string;
try {
  fileContent = readFileSync(registryPath, "utf-8");
} catch (error) {
  console.error(
    `Failed to read registry file at ${registryPath}:`,
    (error as Error).message,
  );
  process.exit(1);
}

let registry: { items: unknown[] };
try {
  registry = JSON.parse(fileContent);
} catch (error) {
  console.error("Failed to parse registry JSON:", (error as Error).message);
  process.exit(1);
}

try {
  writeFileSync(indexPath, JSON.stringify(registry.items, null, 2));
} catch (error) {
  console.error(
    `Failed to write index file at ${indexPath}:`,
    (error as Error).message,
  );
  process.exit(1);
}

console.log(`Generated ${indexPath} with ${registry.items.length} components`);
