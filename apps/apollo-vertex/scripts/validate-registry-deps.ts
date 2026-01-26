/**
 * Validates that all dependencies in registry.json are properly declared.
 *
 * Checks:
 * 1. All `registryDependencies` that are local must exist in the registry
 *    Per shadcn docs, registryDependencies supports 3 formats:
 *    - Local: "button", "tooltip" → must exist as registry component names
 *    - Namespaced: "@uipath/use-local-storage" → skipped (external registry)
 *    - Remote URL: "https://example.com/r/item.json" → skipped (external)
 * 2. All `dependencies` reference packages in package.json
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

interface RegistryItem {
  name: string;
  dependencies?: string[];
  registryDependencies?: string[];
}

interface Registry {
  items: RegistryItem[];
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const registryPath = join(__dirname, "../registry.json");
const packageJsonPath = join(__dirname, "../package.json");

function readJsonFile<T>(path: string, name: string): T {
  let content: string;
  try {
    content = readFileSync(path, "utf-8");
  } catch (error) {
    console.error(`Failed to read ${name} at ${path}:`, (error as Error).message);
    process.exit(1);
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to parse ${name}:`, (error as Error).message);
    process.exit(1);
  }
}

function extractPackageName(dep: string): string {
  // Handle version specifiers like "react-day-picker@latest" or "recharts@2.15.4"
  const atIndex = dep.lastIndexOf("@");
  // Check if @ is not the first character (scoped package like @radix-ui/react-slot)
  if (atIndex > 0) {
    return dep.substring(0, atIndex);
  }
  return dep;
}

function isScopedPackage(dep: string): boolean {
  return dep.startsWith("@");
}

function isRemoteUrl(dep: string): boolean {
  return dep.startsWith("http://") || dep.startsWith("https://");
}

function main(): void {
  const registry = readJsonFile<Registry>(registryPath, "registry.json");
  const packageJson = readJsonFile<PackageJson>(packageJsonPath, "package.json");

  const registryComponentNames = new Set(registry.items.map((item) => item.name));
  const installedPackages = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ]);

  const errors: string[] = [];

  for (const item of registry.items) {
    // Check registryDependencies
    // Supports 3 formats per shadcn docs:
    // 1. Local items: "button", "input" → must exist in registry
    // 2. Namespaced items: "@acme/input-form" → external registry refs, skip
    // 3. Remote URLs: "https://example.com/r/item.json" → external, skip
    if (item.registryDependencies) {
      for (const dep of item.registryDependencies) {
        if (isScopedPackage(dep) || isRemoteUrl(dep)) {
          // External registry references handled by shadcn CLI - skip validation
          continue;
        }
        // Non-scoped, non-URL names should be local registry components
        if (!registryComponentNames.has(dep)) {
          errors.push(
            `Component "${item.name}" has registryDependency "${dep}" which does not exist in the registry`,
          );
        }
      }
    }

    // Check dependencies (npm packages)
    if (item.dependencies) {
      for (const dep of item.dependencies) {
        const packageName = extractPackageName(dep);
        if (!installedPackages.has(packageName)) {
          errors.push(
            `Component "${item.name}" has dependency "${packageName}" which is not in package.json`,
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error("Registry dependency validation failed:\n");
    for (const error of errors) {
      console.error(`  ✗ ${error}`);
    }
    console.error(`\n${errors.length} error(s) found.`);
    process.exit(1);
  }

  console.log(
    `✓ Registry dependency validation passed (${registry.items.length} components checked)`,
  );
}

main();
