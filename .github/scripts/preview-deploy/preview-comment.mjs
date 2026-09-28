/**
 * The "Apollo Coded App preview deployments" PR comment (preview-deploy.yml).
 *
 * `initComment` posts/updates the table with every project in a "Deploying…"
 * state at the start of a run; `updateComment` rewrites it from the
 * deploy-result artifacts once the deploy matrix finishes.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ptTimestamp } from '../lib/format.mjs';
import { upsertComment } from '../lib/pr-comments.mjs';

const MARKER = '<!-- apollo-coded-app-preview-comment -->';
const PROJECTS = ['apollo-design', 'apollo-docs', 'apollo-landing', 'apollo-vertex'];

const TABLE_HEADER = [
  '| Project | Status | Preview | Updated (PT) |',
  '|---------|--------|---------|--------------|',
];

function runUrl(context) {
  return `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
}

/** All projects "Deploying…", posted before the deploy matrix starts. */
export async function initComment({ github, context }) {
  const timestamp = ptTimestamp();
  const deployingLink = `[Deploying...](${runUrl(context)})`;
  const logsLink = `[Logs](${runUrl(context)})`;
  const body = [
    MARKER,
    'Apollo Coded App preview deployments are running.',
    '',
    ...TABLE_HEADER,
    ...PROJECTS.map((project) => `| ${project} | ${deployingLink} | ${logsLink} | ${timestamp} |`),
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
