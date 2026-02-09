#!/usr/bin/env tsx
/**
 * Create or update the dev packages PR comment with initial "Publishing..." status
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const IDENTIFIER = '<!-- dev-packages-comment -->';

function getPackageVersion(packageName: string): string {
  const pkgShortName = packageName.replace('@uipath/', '');
  const searchDirs = ['packages', 'web-packages'];

  for (const dir of searchDirs) {
    const pkgJsonPath = join(process.cwd(), dir, pkgShortName, 'package.json');
    try {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
      return pkgJson.version;
    } catch {
      continue;
    }
  }

  return 'unknown';
}

function main() {
  const prNumber = process.env.PR_NUMBER || process.argv[2];
  const packagesStr = process.env.PACKAGES || process.argv[3];
  const shortSha = process.env.SHORT_SHA || process.argv[4];
  const repo = process.env.GITHUB_REPOSITORY || process.argv[5];
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

  if (!prNumber || !packagesStr || !shortSha || !repo || !token) {
    console.error('Usage: create-dev-comment.ts <pr-number> <packages> <short-sha> <repo> <token>');
    console.error('Or set env vars: PR_NUMBER, PACKAGES, SHORT_SHA, GITHUB_REPOSITORY, GH_TOKEN');
    process.exit(1);
  }

  const packages = packagesStr.split(' ').filter(Boolean);
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Build table rows
  const tableRows = packages.map(pkgName => {
    const version = getPackageVersion(pkgName);
    const fullVersion = `${pkgName}@${version}-pr${prNumber}.${shortSha}`;
    return `| \`${fullVersion}\` | 🟡 Publishing... | ${timestamp} |`;
  });

  const comment = [
    IDENTIFIER,
    '## 📦 Dev Packages',
    '',
    '| Package | Status | Updated (PT) |',
    '|---------|--------|---------------|',
    ...tableRows
  ].join('\n');

  // Find or create comment (using GH_TOKEN from env)
  const [owner, repoName] = repo.split('/');

  let commentId: string | null = null;
  try {
    const result = execSync(
      `gh api repos/${owner}/${repoName}/issues/${prNumber}/comments --jq '.[] | select(.body | contains("${IDENTIFIER}")) | .id'`,
      { encoding: 'utf8', env: { ...process.env, GH_TOKEN: token } }
    );
    commentId = result.trim().split('\n')[0] || null;
  } catch {
    // No existing comment
  }

  // Use JSON input to avoid shell escaping issues
  const payload = JSON.stringify({ body: comment });

  if (commentId) {
    // Update existing
    const result = execSync(
      `gh api repos/${owner}/${repoName}/issues/comments/${commentId} -X PATCH --input -`,
      {
        input: payload,
        encoding: 'utf8',
        env: { ...process.env, GH_TOKEN: token }
      }
    );
    console.log(`Updated comment ${commentId}`);
  } else {
    // Create new
    const result = execSync(
      `gh api repos/${owner}/${repoName}/issues/${prNumber}/comments --input -`,
      {
        input: payload,
        encoding: 'utf8',
        env: { ...process.env, GH_TOKEN: token }
      }
    );
    console.log('Created new comment');
  }
}

main();
