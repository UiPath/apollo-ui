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

import { execSync } from 'node:child_process';
import { findPackageInfo, getAllPackageNames } from './package-utils.js';

async function deletePackageVersion(packageName: string, version: string): Promise<boolean> {
  const token = process.env.NPM_AUTH_TOKEN;
  if (!token) {
    console.error('Error: NPM_AUTH_TOKEN environment variable is required.');
    return false;
  }

  try {
    console.log(`Unpublishing ${packageName}@${version}...`);
    console.log('⚠️  Note: npm only allows unpublishing within 72 hours of publication.');

    // Use npm unpublish command
    const fullPackage = `${packageName}@${version}`;

    execSync(`npm unpublish ${fullPackage} --registry=https://registry.npmjs.org`, {
      stdio: 'inherit',
      env: {
        ...process.env,
        NPM_TOKEN: token,
        NODE_AUTH_TOKEN: token,
      },
    });

    return true;
  } catch (error) {
    console.error('\nFailed to unpublish package.');
    console.error('Possible reasons:');
    console.error('  - Package was published more than 72 hours ago');
    console.error('  - Package version does not exist');
    console.error('  - NPM_AUTH_TOKEN is invalid or lacks permissions');
    console.error(`  - Package has dependents (use 'npm deprecate ${packageName}@${version}' instead)`);
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
  // Full version contains a dot (e.g., "3.19.3-test")
  // Suffix doesn't (e.g., "test", "pr123")
  let versionToUnpublish: string;
  if (suffixOrVersion.includes('.')) {
    // It's a full version
    versionToUnpublish = suffixOrVersion;
  } else {
    // It's a suffix, prepend current version
    versionToUnpublish = `${packageInfo.version}-${suffixOrVersion}`;
  }

  console.log(`\nUnpublishing ${packageName}@${versionToUnpublish}...`);

  const success = await deletePackageVersion(packageName, versionToUnpublish);

  if (success) {
    console.log(`\nSuccessfully unpublished ${packageName}@${versionToUnpublish}`);
  } else {
    process.exit(1);
  }
}

main();
