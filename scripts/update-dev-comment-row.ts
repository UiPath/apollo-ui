#!/usr/bin/env tsx
/**
 * Update a single row in the dev packages PR comment
 * Uses retry logic with exponential backoff to handle concurrent updates
 */

import { execSync } from 'node:child_process';

const IDENTIFIER = '<!-- dev-packages-comment -->';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRetryDelay(attempt: number): number {
  const baseDelay = Math.min(1000 * Math.pow(2, attempt), 15000);
  const jitter = Math.random() * 1000;
  return baseDelay + jitter;
}

async function main() {
  const prNumber = process.env.PR_NUMBER || process.argv[2];
  const fullVersion = process.env.FULL_VERSION || process.argv[3];
  const status = process.env.PUBLISH_STATUS || process.argv[4];
  const repo = process.env.GITHUB_REPOSITORY || process.argv[5];
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

  if (!prNumber || !fullVersion || !status || !repo || !token) {
    console.error('Usage: update-dev-comment-row.ts <pr-number> <full-version> <status> <repo> <token>');
    console.error('Or set env vars: PR_NUMBER, FULL_VERSION, PUBLISH_STATUS, GITHUB_REPOSITORY, GH_TOKEN');
    process.exit(1);
  }

  const [owner, repoName] = repo.split('/');
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

  const statusEmoji = status === 'success' ? '🟢 Published' : '🔴 Failed';
  const newRow = `| \`${fullVersion}\` | ${statusEmoji} | ${timestamp} |`;

  const maxRetries = 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get current comment (using GH_TOKEN from env)
      const commentJson = execSync(
        `gh api repos/${owner}/${repoName}/issues/${prNumber}/comments --jq '.[] | select(.body | contains("${IDENTIFIER}"))'`,
        { encoding: 'utf8', env: { ...process.env, GH_TOKEN: token } }
      ).trim();

      if (!commentJson) {
        console.log('No existing comment found, skipping update');
        return;
      }

      const comment = JSON.parse(commentJson);

      // Check if already updated
      if (comment.body.includes(newRow)) {
        console.log('Comment already updated');
        return;
      }

      // Update the row for this package
      const lines = comment.body.split('\n');
      const updatedLines = lines.map((line: string) => {
        if (line.includes(`\`${fullVersion}\``)) {
          return newRow;
        }
        return line;
      });

      const updatedBody = updatedLines.join('\n');
      const payload = JSON.stringify({ body: updatedBody });

      // Update comment (using GH_TOKEN from env, JSON via stdin)
      execSync(
        `gh api repos/${owner}/${repoName}/issues/comments/${comment.id} -X PATCH --input -`,
        {
          input: payload,
          encoding: 'utf8',
          env: { ...process.env, GH_TOKEN: token }
        }
      );

      console.log(`Updated comment for ${fullVersion}`);
      return;

    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.error(`Failed after ${maxRetries} attempts:`, error);
        throw error;
      }

      const delay = getRetryDelay(attempt);
      console.log(`Retry ${attempt + 1} in ${(delay / 1000).toFixed(1)}s...`);
      await sleep(delay);
    }
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
