/**
 * Validates that an applied version-bump patch did not modify any field of
 * `package.json` that controls what gets shipped or executed.
 *
 * Workspace package.json lifecycle scripts (preinstall, install, postinstall,
 * prepare) run unconditionally during `pnpm install` in any repo that consumes
 * this monorepo — pnpm's `allowBuilds` gates dependency install scripts only.
 * The other forbidden fields control resolution and packaging:
 *   - main / module / types / exports — redirect imports to attacker files
 *   - files — controls what gets packed into the tarball
 *   - bin — creates symlinks in node_modules/.bin
 *   - gypfile — triggers node-gyp on install
 *
 * Must run AFTER `git apply` — compares working tree against HEAD.
 *
 * Usage: node validate-package-json-mutations.mjs <path-to-patch>
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FORBIDDEN_FIELDS = ['scripts', 'bin', 'gypfile', 'main', 'module', 'types', 'exports', 'files'];

const patchPath = process.argv[2];
if (!patchPath) {
  console.error('::error::usage: validate-package-json-mutations.mjs <patch>');
  process.exit(2);
}

const patch = readFileSync(patchPath, 'utf8');

const touchedPackageJsons = new Set();
for (const line of patch.split('\n')) {
  const m = line.match(/^\+\+\+ b\/(.+\/package\.json)$/);
  if (m) touchedPackageJsons.add(m[1]);
}

function readHead(file) {
  try {
    return JSON.parse(execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return {};
  }
}

let failed = false;
for (const file of [...touchedPackageJsons].sort()) {
  const head = readHead(file);
  const now = JSON.parse(readFileSync(file, 'utf8'));

  for (const field of FORBIDDEN_FIELDS) {
    const before = JSON.stringify(head[field] ?? null);
    const after = JSON.stringify(now[field] ?? null);
    if (before !== after) {
      console.error(`::error::Disallowed change to .${field} in ${file}`);
      console.error(`  Before: ${before}`);
      console.error(`  After:  ${after}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('✓ package.json content validated');
