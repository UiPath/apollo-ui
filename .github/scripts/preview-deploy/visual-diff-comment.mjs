/**
 * The "Storybook visual diff" PR comment (preview-deploy.yml, visual-diff
 * job). Reads the job's step outcomes/outputs from env and renders one of:
 * skipped (preview deploy failed), run failure, no affected stories, clean
 * pass, or changes detected with a link to the deployed report app.
 */
import { ptTimestamp } from '../lib/format.mjs';
import { upsertComment } from '../lib/pr-comments.mjs';

const MARKER = '<!-- apollo-visual-diff-comment -->';

export async function visualDiffComment({ github, context }) {
  const logsLink = `[Logs](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId})`;
  const n = (value) => Number(value) || 0;

  const lines = [MARKER, '### Storybook visual diff', ''];
  if (process.env.READY !== 'true') {
    lines.push(
      `⏭️ Skipped: the apollo-design preview deployment did not succeed, so no comparison ran. ${logsLink}`
    );
  } else if (process.env.SBDIFF_OUTCOME !== 'success') {
    lines.push(`❌ The visual diff run failed before producing a result. ${logsLink}`);
  } else if (process.env.NO_STORIES === 'true') {
    lines.push(`✅ No stories are affected by this PR's changes; nothing to compare. ${logsLink}`);
  } else if (process.env.HAS_DIFFS !== 'true') {
    lines.push(
      `✅ No visual changes. ${n(process.env.TOTAL)} stories affected by this PR were compared against the deployed main Storybook. ${logsLink}`
    );
  } else {
    const parts = [];
    if (n(process.env.CHANGED)) parts.push(`${n(process.env.CHANGED)} changed`);
    if (n(process.env.ADDED)) parts.push(`${n(process.env.ADDED)} added`);
    if (n(process.env.REMOVED)) parts.push(`${n(process.env.REMOVED)} removed`);
    if (n(process.env.ERRORS)) parts.push(`${n(process.env.ERRORS)} errored`);
    const report =
      process.env.REPORT_OUTCOME === 'success' && process.env.REPORT_URL
        ? `[View report](${process.env.REPORT_URL})`
        : `report deployment failed, see ${logsLink}`;
    lines.push(
      `⚠️ Visual changes detected: ${parts.join(', ')} (of ${n(process.env.TOTAL)} compared, ${n(process.env.PASSED)} unchanged). ${report}`
    );
    lines.push('');
    lines.push(
      `Baseline is the deployed main Storybook, so changes merged to main after this branch was last updated can also appear here. ${logsLink}`
    );
  }
  lines.push('', `_Updated (PT): ${ptTimestamp()}_`);

  await upsertComment({ github, context }, MARKER, lines.join('\n'));
}
