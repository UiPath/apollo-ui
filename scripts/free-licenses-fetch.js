#!/usr/bin/env node
/**
 * Outputs comma-separated SPDX license IDs that match a policy.
 * Policy:
 *   OSI: isOsiApproved === true
 *
 * SPDX machine-readable data includes isOsiApproved.
 */
const url = 'https://spdx.org/licenses/licenses.json';

const res = await fetch(url);
if (!res.ok) {
  console.error(`Failed to fetch SPDX licenses.json: ${res.status} ${res.statusText}`);
  process.exit(2);
}
const data = await res.json();

const ids = (data.licenses || [])
  .filter((l) => l.isOsiApproved === true)
  .map((l) => l.licenseId)
  // dependency-review-action expects SPDX identifiers; excluding deprecated IDs is usually sensible.
  .filter((id) => !String(id).includes('-deprecated-'));

process.stdout.write(ids.join(', '));
