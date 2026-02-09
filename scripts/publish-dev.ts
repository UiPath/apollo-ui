#!/usr/bin/env tsx
/**
 * Publish a package with a dev version suffix.
 *
 * Usage: pnpm publish:dev <package-name> <suffix>
 * Example: pnpm publish:dev @uipath/apollo-react test
 *   -> Publishes @uipath/apollo-react@3.19.3-test
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { type PackageJson, findPackagePath, getAllPackageNames } from './package-utils.js';

function main() {
  // Validate authentication token is available
  const token = process.env.NPM_AUTH_TOKEN || process.env.NPM_TOKEN;
  if (!token) {
    console.error('Error: NPM_AUTH_TOKEN or NPM_TOKEN environment variable is required.');
    console.error('');
    console.error('To publish to npm.org, you need an npm automation token.');
    console.error('Set it with:');
    console.error('  export NPM_AUTH_TOKEN=your_npm_token_here');
    console.error('');
    console.error('See CONTRIBUTING.md for instructions on creating an npm token.');
    process.exit(1);
  }

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
    // Update version
    pkg.version = devVersion;
    writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Updated version to ${devVersion}`);

    // Publish with 'dev' tag to avoid affecting 'latest'
    // Note: Assumes package is already built (run `pnpm build` first)
    console.log('\nPublishing with tag "dev" to npm.org...');

    // Use --@uipath:registry= to override .npmrc scope registry (pnpm 10.5.0+)
    execFileSync(
      'pnpm',
      [
        'publish',
        '--no-git-checks',
        '--access', 'public',
        '--tag', 'dev',
        '--@uipath:registry=https://registry.npmjs.org'
      ],
      {
        cwd: packagePath,
        stdio: 'inherit',
        env: {
          ...process.env,
          NPM_AUTH_TOKEN: token,
          NODE_AUTH_TOKEN: token,
        },
      }
    );

    console.log(`\nSuccessfully published ${packageName}@${devVersion}`);

  } catch (error) {
    console.error('\nPublish failed:', error);
    process.exitCode = 1;
  } finally {
    // Restore original version
    writeFileSync(packageJsonPath, originalContent);
    console.log(`Restored original version (${originalVersion})`);
  }
}

main();
