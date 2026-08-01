/**
 * PR size labels (pr-size.yml): the managed label set, definition sync, and
 * per-PR label assignment. Both jobs import from here so the label
 * definitions live in exactly one place.
 */

export const MANAGED_LABELS = [
  { name: 'size:XS', color: '0e8a16', description: '0-9 changed lines.' },
  { name: 'size:S', color: '5ebd3e', description: '10-29 changed lines.' },
  { name: 'size:M', color: 'fbca04', description: '30-99 changed lines.' },
  { name: 'size:L', color: 'fe7d37', description: '100-499 changed lines.' },
  { name: 'size:XL', color: 'd93f0b', description: '500-999 changed lines.' },
  { name: 'size:XXL', color: 'b60205', description: '1,000+ changed lines.' },
];

function resolveSizeLabel(totalChangedLines) {
  if (totalChangedLines < 10) return 'size:XS';
  if (totalChangedLines < 30) return 'size:S';
  if (totalChangedLines < 100) return 'size:M';
  if (totalChangedLines < 500) return 'size:L';
  if (totalChangedLines < 1000) return 'size:XL';
  return 'size:XXL';
}

/** Creates or updates the repo's size label definitions to match MANAGED_LABELS. */
export async function ensureLabels({ github, context }) {
  for (const label of MANAGED_LABELS) {
    try {
      const { data: existing } = await github.rest.issues.getLabel({
        owner: context.repo.owner,
        repo: context.repo.repo,
        name: label.name,
      });

      if (existing.color !== label.color || (existing.description ?? '') !== label.description) {
        await github.rest.issues.updateLabel({
          owner: context.repo.owner,
          repo: context.repo.repo,
          name: label.name,
          color: label.color,
          description: label.description,
        });
      }
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }

      try {
        await github.rest.issues.createLabel({
          owner: context.repo.owner,
          repo: context.repo.repo,
          name: label.name,
          color: label.color,
          description: label.description,
        });
      } catch (createError) {
        // 422: another run created it between our 404 and this call.
        if (createError.status !== 422) {
          throw createError;
        }
      }
    }
  }
}

/** Puts the PR's single correct size label on, removing stale managed ones. */
export async function syncLabel({ github, context, core }) {
  const issueNumber = context.payload.pull_request.number;
  const additions = context.payload.pull_request.additions ?? 0;
  const deletions = context.payload.pull_request.deletions ?? 0;
  const changedLines = additions + deletions;

  const managedLabelNames = new Set(MANAGED_LABELS.map((label) => label.name));
  const nextLabelName = resolveSizeLabel(changedLines);

  const { data: currentLabels } = await github.rest.issues.listLabelsOnIssue({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    per_page: 100,
  });

  for (const label of currentLabels) {
    if (!managedLabelNames.has(label.name) || label.name === nextLabelName) {
      continue;
    }

    try {
      await github.rest.issues.removeLabel({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issueNumber,
        name: label.name,
      });
    } catch (removeError) {
      // 404: someone removed it between the list and this call.
      if (removeError.status !== 404) {
        throw removeError;
      }
    }
  }

  if (!currentLabels.some((label) => label.name === nextLabelName)) {
    await github.rest.issues.addLabels({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issueNumber,
      labels: [nextLabelName],
    });
  }

  core.info(`PR #${issueNumber}: ${changedLines} changed lines -> ${nextLabelName}`);
}
