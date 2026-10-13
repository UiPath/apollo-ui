/**
 * Lists the preview apps a PR affects (preview-deploy.yml, changes job).
 *
 * Diffs the PR head against its merge base with the base branch and asks
 * Turborepo which packages that touches, including dependents. A change to
 * the preview pipeline itself selects every app.
 *
 * Inputs (env): BASE_SHA. Run from a full-history checkout of the PR head.
 * Output: `apps=<JSON array of uip-go labels>` appended to $GITHUB_OUTPUT.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { PREVIEW_APPS } from './apps.mjs';

const PIPELINE_PATHS = [
  '.github/workflows/preview-deploy.yml',
  '.github/scripts/preview-deploy/',
  '.github/scripts/lib/',
  '.github/actions/install-node-deps/',
  '.uip-go.json',
];

const run = (command, args, env) =>
  execFileSync(command, args, { encoding: 'utf8', env: { ...process.env, ...env } }).trim();

const mergeBase = run('git', ['merge-base', process.env.BASE_SHA, 'HEAD']);
const changedFiles = run('git', ['diff', '--name-only', mergeBase, 'HEAD']).split('\n');

let apps;
if (changedFiles.some((file) => PIPELINE_PATHS.some((path) => file.startsWith(path)))) {
  apps = Object.keys(PREVIEW_APPS);
} else {
  const output = run('pnpm', ['exec', 'turbo', 'ls', '--affected', '--output=json'], {
    TURBO_SCM_BASE: mergeBase,
    TURBO_SCM_HEAD: 'HEAD',
  });
  // turbo prints a "• turbo <version>" banner before the JSON.
  const affected = new Set(
    JSON.parse(output.slice(output.indexOf('{'))).packages.items.map((item) => item.name)
  );
  apps = Object.keys(PREVIEW_APPS).filter((label) => affected.has(PREVIEW_APPS[label]));
}

console.log(`Affected preview apps: ${apps.join(', ') || 'none'}`);
appendFileSync(process.env.GITHUB_OUTPUT, `apps=${JSON.stringify(apps)}\n`);
