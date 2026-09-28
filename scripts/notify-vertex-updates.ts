import { execFileSync } from 'node:child_process';

const REGISTRY_PREFIX = 'apps/apollo-vertex/registry/';
const TRIGGER_URL = 'https://vertical-solutions-tracker.vercel.app/api/trigger-update';
const REPOSITORY = 'UiPath/vertical-solutions-template';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

function getChangedFiles(base: string, head: string): string[] {
  const output = execFileSync('git', ['diff', '--name-only', base, head], {
    encoding: 'utf-8',
  });
  return output.trim().split('\n').filter(Boolean);
}

function extractComponents(files: string[]): string[] {
  const components = files
    .filter((name) => name.startsWith(REGISTRY_PREFIX))
    .map((name) => name.slice(REGISTRY_PREFIX.length).split('/')[0] as string)
    .filter(Boolean);
  return [...new Set(components)].sort();
}

async function triggerUpdate(apiKey: string, component: string): Promise<boolean> {
  try {
    const response = await fetch(TRIGGER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ repository: REPOSITORY, component }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn(`Failed to trigger update for ${component}: ${response.status} ${body}`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn(`Failed to trigger update for ${component}: ${error}`);
    return false;
  }
}

async function main() {
  const beforeSha = requireEnv('BEFORE_SHA');
  const afterSha = requireEnv('AFTER_SHA');
  const apiKey = requireEnv('API_KEY');

  const files = getChangedFiles(beforeSha, afterSha);
  const components = extractComponents(files);

  if (components.length === 0) {
    console.log('No registry components changed');
    return;
  }

  console.log(`Changed components:\n${components.join('\n')}`);

  let failed = 0;

  for (const component of components) {
    console.log(`Triggering update for: ${component}`);
    const ok = await triggerUpdate(apiKey, component);
    if (!ok) failed++;
  }

  if (failed > 0) {
    console.error(`Failed to trigger ${failed} component update(s)`);
    process.exit(1);
  }
}

main();
