/**
 * The "Dependency License Review" PR comment (dependency-review.yml):
 * publishes the report `scripts/check-licenses.ts` wrote, or a pointer to
 * the logs when the check crashed before producing one.
 *
 * Inputs (env): REPORT_PATH — the license-report.md location.
 */
import { readFileSync } from 'node:fs';
import { upsertComment } from './lib/pr-comments.mjs';

const MARKER = '<!-- dependency-license-review -->';

export async function licenseReviewComment({ github, context }) {
  let report;
  try {
    report = readFileSync(process.env.REPORT_PATH, 'utf8');
  } catch {
    report =
      '# Dependency License Review\n\n:x: License check script failed before generating a report. Check the workflow logs.';
  }

  await upsertComment({ github, context }, MARKER, `${MARKER}\n${report}`);
}
