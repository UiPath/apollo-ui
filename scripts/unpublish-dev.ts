#!/usr/bin/env tsx
/**
 * Unpublish a dev version of a package from GitHub Packages.
 *
 * Usage: pnpm unpublish:dev <package-name> <suffix-or-version>
 * Example: pnpm unpublish:dev @uipath/apollo-react test
 *   -> Unpublishes @uipath/apollo-react@3.19.3-test
 *
 * Or with full version:
 * Example: pnpm unpublish:dev @uipath/apollo-react 3.19.3-test
 *   -> Unpublishes @uipath/apollo-react@3.19.3-test
 *
 * Requires GH_NPM_REGISTRY_TOKEN or GITHUB_TOKEN environment variable.
 */

import { findPackageInfo, getAllPackageNames } from './package-utils.js';

interface GitHubPackageVersion {
  id: number;
  name: string;
}

async function deletePackageVersion(packageName: string, version: string): Promise<boolean> {
  const token = process.env.GH_NPM_REGISTRY_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('Error: GH_NPM_REGISTRY_TOKEN or GITHUB_TOKEN environment variable is required.');
    return false;
  }

  // Extract package name without scope (e.g., "apollo-react" from "@uipath/apollo-react")
  const packageNameWithoutScope = packageName.replace('@uipath/', '');
  const org = 'uipath';

  try {
    // First, list all versions to find the version ID
    console.log(`Looking up version ID for ${packageName}@${version}...`);

    const listResponse = await fetch(
      `https://api.github.com/orgs/${org}/packages/npm/${packageNameWithoutScope}/versions?per_page=100`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!listResponse.ok) {
      if (listResponse.status === 404) {
        console.error(`Package ${packageName} not found in GitHub Packages.`);
        return false;
      }
      const errorText = await listResponse.text();
      console.error(`Failed to list versions: ${listResponse.status} ${errorText}`);
      return false;
    }

    const versions = (await listResponse.json()) as GitHubPackageVersion[];
    const targetVersion = versions.find((v) => v.name === version);

    if (!targetVersion) {
      console.error(`Version ${version} not found for ${packageName}.`);
      if (versions.length === 100) {
        console.error(
          'Note: Only checked the 100 most recent versions. The target version may exist in older pages.'
        );
      }
      console.log('Recent versions:');
      for (const v of versions.slice(0, 10)) {
        console.log(`  - ${v.name}`);
      }
      if (versions.length > 10) {
        console.log(`  ... and ${versions.length - 10} more`);
      }
      return false;
    }

    // Delete the version
    console.log(`Deleting ${packageName}@${version} (version ID: ${targetVersion.id})...`);

    const deleteResponse = await fetch(
      `https://api.github.com/orgs/${org}/packages/npm/${packageNameWithoutScope}/versions/${targetVersion.id}`,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!deleteResponse.ok) {
      if (deleteResponse.status === 403) {
        console.error(
          'Failed to delete version: 403 Forbidden. The token may be missing the "delete:packages" permission.'
        );
        return false;
      }
      if (deleteResponse.status === 404) {
        console.error(
          `Failed to delete version: 404 Not Found. Version ${version} may already be deleted.`
        );
        return false;
      }
      const errorText = await deleteResponse.text();
      console.error(`Failed to delete version: ${deleteResponse.status} ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error:', error);
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
    console.error('Requires: GH_NPM_REGISTRY_TOKEN or GITHUB_TOKEN env var');
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
