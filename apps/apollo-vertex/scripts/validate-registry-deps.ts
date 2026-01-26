/**
 * Validates that all dependencies in registry.json are properly declared.
 *
 * Checks:
 * 1. All imports from other registry components must be declared in registryDependencies
 *    Import patterns detected:
 *    - @/components/ui/X → component "X"
 *    - @/registry/X/* → component "X"
 *    - @/components/X/* (non-ui) → component "X"
 *    - @/hooks/X → component "X" (hooks are also registry items)
 * 2. All declared registryDependencies must exist in the registry
 * 3. All declared dependencies must exist in package.json
 * 4. All declared files must exist on disk
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LOCAL_REGISTRY_SCOPE = "@uipath/";

interface RegistryFile {
  path: string;
  type: string;
}

interface RegistryItem {
  name: string;
  files?: RegistryFile[];
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

/**
 * Extract component name from an import path
 * Returns null if not a registry component import
 */
function extractComponentFromImport(importPath: string): string | null {
  // @/components/ui/X → "X"
  const uiMatch = importPath.match(/^@\/components\/ui\/([^/]+)/);
  if (uiMatch) {
    return uiMatch[1];
  }

  // @/registry/X/* → "X"
  const registryMatch = importPath.match(/^@\/registry\/([^/]+)/);
  if (registryMatch) {
    return registryMatch[1];
  }

  // @/components/X/* (non-ui) → "X"
  const componentsMatch = importPath.match(/^@\/components\/([^/]+)/);
  if (componentsMatch && componentsMatch[1] !== "ui") {
    return componentsMatch[1];
  }

  // @/hooks/X → "X"
  const hooksMatch = importPath.match(/^@\/hooks\/([^/]+)/);
  if (hooksMatch) {
    return hooksMatch[1];
  }

  return null;
}

/**
 * Parse imports from a TypeScript/JavaScript file
 * Returns set of import paths (the "from" part)
 */
function parseImports(filePath: string): Set<string> {
  const imports = new Set<string>();

  if (!existsSync(filePath)) {
    return imports;
  }

  const content = readFileSync(filePath, "utf-8");

  // Match import statements: import ... from "path" or import ... from 'path'
  const importRegex = /import\s+(?:[\s\S]*?)\s+from\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(content)) !== null) {
    imports.add(match[1]);
  }

  // Also match dynamic imports: import("path") or import('path')
  const dynamicImportRegex = /import\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.add(match[1]);
  }

  return imports;
}

/**
 * Get all registry component imports from a component's files
 */
function getRegistryImports(
  item: RegistryItem,
  registryComponentNames: Set<string>,
): Set<string> {
  const componentImports = new Set<string>();

  if (!item.files) {
    return componentImports;
  }

  for (const file of item.files) {
    const filePath = join(__dirname, "..", file.path);
    const imports = parseImports(filePath);

    for (const importPath of imports) {
      const componentName = extractComponentFromImport(importPath);
      if (componentName && registryComponentNames.has(componentName)) {
        // Don't count imports from the component's own folder
        if (componentName !== item.name) {
          componentImports.add(componentName);
        }
      }
    }
  }

  return componentImports;
}

/**
 * Normalize registry dependency to component name
 * Handles: "button", "@uipath/button", etc.
 */
function normalizeRegistryDep(dep: string): string | null {
  if (isRemoteUrl(dep)) {
    return null; // External URL
  }
  if (isLocalScopedPackage(dep)) {
    return stripLocalScope(dep);
  }
  if (isScopedPackage(dep)) {
    return null; // External registry
  }
  return dep;
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
    // Check that declared files exist
    if (item.files) {
      for (const file of item.files) {
        const filePath = join(__dirname, "..", file.path);
        if (!existsSync(filePath)) {
          errors.push(`Component "${item.name}" declares file "${file.path}" which does not exist`);
        }
      }
    }

    // Get declared registry dependencies (normalized to component names)
    const declaredDeps = new Set<string>();
    if (item.registryDependencies) {
      for (const dep of item.registryDependencies) {
        const normalized = normalizeRegistryDep(dep);
        if (normalized) {
          declaredDeps.add(normalized);
        }
      }
    }

    // Check that declared dependencies exist in registry
    for (const dep of declaredDeps) {
      if (!registryComponentNames.has(dep)) {
        const originalDep = item.registryDependencies?.find(
          (d) => normalizeRegistryDep(d) === dep,
        );
        errors.push(
          `Component "${item.name}" declares registryDependency "${originalDep}" but "${dep}" does not exist in the registry`,
        );
      }
    }

    // Check that actual imports are declared in registryDependencies
    const actualImports = getRegistryImports(item, registryComponentNames);
    for (const importedComponent of actualImports) {
      if (!declaredDeps.has(importedComponent)) {
        errors.push(
          `Component "${item.name}" imports "${importedComponent}" but it's not declared in registryDependencies`,
        );
      }
    }

    // Check dependencies (npm packages) exist in package.json
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
