/**
 * Validates that all dependencies in registry.json are properly declared.
 *
 * Checks:
 * 1. All declared registryDependencies must exist in the registry
 *    Per shadcn docs, registryDependencies supports these formats:
 *    - Local: "button", "tooltip" → must exist as registry component names
 *    - Namespaced @uipath: "@uipath/use-local-storage" → local, strip prefix and validate
 *    - Namespaced other: "@acme/component" → external registry, skip
 *    - Remote URL: "https://example.com/r/item.json" → external, skip
 * 2. All declared dependencies must exist in package.json
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LOCAL_REGISTRY_SCOPE = "@uipath/";

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

function isLocalScopedPackage(dep: string): boolean {
  return dep.startsWith(LOCAL_REGISTRY_SCOPE);
}

function stripLocalScope(dep: string): string {
  return dep.slice(LOCAL_REGISTRY_SCOPE.length);
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
    if (item.registryDependencies) {
      for (const dep of item.registryDependencies) {
        if (isRemoteUrl(dep)) {
          // Remote URLs are external - skip validation
          continue;
        }

        if (isScopedPackage(dep)) {
          if (isLocalScopedPackage(dep)) {
            // @uipath/* scoped items are local - strip prefix and validate
            const componentName = stripLocalScope(dep);
            if (!registryComponentNames.has(componentName)) {
              errors.push(
                `Component "${item.name}" declares registryDependency "${dep}" but "${componentName}" does not exist in the registry`,
              );
            }
          }
          // Other scoped packages are external registries - skip validation
          continue;
        }

        // Non-scoped names should be local registry components
        if (!registryComponentNames.has(dep)) {
          errors.push(
            `Component "${item.name}" declares registryDependency "${dep}" which does not exist in the registry`,
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
            `Component "${item.name}" declares dependency "${packageName}" which is not in package.json`,
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
