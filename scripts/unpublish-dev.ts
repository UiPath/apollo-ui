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

async function unpublishFromGitHub(packageName: string, version: string): Promise<boolean> {
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
    const versionsResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!versionsResponse.ok) {
      console.error(`Failed to fetch versions: ${versionsResponse.status} ${versionsResponse.statusText}`);
      return false;
    }

    const versions = await versionsResponse.json() as Array<{ id: number; name: string }>;
    const targetVersion = versions.find(v => v.name === version);

    if (!targetVersion) {
      console.log('✓ Already removed (not found on registry)');
      return true;
    }

    // Delete the specific version
    const deleteResponse = await fetch(`${apiUrl}/${targetVersion.id}`, {
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

    console.error(`Failed to delete: ${deleteResponse.status} ${deleteResponse.statusText}`);
    return false;
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}

async function unpublishFromRegistry(
  packageName: string,
  version: string,
  registry: string,
  tokenEnvVar: string,
  registryName: string
): Promise<boolean> {
  const token = process.env[tokenEnvVar];
  if (!token) {
    console.error(`Error: ${tokenEnvVar} environment variable is required for ${registryName}.`);
    return false;
  }

  console.log(`\nProcessing ${registryName}...`);

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

    // First, check if package version exists on the registry
    const encodedPackageName = packageName.replace('@', '%40').replace('/', '%2F');
    const checkResponse = await fetch(
      `${registry}/${encodedPackageName}/${version}`,
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
        ['unpublish', fullPackage, `--@uipath:registry=${registry}`, '--force'],
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

      // Check if it's an error that requires deprecation instead of unpublish
      const is422Error = errorOutput.includes('422') || errorOutput.includes('Unprocessable Entity');
      const is405Error = errorOutput.includes('405') || errorOutput.includes('Method Not Allowed');
      const isTooOldError = errorOutput.includes('72 hours') || errorOutput.includes('published more than');
      const hasDependentsError = errorOutput.includes('has dependent packages') || errorOutput.includes('can no longer unpublish');

      if (is422Error || is405Error || isTooOldError || hasDependentsError) {
        console.log('⚠️  Unpublish rejected, deprecating instead...');
        if (errorOutput) {
          console.log('Reason:', errorOutput.split('\n').find(line => line.includes('error')) || errorOutput.split('\n')[0]);
        }

        try {
          execFileSync(
            'pnpm',
            ['deprecate', fullPackage, 'Dev package - use latest version', `--@uipath:registry=${registry}`],
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
        } catch (deprecateError: unknown) {
          // GitHub Package Registry doesn't support npm deprecate the same way
          // Treat as success if it's a GitHub-specific error
          let isGitHubDeprecateError = false;
          if (deprecateError && typeof deprecateError === 'object') {
            if ('stderr' in deprecateError && deprecateError.stderr) {
              const stderr = deprecateError.stderr;
              const stderrStr = Buffer.isBuffer(stderr) || typeof stderr === 'string' ? stderr.toString() : '';

              // GitHub Package Registry returns 400 "version.ID cannot be empty" for deprecate
              if (stderrStr.includes('npm.pkg.github.com') &&
                  (stderrStr.includes('400') || stderrStr.includes('version.ID cannot be empty'))) {
                isGitHubDeprecateError = true;
                console.log('⚠️  Deprecation not supported on GitHub Package Registry (package remains published)');
              } else {
                console.error('✗ Failed to deprecate');
                console.error('Error:', stderrStr);
              }
            }
          }

          // Don't fail the overall operation for GitHub deprecate issues
          return isGitHubDeprecateError ? true : false;
        }
      }

      console.error('\nFailed to unpublish package.');
      if (errorOutput) {
        console.error('\nError from npm:');
        console.error(errorOutput);
      } else {
        console.error('No error details available');
      }
      return false;
    }
  } catch (error: unknown) {
    console.error('\nUnexpected error during unpublish:');
    console.error(error);
    return false;
  }
}

async function unpublishPackageVersion(packageName: string, version: string): Promise<boolean> {
  console.log(`\nUnpublishing ${packageName}@${version} from both registries...`);

  // Unpublish from npm
  const npmSuccess = await unpublishFromRegistry(
    packageName,
    version,
    'https://registry.npmjs.org',
    'NPM_AUTH_TOKEN',
    'npm'
  );

  // Unpublish from GitHub Package Registry using GitHub API
  const ghSuccess = await unpublishFromGitHub(packageName, version);

  const success = npmSuccess && ghSuccess;
  if (success) {
    console.log(`\n✓ Successfully processed ${packageName}@${version} on both registries`);
  } else {
    console.log(`\n⚠️  Some operations failed (see above for details)`);
  }

  return success;
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

  // Determine if suffixOrVersion is a full version or just a suffix
  // Full version: starts with digits in semver pattern (e.g., "3.19.3-test")
  // Suffix: starts with letters or "pr" (e.g., "test", "pr123", "pr123.abc1234")
  let versionToUnpublish: string;
  if (/^\d+\.\d+/.test(suffixOrVersion)) {
    // It's a full semver version - use directly, no need to check monorepo
    versionToUnpublish = suffixOrVersion;
  } else {
    // It's a suffix - need to get current version from monorepo
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

  const success = await unpublishPackageVersion(packageName, versionToUnpublish);

  if (success) {
    console.log(`\nSuccessfully unpublished ${packageName}@${versionToUnpublish}`);
  } else {
    process.exit(1);
  }
}

main();
