#!/usr/bin/env tsx
/**
 * Create or update the dev packages PR comment with initial "Publishing..." status
 */

import { execSync } from 'node:child_process';
import { findPackageInfo } from './package-utils.js';

const IDENTIFIER = '<!-- dev-packages-comment -->';

function getPackageVersion(packageName: string): string {
  const info = findPackageInfo(packageName);
  return info?.version ?? 'unknown';
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
      `gh api repos/${owner}/${repoName}/issues/${prNumber}/comments --jq '([.[] | select(.body | contains("${IDENTIFIER}")) | .id][0] // empty)'`,
      { encoding: 'utf8', env: { ...process.env, GH_TOKEN: token } }
    );
    commentId = result.trim() || null;
  } catch (error) {
    console.error('Failed to check for existing comment:');
    console.error(error);
    process.exit(1);
  }

  // Use JSON input to avoid shell escaping issues
  const payload = JSON.stringify({ body: comment });

  try {
    if (commentId) {
      // Update existing
      execSync(
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
      execSync(
        `gh api repos/${owner}/${repoName}/issues/${prNumber}/comments --input -`,
        {
          input: payload,
          encoding: 'utf8',
          env: { ...process.env, GH_TOKEN: token }
        }
      );
      console.log('Created new comment');
    }
  } catch (error) {
    console.error('Failed to create/update comment:');
    console.error(error);
    process.exit(1);
  }
}

main();
