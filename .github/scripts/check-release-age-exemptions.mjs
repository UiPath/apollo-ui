/**
 * Checks which packages in `minimumReleaseAgeExclude` (pnpm-workspace.yaml) have a
 * locked version older than the 14-day quarantine and can be removed from the list.
 *
 * Each non-glob entry must carry its version in the inline comment, e.g.:
 *   - 'next'  # 16.2.6 — reason
 * The prune script reads that version to decide when to remove the entry.
 */

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const QUARANTINE_MS = 14 * 24 * 60 * 60 * 1000; // must match minimumReleaseAge in pnpm-workspace.yaml
const WORKSPACE_FILE = 'pnpm-workspace.yaml';

function parseExemptions(yaml) {
  const lines = yaml.split('\n');
  const start = lines.findIndex((l) => l.trimEnd() === 'minimumReleaseAgeExclude:');
  if (start === -1) return [];

  const entries = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!/^\s+-/.test(line)) break;

    const pkg = line.replace(/^\s+-\s+/, '').replace(/['"]/g, '').split(/[#\s]/)[0];
    const version = line.match(/#\s*(\d+\.\d+\S*)/)?.[1] ?? null;

    if (pkg && !pkg.includes('*') && version) entries.push({ pkg, version });
  }
  return entries;
}

function publishedAt(pkg, version) {
  try {
    const times = JSON.parse(
      execFileSync('npm', ['view', pkg, 'time', '--json'], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }),
    );
    const date = times[version];
    return date ? new Date(date) : null;
  } catch {
    return null;
  }
}

// --- Main ---

const yaml = readFileSync(WORKSPACE_FILE, 'utf8');
const exemptions = parseExemptions(yaml);

if (exemptions.length === 0) {
  console.log('No versioned exemptions to check.');
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, 'removable=\ncount=0\n');
  process.exit(0);
}

console.log(`Checking ${exemptions.length} exemption(s): ${exemptions.map((e) => `${e.pkg}@${e.version}`).join(', ')}\n`);

const now = Date.now();
const quarantineDays = Math.floor(QUARANTINE_MS / 86_400_000);
const removable = [];

for (const { pkg, version } of exemptions) {
  const published = publishedAt(pkg, version);
  if (!published) {
    console.log(`  ${pkg}@${version}: could not fetch publish date — skipping`);
    continue;
  }

  const ageDays = Math.floor((now - published.getTime()) / 86_400_000);

  if (ageDays >= quarantineDays) {
    console.log(`  ${pkg}@${version}: ${ageDays}d old → removable`);
    removable.push(pkg);
  } else {
    console.log(`  ${pkg}@${version}: ${ageDays}d old → ${quarantineDays - ageDays}d remaining`);
  }
}

if (removable.length === 0) {
  console.log('\nNothing to remove yet.');
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, 'removable=\ncount=0\n');
  process.exit(0);
}

let updated = yaml;
for (const pkg of removable) {
  const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  updated = updated.replace(new RegExp(`^[ \\t]+-[ \\t]+['"]?${escaped}['"]?[^\\n]*\\n`, 'm'), '');
}
writeFileSync(WORKSPACE_FILE, updated);
console.log(`\nRemoved from pnpm-workspace.yaml: ${removable.join(', ')}`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `removable=${removable.join(',')}\ncount=${removable.length}\n`);
}
