/**
 * The "Apollo Coded App preview deployments" PR comment (preview-deploy.yml).
 *
 * `initComment` posts/updates the table with the projects this PR affects in
 * a "Deploying…" state at the start of a run; `updateComment` rewrites it
 * from the deploy-result artifacts once the deploy matrix finishes. Projects
 * the PR doesn't affect are listed as "No changes". When the PR affects no
 * project, `initComment` only rewrites an existing comment and posts none.
 *
 * Inputs (env): AFFECTED_APPS, the JSON array of labels being deployed.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ptTimestamp } from '../lib/format.mjs';
import { findComment, upsertComment } from '../lib/pr-comments.mjs';
import { PREVIEW_APPS } from './apps.mjs';

const MARKER = '<!-- apollo-coded-app-preview-comment -->';
const PROJECTS = Object.keys(PREVIEW_APPS);

const TABLE_HEADER = [
  '| Project | Status | Preview | Updated (PT) |',
  '|---------|--------|---------|--------------|',
];

function runUrl(context) {
  return `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
}

function affectedApps() {
  return new Set(JSON.parse(process.env.AFFECTED_APPS || '[]'));
}

const unchangedRow = (project, timestamp) => `| ${project} | No changes | | ${timestamp} |`;

/** Affected projects "Deploying…", posted before the deploy matrix starts. */
export async function initComment({ github, context }) {
  const timestamp = ptTimestamp();
  const deployingLink = `[Deploying...](${runUrl(context)})`;
  const logsLink = `[Logs](${runUrl(context)})`;
  const affected = affectedApps();
  if (affected.size === 0 && !(await findComment({ github, context }, MARKER))) return;
  const body = [
    MARKER,
    affected.size === 0
      ? 'This PR no longer affects any Apollo Coded App.'
      : 'Apollo Coded App preview deployments are running.',
    '',
    ...TABLE_HEADER,
    ...PROJECTS.map((project) =>
      affected.has(project)
        ? `| ${project} | ${deployingLink} | ${logsLink} | ${timestamp} |`
        : unchangedRow(project, timestamp)
    ),
  ].join('\n');

  await upsertComment({ github, context }, MARKER, body);
}

/**
 * Final per-project status table, read from the deploy-result artifacts the
 * matrix legs uploaded (one `deploy-result-<project>` dir per leg under
 * `RESULTS_DIR`, each holding `url` / `outcome` / `error` files).
 */
export async function updateComment({ github, context }) {
  const resultsDir = process.env.RESULTS_DIR;
  const logsLink = `[Logs](${runUrl(context)})`;
  const timestamp = ptTimestamp();
  const affected = affectedApps();

  const readResult = (project) => {
    const dir = join(resultsDir, `deploy-result-${project}`);
    const read = (name) => {
      try {
        return readFileSync(join(dir, name), 'utf8').trim();
      } catch {
        return '';
      }
    };
    return { url: read('url'), outcome: read('outcome') || 'skipped' };
  };

  let anyFailed = false;
  const rows = PROJECTS.map((project) => {
    if (!affected.has(project)) return unchangedRow(project, timestamp);
    const { url, outcome } = readResult(project);
    const ready = outcome === 'success' && Boolean(url);
    if (outcome === 'failure') anyFailed = true;
    const status = ready ? 'Ready' : outcome === 'failure' ? 'Failed' : 'Skipped';
    const preview = ready ? `[Preview](${url}) · ${logsLink}` : logsLink;
    return `| ${project} | ${status} | ${preview} | ${timestamp} |`;
  });

  const body = [
    MARKER,
    anyFailed
      ? 'Apollo Coded App preview deployments finished with failures.'
      : 'Apollo Coded App preview deployments are ready.',
    '',
    ...TABLE_HEADER,
    ...rows,
  ].join('\n');

  await upsertComment({ github, context }, MARKER, body);
}
