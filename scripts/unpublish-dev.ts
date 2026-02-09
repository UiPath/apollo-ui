#!/usr/bin/env tsx
/**
 * Unpublish a dev version of a package from npm registry.
 *
 * Usage: pnpm unpublish:dev <package-name> <suffix-or-version>
 * Example: pnpm unpublish:dev @uipath/apollo-react test
 *   -> Unpublishes @uipath/apollo-react@3.19.3-test
 *
 * Or with full version:
 * Example: pnpm unpublish:dev @uipath/apollo-react 3.19.3-test
 *   -> Unpublishes @uipath/apollo-react@3.19.3-test
 *
 * Requires NPM_AUTH_TOKEN environment variable.
 * Note: npm only allows unpublishing within 72 hours of publication.
 */

import { execFileSync } from 'node:child_process';
import { findPackageInfo, getAllPackageNames } from './package-utils.js';

async function unpublishPackageVersion(packageName: string, version: string): Promise<boolean> {
  const token = process.env.NPM_AUTH_TOKEN;
  if (!token) {
    console.error('Error: NPM_AUTH_TOKEN environment variable is required.');
    return false;
  }

  // Validate package name and version to prevent injection
  const packageRegex = /^@[\w-]+\/[\w-]+$/;
  const versionRegex = /^[\w.-]+$/;

  if (!packageRegex.test(packageName)) {
    console.error(`Invalid package name: ${packageName}`);
    return false;
  }

  if (!versionRegex.test(version)) {
    console.error(`Invalid version: ${version}`);
    return false;
  }

  try {
    const fullPackage = `${packageName}@${version}`;

    // First, check if package version exists on npm.org
    const encodedPackageName = packageName.replace('/', '%2F');
    const checkResponse = await fetch(
      `https://registry.npmjs.org/${encodedPackageName}/${version}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (checkResponse.status === 404) {
      console.log('✓ Already removed (not found on registry)');
      return true;
    }

    try {
      execFileSync(
        'pnpm',
        ['unpublish', fullPackage, '--@uipath:registry=https://registry.npmjs.org', '--force'],
        {
          stdio: 'pipe', // Capture output to show errors
          env: {
            ...process.env,
            NPM_AUTH_TOKEN: token,
            NODE_AUTH_TOKEN: token,
          },
        }
      );

      console.log('✓ Unpublished successfully');
      return true;
    } catch (execError: unknown) {
      // Extract error output from both stdout and stderr
      let errorOutput = '';
      if (execError && typeof execError === 'object') {
        if ('stderr' in execError && execError.stderr) {
          const stderr = execError.stderr;
          if (Buffer.isBuffer(stderr) || typeof stderr === 'string') {
            errorOutput += stderr.toString();
          }
        }
        if ('stdout' in execError && execError.stdout) {
          const stdout = execError.stdout;
          if (Buffer.isBuffer(stdout) || typeof stdout === 'string') {
            errorOutput += stdout.toString();
          }
        }
      }

      // Check if it's a 422 error (package too new, has dependents, etc.)
      const is422Error = errorOutput.includes('422') || errorOutput.includes('Unprocessable Entity');
      const isTooOldError = errorOutput.includes('72 hours') || errorOutput.includes('published more than');

      if (is422Error || isTooOldError) {
        console.log('⚠️  Unpublish rejected (422), deprecating instead...');

        try {
          execFileSync(
            'pnpm',
            ['deprecate', fullPackage, 'Dev package - use latest version', '--@uipath:registry=https://registry.npmjs.org'],
            {
              stdio: 'pipe', // Don't show npm output
              env: {
                ...process.env,
                NPM_AUTH_TOKEN: token,
                NODE_AUTH_TOKEN: token,
              },
            }
          );
          console.log('✓ Deprecated successfully');
          return true;
        } catch {
          console.error('✗ Failed to deprecate');
          return false;
        }
      }

      console.error('\nFailed to unpublish package.');
      console.error('Possible reasons:');
      console.error('  - Package was published more than 72 hours ago');
      console.error('  - Package version does not exist on npm.org');
      console.error('  - NPM_AUTH_TOKEN is invalid or lacks permissions');
      return false;
    }
  } catch (error: unknown) {
    console.error('\nUnexpected error:', error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: pnpm unpublish:dev <package-name> <suffix-or-version>');
    console.error('');
    console.error('Examples:');
    console.error('  pnpm unpublish:dev @uipath/apollo-react test');
    console.error('    -> Unpublishes @uipath/apollo-react@<current>-test');
    console.error('');
    console.error('  pnpm unpublish:dev @uipath/apollo-react 3.19.3-test');
    console.error('    -> Unpublishes @uipath/apollo-react@3.19.3-test');
    console.error('');
    console.error('  pnpm unpublish:dev @uipath/apollo-react pr123');
    console.error('    -> Unpublishes @uipath/apollo-react@<current>-pr123');
    console.error('');
    console.error('Requires: NPM_AUTH_TOKEN env var');
    console.error('Note: npm only allows unpublishing within 72 hours of publication');
    console.error('\nAvailable packages:');
    for (const name of getAllPackageNames()) {
      console.error(`  - ${name}`);
    }
    process.exit(1);
  }

  const [packageName, suffixOrVersion] = args as [string, string];

  // Find package to get current version
  const packageInfo = findPackageInfo(packageName);
  if (!packageInfo) {
    console.error(`Error: Package "${packageName}" not found in monorepo.`);
    console.error('\nAvailable packages:');
    for (const name of getAllPackageNames()) {
      console.error(`  - ${name}`);
    }
    process.exit(1);
  }

  // Determine if suffixOrVersion is a full version or just a suffix
  // Full version: starts with digits in semver pattern (e.g., "3.19.3-test")
  // Suffix: starts with letters or "pr" (e.g., "test", "pr123", "pr123.abc1234")
  let versionToUnpublish: string;
  if (/^\d+\.\d+/.test(suffixOrVersion)) {
    // It's a full semver version (starts with major.minor)
    versionToUnpublish = suffixOrVersion;
  } else {
    // It's a suffix (including pr123.sha format), prepend current version
    versionToUnpublish = `${packageInfo.version}-${suffixOrVersion}`;
  }

  const success = await unpublishPackageVersion(packageName, versionToUnpublish);

  if (success) {
    console.log(`\nSuccessfully unpublished ${packageName}@${versionToUnpublish}`);
  } else {
    process.exit(1);
  }
}

main();
