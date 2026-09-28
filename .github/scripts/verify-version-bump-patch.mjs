/**
 * Verifies that a unified diff (the version-bump-patch artifact produced by
 * release.yml) is safe to `git apply` and only touches paths semantic-release
 * is allowed to mutate.
 *
 * Rejects:
 *   - symlink mode lines (CVE-2024-32002 class)
 *   - non-ASCII characters (Trojan Source / homoglyph attacks)
 *   - any referenced path outside the allowlist
 *
 * Checks every path git apply could write through, not just +++/--- lines —
 * `rename from|to`, `copy from|to`, and `diff --git a/X b/Y` headers all
 * influence the destination.
 *
 * Usage: node verify-version-bump-patch.mjs <path-to-patch>
 */

import { readFileSync } from 'node:fs';

const ALLOWED_PATH = /^(packages|web-packages)\/[a-z][a-z0-9-]*\/(CHANGELOG\.md|package\.json)$/;

const patchPath = process.argv[2];
if (!patchPath) {
  console.error('::error::usage: verify-version-bump-patch.mjs <patch>');
  process.exit(2);
}

const patch = readFileSync(patchPath, 'utf8');

if (/^(new|old|new file|deleted file) mode 120000/m.test(patch)) {
  console.error('::error::Symlink mode in patch');
  process.exit(1);
}

if (/[^\x00-\x7f]/.test(patch)) {
  console.error('::error::Non-ASCII characters in patch');
  process.exit(1);
}

const paths = new Set();
for (const line of patch.split('\n')) {
  let m;
  if ((m = line.match(/^diff --git a\/(.+) b\/(.+)$/))) {
    paths.add(m[1]);
    paths.add(m[2]);
  } else if ((m = line.match(/^(?:rename|copy) (?:from|to) (.+)$/))) {
    paths.add(m[1]);
  } else if ((m = line.match(/^(?:\+\+\+|---) [ab]\/(.+)$/))) {
    paths.add(m[1]);
  }
}
paths.delete('/dev/null');

const sorted = [...paths].sort();
const disallowed = sorted.filter((p) => !ALLOWED_PATH.test(p));

if (disallowed.length > 0) {
  console.error('::error::Disallowed paths in patch:');
  for (const p of disallowed) console.error(`  ${p}`);
  process.exit(1);
}

console.log('✓ Verified paths:');
for (const p of sorted) console.log(`  ${p}`);
