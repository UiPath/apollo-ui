/**
 * Shared helpers for the marker-comment pattern used by PR workflows: each
 * workflow owns one PR comment identified by an HTML-comment marker (e.g.
 * `<!-- apollo-coded-app-preview-comment -->`) and updates it in place
 * instead of stacking new comments.
 *
 * Callers are `actions/github-script` steps; `github` is the authenticated
 * Octokit instance and `context` the workflow run context.
 */

/**
 * Finds the workflow's marker comment on the current PR. Only bot-authored
 * comments count, so a user pasting the marker into their own comment cannot
 * hijack (or leak data into) the slot the workflow updates.
 */
export async function findComment({ github, context }, marker) {
  const comments = await github.paginate(github.rest.issues.listComments, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    per_page: 100,
  });
  return (
    comments.find(
      (comment) =>
        comment.body?.includes(marker) &&
        comment.user?.type === 'Bot' &&
        ['github-actions[bot]', 'github-actions'].includes(comment.user?.login)
    ) ?? null
  );
}

/**
 * Creates or updates the marker comment. `body` must itself contain the
 * marker, or the next run will not find the comment and will create a
 * duplicate.
 */
export async function upsertComment({ github, context }, marker, body) {
  if (!body.includes(marker)) {
    throw new Error(`comment body must contain its marker (${marker})`);
  }
  const existing = await findComment({ github, context }, marker);
  if (existing) {
    await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: existing.id,
      body,
    });
  } else {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body,
    });
  }
}

/** Deletes the marker comment if present; a no-op otherwise. */
export async function removeComment({ github, context }, marker) {
  const existing = await findComment({ github, context }, marker);
  if (existing) {
    await github.rest.issues.deleteComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: existing.id,
    });
  }
}
