/**
 * Finds the latest successful main build that uploaded a `package-sizes`
 * artifact and exposes its run id as the `run_id` step output — the "vs
 * main" baseline for the PR size report (pr-checks.yml). Skip-ci
 * version-bump commits skip release.yml, so the most recent run may have no
 * artifact; walk back until one does.
 */
export async function findSizeBaseline({ github, context, core }) {
  const runs = await github.rest.actions.listWorkflowRuns({
    owner: context.repo.owner,
    repo: context.repo.repo,
    workflow_id: 'release.yml',
    branch: 'main',
    status: 'success',
    per_page: 10,
  });
  for (const run of runs.data.workflow_runs) {
    const arts = await github.rest.actions.listWorkflowRunArtifacts({
      owner: context.repo.owner,
      repo: context.repo.repo,
      run_id: run.id,
    });
    if (arts.data.artifacts.some((a) => a.name === 'package-sizes' && !a.expired)) {
      core.info(`Size baseline from main run ${run.id} (${(run.head_sha || '').slice(0, 7)})`);
      core.setOutput('run_id', String(run.id));
      return;
    }
  }
  core.info('No main build with a package-sizes artifact found; "vs main" will show "—".');
}
