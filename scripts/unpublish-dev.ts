#!/usr/bin/env tsx
/**
 * Unpublish a dev version of a package from GitHub Package Registry.
 *
 * Dev versions live only on GHP — public npm is reserved for production
 * releases via release.yml — so this script only touches GHP.
 *
 * Usage: pnpm unpublish:dev <package-name> <suffix-or-version>
 * Example: pnpm unpublish:dev @uipath/apollo-react test
 *   -> Unpublishes @uipath/apollo-react@3.19.3-test
 *
 * Or with full version:
 * Example: pnpm unpublish:dev @uipath/apollo-react 3.19.3-test
 *   -> Unpublishes @uipath/apollo-react@3.19.3-test
 *
 * Requires GH_NPM_REGISTRY_TOKEN environment variable.
 */

import { findPackageInfo, getAllPackageNames } from './package-utils.js';

const FETCH_TIMEOUT_MS = 30_000;

function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function unpublishFromGitHub(packageName: string, version: string): Promise<boolean> {
  if (!/^@uipath\/[a-z0-9-]+$/.test(packageName)) {
    console.error(`Invalid package name: ${packageName}`);
    return false;
  }

  const token = process.env.GH_NPM_REGISTRY_TOKEN;
  if (!token) {
    console.error('Error: GH_NPM_REGISTRY_TOKEN environment variable is required for GitHub Package Registry.');
    return false;
  }

  console.log('\nProcessing GitHub Package Registry...');

  try {
    // GitHub uses package_type=npm and package_name without @scope
    const packageNameWithoutScope = packageName.replace('@uipath/', '');
    const apiUrl = `https://api.github.com/orgs/UiPath/packages/npm/${encodeURIComponent(packageNameWithoutScope)}/versions`;

    // Get all versions to find the one we want to delete
    const versionsResponse = await fetchWithTimeout(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!versionsResponse.ok) {
      console.error(`✗ Failed to fetch versions: ${versionsResponse.status} ${versionsResponse.statusText}`);
      const errorText = await versionsResponse.text();
      if (errorText) {
        console.error('Response:', errorText);
      }
      return false;
    }

    const versions = await versionsResponse.json() as Array<{ id: number; name: string }>;
    const targetVersion = versions.find(v => v.name === version);

    if (!targetVersion) {
      console.log('✓ Already removed (not found on registry)');
      return true;
    }

    // Delete the specific version
    const deleteResponse = await fetchWithTimeout(`${apiUrl}/${targetVersion.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (deleteResponse.ok || deleteResponse.status === 204) {
      console.log('✓ Unpublished successfully');
      return true;
    }

    console.error(`✗ Failed to delete: ${deleteResponse.status} ${deleteResponse.statusText}`);
    const errorText = await deleteResponse.text();
    if (errorText) {
      console.error('Response:', errorText);
    }
    return false;
  } catch (error) {
    console.error('✗ Unexpected error:');
    console.error(error);
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
    console.error('Requires: GH_NPM_REGISTRY_TOKEN env var');
    console.error('\nAvailable packages:');
    for (const name of getAllPackageNames()) {
      console.error(`  - ${name}`);
    }
    process.exit(1);
  }

  const [packageName, suffixOrVersion] = args as [string, string];

  if (!/^@uipath\/[a-z0-9-]+$/.test(packageName)) {
    console.error(`Error: Invalid package name "${packageName}". Must be @uipath/<name> (lowercase, hyphens only).`);
    process.exit(1);
  }

  // Determine if suffixOrVersion is a full version or just a suffix
  // Full version: starts with digits in semver pattern (e.g., "3.19.3-test")
  // Suffix: starts with letters or "pr" (e.g., "test", "pr123", "pr123.abc1234")
  let versionToUnpublish: string;
  if (/^\d+\.\d+/.test(suffixOrVersion)) {
    versionToUnpublish = suffixOrVersion;
  } else {
    const packageInfo = findPackageInfo(packageName);
    if (!packageInfo) {
      console.error(`Error: Package "${packageName}" not found in monorepo.`);
      console.error('\nAvailable packages:');
      for (const name of getAllPackageNames()) {
        console.error(`  - ${name}`);
      }
      process.exit(1);
    }
    versionToUnpublish = `${packageInfo.version}-${suffixOrVersion}`;
  }

  console.log(`\nUnpublishing ${packageName}@${versionToUnpublish} from GitHub Package Registry...`);
  const success = await unpublishFromGitHub(packageName, versionToUnpublish);

  if (success) {
    console.log(`\nSuccessfully unpublished ${packageName}@${versionToUnpublish}`);
  } else {
    process.exit(1);
  }
}

main();
