/**
 * Publishes an sbdiff run's record counts as step outputs (visual-diff job).
 *
 * Usage: node visual-diff-counts.mjs <path-to-summary.json>
 * Reads the `counts` object sbdiff embeds in summary.json and appends
 * total/changed/added/removed/errors/passed/has_diffs to $GITHUB_OUTPUT.
 */
import { appendFileSync, readFileSync } from 'node:fs';

const summaryPath = process.argv[2];
const counts = JSON.parse(readFileSync(summaryPath, 'utf8')).counts;

appendFileSync(
  process.env.GITHUB_OUTPUT,
  [
    `total=${counts.total}`,
    `changed=${counts.changed}`,
    `added=${counts.new}`,
    `removed=${counts.removed}`,
    `errors=${counts.error}`,
    `passed=${counts.pass}`,
    `has_diffs=${counts.diffs > 0}`,
    '',
  ].join('\n')
);
