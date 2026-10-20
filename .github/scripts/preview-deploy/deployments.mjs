/**
 * GitHub Deployments for the per-PR Coded App previews (preview-deploy.yml).
 *
 * Each matrix leg creates one deployment in the `preview/<project>`
 * environment, marked transient so a newer deployment from another PR does
 * not auto-inactivate it, and reports its outcome and preview URL on it.
 *
 * Inputs (env): ENVIRONMENT, plus DEPLOY_URL / DEPLOY_OUTCOME / DEPLOYMENT_ID
 * for `finishDeployment`.
 */

function runUrl(context) {
  return `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
}

/** Creates the deployment, marks it in progress and returns its id. */
export async function startDeployment({ github, context }) {
  const pr = context.payload.pull_request;
  const { data: deployment } = await github.rest.repos.createDeployment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref: pr.head.sha,
    task: `deploy:preview-pr-${pr.number}`,
    environment: process.env.ENVIRONMENT,
    transient_environment: true,
    production_environment: false,
    auto_merge: false,
    required_contexts: [],
    description: `Coded App preview for PR #${pr.number}`,
  });

  await github.rest.repos.createDeploymentStatus({
    owner: context.repo.owner,
    repo: context.repo.repo,
    deployment_id: deployment.id,
    state: 'in_progress',
    log_url: runUrl(context),
  });

  return deployment.id;
}

/**
 * Reports the deploy step's outcome (and preview URL) on the deployment. On
 * success, this PR's earlier deployments in the environment are marked
 * inactive, since transient deployments are not auto-inactivated.
 */
export async function finishDeployment({ github, context }) {
  const deploymentId = Number(process.env.DEPLOYMENT_ID);
  const url = process.env.DEPLOY_URL || '';
  const outcome = process.env.DEPLOY_OUTCOME;
  const status =
    outcome === 'success'
      ? { state: 'success', environment_url: url, description: 'Preview is ready' }
      : outcome === 'failure'
        ? { state: 'failure', description: 'Preview deployment failed' }
        : { state: 'error', description: `Preview deployment ${outcome || 'did not run'}` };

  await github.rest.repos.createDeploymentStatus({
    owner: context.repo.owner,
    repo: context.repo.repo,
    deployment_id: deploymentId,
    log_url: runUrl(context),
    ...status,
  });

  if (outcome !== 'success') return;

  const previous = await github.paginate(github.rest.repos.listDeployments, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    environment: process.env.ENVIRONMENT,
    task: `deploy:preview-pr-${context.payload.pull_request.number}`,
    per_page: 100,
  });
  for (const deployment of previous.filter((d) => d.id !== deploymentId)) {
    await github.rest.repos.createDeploymentStatus({
      owner: context.repo.owner,
      repo: context.repo.repo,
      deployment_id: deployment.id,
      state: 'inactive',
    });
  }
}
