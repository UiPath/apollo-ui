import { execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

interface TestResult {
  component: string;
  success: boolean;
  output: string;
}

function testComponent(component: string, baseAppPath: string): TestResult {
  const testDir = mkdtempSync(join(tmpdir(), `shadcn-test-${component}-`));

  try {
    // Copy base app to temp directory (excluding node_modules to avoid broken symlinks)
    cpSync(baseAppPath, testDir, {
      recursive: true,
      filter: (src) => !src.includes('node_modules'),
    });

    // Copy .npmrc so bun can resolve scoped registries (e.g. @uipath)
    const npmrcPath = process.env.NPM_CONFIG_USERCONFIG;
    if (npmrcPath && existsSync(npmrcPath)) {
      copyFileSync(npmrcPath, join(testDir, '.npmrc'));
    }

    // Install dependencies in the temp directory
    execFileSync('bun', ['install'], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: testDir,
    });

    // Install the component from registry
    const addOutput = execFileSync('bunx', ['shadcn', 'add', `@uipath/${component}`], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: testDir,
    });

    // Run build to verify all imports resolve correctly
    const buildOutput = execFileSync('bun', ['run', 'build'], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: testDir,
    });

    return { component, success: true, output: `${addOutput}\n${buildOutput}` };
  } catch (error) {
    if (error instanceof Error && 'stdout' in error && 'stderr' in error) {
      return { component, success: false, output: `${error.stdout}\n${error.stderr}` };
    }
    return { component, success: false, output: String(error) };
  } finally {
    // Cleanup temp directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      console.warn(`Warning: Failed to cleanup temp directory: ${testDir}`);
    }
  }
}

/**
 * Resolves the list of component names to test.
 *
 * - If COMPONENTS env var is set (comma-separated), uses that list.
 * - Otherwise, reads component names from REGISTRY_PATH (registry.json).
 */
function resolveComponents(): string[] {
  const componentsEnv = process.env.COMPONENTS;

  if (componentsEnv) {
    const names = componentsEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (names.length === 0) {
      console.error('COMPONENTS env var is set but contains no valid component names');
      process.exit(1);
    }

    return names;
  }

  const registryPath = process.env.REGISTRY_PATH;

  if (!registryPath) {
    console.error('Either COMPONENTS or REGISTRY_PATH environment variable is required');
    process.exit(1);
  }

  let registryString: string;
  try {
    registryString = readFileSync(registryPath, 'utf-8');
  } catch (error) {
    console.error(`Failed to read registry.json: ${error}`);
    process.exit(1);
  }

  let registry: { items: Array<{ name: string }> };

  try {
    registry = JSON.parse(registryString);
  } catch (error) {
    console.error(`Failed to parse registry.json: ${error}`);
    process.exit(1);
  }

  return registry.items.map((item) => item.name);
}

function main() {
  const baseAppPath = process.env.BASE_APP_PATH;

  if (!baseAppPath) {
    console.error('BASE_APP_PATH environment variable is required');
    process.exit(1);
  }

  const componentNames = resolveComponents();
  const errors: Array<{ component: string; output: string }> = [];

  for (const name of componentNames) {
    console.log(`Testing: ${name}...`);
    const result = testComponent(name, baseAppPath);

    if (result.success) {
      console.log(`Passed: ${name}`);
    } else {
      console.log(`FAILED: ${name}`);
      console.log('Error output:');
      console.log(result.output);
      errors.push({ component: name, output: result.output });
    }
  }

  if (errors.length > 0) {
    console.error(`\n${errors.length} component(s) failed:`);
    for (const error of errors) {
      console.error(`- ${error.component}`);
      console.error(error.output);
    }
    process.exit(1);
  }

  console.log(`\nAll ${componentNames.length} component(s) passed!`);
}

main();
