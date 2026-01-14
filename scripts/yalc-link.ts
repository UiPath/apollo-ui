#!/usr/bin/env tsx
/**
 * Smart yalc linking that automatically handles workspace dependencies
 * Usage: tsx scripts/yalc-link.ts [package-name]
 * Example: tsx scripts/yalc-link.ts apollo-react
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

interface PackageJson {
  name: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface PackageInfo {
  name: string;
  shortName: string;
  path: string;
}

/**
 * Dynamically discover all packages in the packages directory
 */
function discoverPackages(): Map<string, PackageInfo> {
  const packagesDir = resolve(rootDir, 'packages');
  const packageMap = new Map<string, PackageInfo>();

  try {
    const entries = readdirSync(packagesDir);

    for (const entry of entries) {
      const packagePath = join(packagesDir, entry);

      // Skip if not a directory
      if (!statSync(packagePath).isDirectory()) {
        continue;
      }

      const pkgJsonPath = join(packagePath, 'package.json');

      try {
        const pkgJson: PackageJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
        const shortName = pkgJson.name.replace('@uipath/apollo-', '');

        packageMap.set(shortName, {
          name: pkgJson.name,
          shortName,
          path: `packages/${entry}`,
        });
      } catch (error) {
        // Skip directories without valid package.json
        console.warn(`⚠️  Skipping ${entry}: invalid package.json`);
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to discover packages: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return packageMap;
}

/**
 * Get workspace dependencies from package.json
 */
function getWorkspaceDeps(
  packagePath: string,
  packageMap: Map<string, PackageInfo>,
): string[] {
  const pkgJsonPath = resolve(rootDir, packagePath, 'package.json');
  const pkgJson: PackageJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));

  const workspaceDeps: string[] = [];

  for (const deps of [pkgJson.dependencies, pkgJson.devDependencies]) {
    if (!deps) continue;

    for (const [name, version] of Object.entries(deps)) {
      if (version === 'workspace:*' && name.startsWith('@uipath/apollo-')) {
        const shortName = name.replace('@uipath/apollo-', '');
        if (packageMap.has(shortName)) {
          workspaceDeps.push(shortName);
        }
      }
    }
  }

  return workspaceDeps;
}

/**
 * Check if a package is already published to yalc
 */
function isPublishedToYalc(packageName: string): boolean {
  try {
    const output = execSync('yalc installations show', {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return output.includes(packageName);
  } catch {
    return false;
  }
}

/**
 * Build and publish a package to yalc (only if not already published)
 */
function buildAndPublish(packageInfo: PackageInfo, force = false): void {
  const pkgPath = resolve(rootDir, packageInfo.path);

  // Skip if already published to yalc (unless forced)
  if (!force && isPublishedToYalc(packageInfo.name)) {
    console.log(`\n✅ ${packageInfo.name} already in yalc, skipping build`);
    return;
  }

  console.log(`\n🔨 Building ${packageInfo.name}...`);
  try {
    execSync('pnpm build', { cwd: pkgPath, stdio: 'inherit' });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to build ${packageInfo.name}: ${errorMessage}`);
  }

  console.log(`📦 Publishing ${packageInfo.name} to yalc...`);
  try {
    execSync('yalc publish', { cwd: pkgPath, stdio: 'inherit' });
    console.log(`✅ ${packageInfo.name} published`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to publish ${packageInfo.name}: ${errorMessage}`);
  }
}

/**
 * Link packages with dependency resolution
 */
function linkPackage(
  packageShortName: string,
  packageMap: Map<string, PackageInfo>,
  visited = new Set<string>(),
): void {
  if (visited.has(packageShortName)) {
    return;
  }
  visited.add(packageShortName);

  const packageInfo = packageMap.get(packageShortName);
  if (!packageInfo) {
    throw new Error(`Unknown package: ${packageShortName}`);
  }

  // Get workspace dependencies
  const workspaceDeps = getWorkspaceDeps(packageInfo.path, packageMap);

  // Link dependencies first (depth-first)
  for (const dep of workspaceDeps) {
    linkPackage(dep, packageMap, visited);
  }

  // Build and publish if not already in yalc
  buildAndPublish(packageInfo);
}

// Main execution
const packageArg = process.argv[2];
const packageMap = discoverPackages();

if (!packageArg) {
  console.error('Usage: tsx scripts/yalc-link.ts <package-name>');
  console.error(
    `Available packages: ${Array.from(packageMap.keys()).join(', ')}`,
  );
  process.exit(1);
}

// Handle different input formats: apollo-react, @uipath/apollo-react, or just react
let packageShortName = packageArg
  .replace(/^@uipath\/apollo-/, '') // Remove @uipath/apollo- prefix
  .replace(/^apollo-/, ''); // Remove apollo- prefix if still present

const packageInfo = packageMap.get(packageShortName);

if (!packageInfo) {
  console.error(`❌ Unknown package: ${packageShortName}`);
  console.error(
    `Available packages: ${Array.from(packageMap.keys()).join(', ')}`,
  );
  process.exit(1);
}

console.log(`🔗 Linking ${packageInfo.name} with dependencies...\n`);

try {
  linkPackage(packageShortName, packageMap);

  console.log('\n✨ All packages built and published to yalc!');
  console.log('\nTo use in your project:');
  console.log('  cd /path/to/your/project');
  console.log(`  yalc add ${packageInfo.name}`);

  const deps = getWorkspaceDeps(packageInfo.path, packageMap);
  for (const dep of deps) {
    const depInfo = packageMap.get(dep);
    if (depInfo) {
      console.log(`  yalc add ${depInfo.name}`);
    }
  }

  console.log('  npm install');
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`\n❌ Linking failed: ${errorMessage}`);
  console.log(
    '💡 Tip: Run "yalc installations clean" to remove partial installations',
  );
  process.exit(1);
}
