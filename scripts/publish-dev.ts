#!/usr/bin/env tsx
/**
 * Publish a package with a dev version suffix.
 *
 * Usage: pnpm publish:dev <package-name> <suffix>
 * Example: pnpm publish:dev @uipath/apollo-react test
 *   -> Publishes @uipath/apollo-react@3.19.3-test
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { type PackageJson, findPackagePath, getAllPackageNames } from './package-utils.js';

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: pnpm publish:dev <package-name> <suffix>');
    console.error('Example: pnpm publish:dev @uipath/apollo-react test');
    console.error('\nAvailable packages:');
    for (const name of getAllPackageNames()) {
      console.error(`  - ${name}`);
    }
    process.exit(1);
  }

  const [packageName, suffix] = args as [string, string];

  // Validate suffix (alphanumeric, may contain hyphens, must not start with hyphen)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(suffix)) {
    console.error(
      `Error: Invalid suffix "${suffix}". Suffix must start with alphanumeric and contain only letters, digits, or hyphens.`
    );
    process.exit(1);
  }

  // Find package
  const packagePath = findPackagePath(packageName);
  if (!packagePath) {
    console.error(`Error: Package "${packageName}" not found in monorepo.`);
    console.error('\nAvailable packages:');
    for (const name of getAllPackageNames()) {
      console.error(`  - ${name}`);
    }
    process.exit(1);
  }

  const packageJsonPath = join(packagePath, 'package.json');
  const originalContent = readFileSync(packageJsonPath, 'utf-8');
  const pkg = JSON.parse(originalContent) as PackageJson;
  const originalVersion = pkg.version;
  const devVersion = `${originalVersion}-${suffix}`;

  console.log(`\nPublishing ${packageName}@${devVersion}`);
  console.log(`Package path: ${packagePath}\n`);

  try {
    // Update version
    pkg.version = devVersion;
    writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Updated version to ${devVersion}`);

    // Publish with 'dev' tag to avoid affecting 'latest'
    // Note: Assumes package is already built (run `pnpm build` first)
    console.log('\nPublishing with tag "dev"...');
    try {
      execSync('pnpm publish --no-git-checks --access public --tag dev', {
        cwd: packagePath,
        stdio: 'inherit',
      });
    } catch {
      console.error(
        `\nPublish failed for ${packageName}. Check NPM_TOKEN permissions and registry access.`
      );
      process.exit(1);
    }

    console.log(`\nSuccessfully published ${packageName}@${devVersion}`);
  } catch (error) {
    console.error('\nUnexpected error:', error);
    process.exit(1);
  } finally {
    // Restore original version
    writeFileSync(packageJsonPath, originalContent);
    console.log(`\nRestored original version (${originalVersion})`);
  }
}

main();
