#!/usr/bin/env tsx
/**
 * Publish a package with a dev version suffix to GitHub Package Registry.
 *
 * Dev versions are internal-only prereleases used by PR previews. They are
 * not published to npm.org — public npm is reserved for production releases
 * via release.yml.
 *
 * Usage: pnpm publish:dev <package-name> <suffix>
 * Example: pnpm publish:dev @uipath/apollo-react test
 *   -> Publishes @uipath/apollo-react@3.19.3-test to GitHub Package Registry
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { findPackagePath, getAllPackageNames, type PackageJson } from './package-utils.js';

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

  const ghToken = process.env.GH_NPM_REGISTRY_TOKEN;
  if (!ghToken) {
    console.error('Error: GH_NPM_REGISTRY_TOKEN environment variable is required.');
    console.error('');
    console.error('To publish to GitHub Package Registry, you need a GitHub token.');
    console.error('Set it with:');
    console.error('  export GH_NPM_REGISTRY_TOKEN=your_github_token_here');
    process.exit(1);
  }

  if (!/^@uipath\/[a-z0-9-]+$/.test(packageName)) {
    console.error(`Error: Invalid package name "${packageName}". Must be @uipath/<name> (lowercase, hyphens only).`);
    process.exit(1);
  }

  // Validate suffix (alphanumeric, may contain hyphens and dots, must not start with hyphen/dot)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(suffix)) {
    console.error(
      `Error: Invalid suffix "${suffix}". Suffix must start with alphanumeric and contain only letters, digits, hyphens, or dots.`
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
    pkg.version = devVersion;
    writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Updated version to ${devVersion}`);

    console.log('\nPublishing with tag "dev" to GitHub Package Registry...');

    execFileSync(
      'pnpm',
      ['publish', '--no-git-checks', '--access', 'public', '--tag', 'dev', '--registry=https://npm.pkg.github.com'],
      {
        cwd: packagePath,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_AUTH_TOKEN: ghToken,
          GH_NPM_REGISTRY_TOKEN: ghToken,
        },
      }
    );

    console.log(`\n✓ Successfully published ${packageName}@${devVersion} to GitHub Package Registry`);
  } catch (error) {
    console.error('\n✗ Publish failed');
    console.error(error);
    process.exitCode = 1;
  } finally {
    writeFileSync(packageJsonPath, originalContent);
    console.log(`Restored original version (${originalVersion})`);
  }
}

main();
