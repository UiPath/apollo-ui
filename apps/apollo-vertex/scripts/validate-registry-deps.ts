/**
 * Validates that registry.json is properly configured.
 *
 * Structure validation:
 * 1. Every component must have a name
 * 2. Every component must have files array with at least one file
 * 3. Each file must have path and type properties
 * 4. No duplicate component names
 * 5. File paths must start with "registry/"
 *
 * Dependency validation:
 * 1. All declared files must exist on disk
 * 2. All declared registryDependencies must exist in the registry
 * 3. All imports from other registry components must be declared in registryDependencies
 * 4. All declared registryDependencies must be imported (bidirectional check)
 * 5. All imports from npm packages must be declared in dependencies
 * 6. All declared npm dependencies must exist in package.json
 *
 * Note: We don't check "declared npm → imported" because dependencies can include
 * legitimate peer dependencies (e.g., date-fns for react-day-picker).
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LOCAL_REGISTRY_SCOPE = "@uipath/";

// Packages that are expected to exist (not declared per-component)
const IMPLICIT_PACKAGES = new Set([
  "react",
  "react-dom",
  "next",
  "next/link",
  "next/image",
  "next/navigation",
  "next/font",
]);

const VALID_FILE_TYPES = [
  "registry:ui",
  "registry:hook",
  "registry:lib",
  "registry:component",
  "registry:page",
  "registry:file",
  "registry:block",
  "registry:style",
];

interface RegistryFile {
  path?: string;
  type?: string;
  target?: string;
}

interface RegistryItem {
  name?: string;
  type?: string;
  files?: RegistryFile[];
  dependencies?: string[];
  registryDependencies?: string[];
}

interface Registry {
  items?: RegistryItem[];
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
    console.error(
      `Failed to read ${name} at ${path}:`,
      (error as Error).message,
    );
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

function getPackageFromImport(importPath: string): string | null {
  // Skip relative imports
  if (importPath.startsWith(".") || importPath.startsWith("/")) {
    return null;
  }
  // Skip @/ alias imports (internal registry imports)
  if (importPath.startsWith("@/")) {
    return null;
  }
  // Handle scoped packages: @scope/package
  if (importPath.startsWith("@")) {
    const parts = importPath.split("/");
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return null;
  }
  // Handle regular packages
  const parts = importPath.split("/");
  return parts[0];
}

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

function parseImports(filePath: string): Set<string> {
  const imports = new Set<string>();

  if (!existsSync(filePath)) {
    return imports;
  }

  const content = readFileSync(filePath, "utf-8");

  const importRegex = /import\s+(?:[\s\S]*?)\s+from\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(content)) !== null) {
    imports.add(match[1]);
  }

  const dynamicImportRegex = /import\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.add(match[1]);
  }

  return imports;
}

function getRegistryImports(
  item: RegistryItem,
  registryComponentNames: Set<string>,
): Set<string> {
  const componentImports = new Set<string>();

  if (!item.files || !item.name) {
    return componentImports;
  }

  for (const file of item.files) {
    if (!file.path) continue;
    const filePath = join(__dirname, "..", file.path);
    const imports = parseImports(filePath);

    for (const importPath of imports) {
      const componentName = extractComponentFromImport(importPath);
      if (componentName && registryComponentNames.has(componentName)) {
        if (componentName !== item.name) {
          componentImports.add(componentName);
        }
      }
    }
  }

  return componentImports;
}

function getNpmImports(
  item: RegistryItem,
  installedPackages: Set<string>,
): Set<string> {
  const npmImports = new Set<string>();

  if (!item.files) {
    return npmImports;
  }

  for (const file of item.files) {
    if (!file.path) continue;
    const filePath = join(__dirname, "..", file.path);
    const imports = parseImports(filePath);

    for (const importPath of imports) {
      const npmPackage = getPackageFromImport(importPath);
      if (
        npmPackage &&
        !IMPLICIT_PACKAGES.has(npmPackage) &&
        !IMPLICIT_PACKAGES.has(importPath) &&
        installedPackages.has(npmPackage)
      ) {
        npmImports.add(npmPackage);
      }
    }
  }

  return npmImports;
}

function normalizeRegistryDep(dep: string): string | null {
  if (isRemoteUrl(dep)) {
    return null;
  }
  if (isLocalScopedPackage(dep)) {
    return stripLocalScope(dep);
  }
  if (isScopedPackage(dep)) {
    return null;
  }
  return dep;
}

function main(): void {
  const registry = readJsonFile<Registry>(registryPath, "registry.json");
  const packageJson = readJsonFile<PackageJson>(
    packageJsonPath,
    "package.json",
  );

  const errors: string[] = [];

  // Validate registry structure
  if (!registry.items || !Array.isArray(registry.items)) {
    errors.push("registry.json must have an 'items' array");
    console.error("Registry validation failed:\n");
    console.error(`  ✗ ${errors[0]}`);
    process.exit(1);
  }

  // Check for duplicate names
  const seenNames = new Map<string, number>();
  for (let i = 0; i < registry.items.length; i++) {
    const item = registry.items[i];
    if (item.name) {
      if (seenNames.has(item.name)) {
        errors.push(
          `Duplicate component name "${item.name}" at indices ${seenNames.get(item.name)} and ${i}`,
        );
      } else {
        seenNames.set(item.name, i);
      }
    }
  }

  const registryComponentNames = new Set(
    registry.items
      .filter((item) => item.name)
      .map((item) => item.name as string),
  );
  const installedPackages = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ]);

  for (let i = 0; i < registry.items.length; i++) {
    const item = registry.items[i];
    const itemId = item.name ? `"${item.name}"` : `at index ${i}`;

    // Check required name
    if (
      !item.name ||
      typeof item.name !== "string" ||
      item.name.trim() === ""
    ) {
      errors.push(`Component ${itemId} is missing required 'name' property`);
      continue; // Can't do further validation without name
    }

    // Check required files array
    if (!item.files || !Array.isArray(item.files)) {
      errors.push(`Component "${item.name}" is missing required 'files' array`);
      continue;
    }

    if (item.files.length === 0) {
      errors.push(
        `Component "${item.name}" has empty 'files' array - must have at least one file`,
      );
      continue;
    }

    // Validate each file
    for (let j = 0; j < item.files.length; j++) {
      const file = item.files[j];

      // Check required path
      if (!file.path || typeof file.path !== "string") {
        errors.push(
          `Component "${item.name}" file at index ${j} is missing required 'path' property`,
        );
        continue;
      }

      // Check path starts with registry/
      if (!file.path.startsWith("registry/")) {
        errors.push(
          `Component "${item.name}" file "${file.path}" must be in the registry/ folder`,
        );
      }

      // Check required type
      if (!file.type || typeof file.type !== "string") {
        errors.push(
          `Component "${item.name}" file "${file.path}" is missing required 'type' property`,
        );
      } else if (!VALID_FILE_TYPES.includes(file.type)) {
        errors.push(
          `Component "${item.name}" file "${file.path}" has invalid type "${file.type}". Valid types: ${VALID_FILE_TYPES.join(", ")}`,
        );
      }

      // Check file exists on disk
      const filePath = join(__dirname, "..", file.path);
      if (!existsSync(filePath)) {
        errors.push(
          `Component "${item.name}" declares file "${file.path}" which does not exist`,
        );
      }
    }

    // Validate registryDependencies
    const declaredDeps = new Set<string>();
    if (item.registryDependencies) {
      if (!Array.isArray(item.registryDependencies)) {
        errors.push(
          `Component "${item.name}" has invalid 'registryDependencies' - must be an array`,
        );
      } else {
        for (const dep of item.registryDependencies) {
          if (typeof dep !== "string") {
            errors.push(
              `Component "${item.name}" has non-string registryDependency`,
            );
            continue;
          }
          const normalized = normalizeRegistryDep(dep);
          if (normalized) {
            declaredDeps.add(normalized);
            if (!registryComponentNames.has(normalized)) {
              errors.push(
                `Component "${item.name}" declares registryDependency "${dep}" but "${normalized}" does not exist in the registry`,
              );
            }
          }
        }
      }
    }

    // Check actual imports match declared registryDependencies
    const actualImports = getRegistryImports(item, registryComponentNames);
    for (const importedComponent of actualImports) {
      if (!declaredDeps.has(importedComponent)) {
        errors.push(
          `Component "${item.name}" imports "${importedComponent}" but it's not declared in registryDependencies`,
        );
      }
    }

    // Check declared registryDependencies are actually imported (bidirectional)
    for (const declaredDep of declaredDeps) {
      if (!actualImports.has(declaredDep)) {
        errors.push(
          `Component "${item.name}" declares "${declaredDep}" in registryDependencies but doesn't import it`,
        );
      }
    }

    // Check npm imports are declared in dependencies
    const npmImports = getNpmImports(item, installedPackages);
    const declaredNpmDeps = new Set(
      (item.dependencies ?? []).map(extractPackageName),
    );
    for (const imported of npmImports) {
      if (!declaredNpmDeps.has(imported)) {
        errors.push(
          `Component "${item.name}" imports "${imported}" but it's not declared in dependencies`,
        );
      }
    }

    // Validate npm dependencies
    if (item.dependencies) {
      if (!Array.isArray(item.dependencies)) {
        errors.push(
          `Component "${item.name}" has invalid 'dependencies' - must be an array`,
        );
      } else {
        for (const dep of item.dependencies) {
          if (typeof dep !== "string") {
            errors.push(`Component "${item.name}" has non-string dependency`);
            continue;
          }
          const packageName = extractPackageName(dep);
          if (!installedPackages.has(packageName)) {
            errors.push(
              `Component "${item.name}" declares dependency "${packageName}" which is not in package.json`,
            );
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error("Registry validation failed:\n");
    for (const error of errors) {
      console.error(`  ✗ ${error}`);
    }
    console.error(`\n${errors.length} error(s) found.`);
    process.exit(1);
  }

  console.log(
    `✓ Registry validation passed (${registry.items.length} components checked)`,
  );
}

main();
