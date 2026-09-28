/**
 * The "Support Branch Scope" PR comment (support-branch-scope.yml): posted
 * when a support-branch PR touches files outside its package directory,
 * removed again once the PR is back in scope.
 *
 * Inputs (env): PACKAGE, PKG_DIR, OUT_OF_SCOPE_FILES, BASE_REF.
 */
import { removeComment, upsertComment } from './lib/pr-comments.mjs';

const MARKER = '<!-- support-branch-scope-check -->';

export async function postScopeComment({ github, context }) {
  const pkgDir = process.env.PKG_DIR;
  const outOfScope = (process.env.OUT_OF_SCOPE_FILES || '').trim();
  const baseRef = process.env.BASE_REF;

  let body = `${MARKER}\n`;
  body += `## Support Branch Scope — \`${baseRef}\`\n\n`;
  body += `> [!CAUTION]\n`;
  body += `> This PR modifies files outside \`${pkgDir}/\`. Support branches should only contain changes scoped to their package.\n\n`;
  body += `**Out-of-scope files:**\n`;
  for (const f of outOfScope.split('\n').filter(Boolean)) {
    body += `- \`${f}\`\n`;
  }
  body += `\n---\n\n`;

  body += `### Need to update a workspace dependency (e.g. \`apollo-core\`)?\n\n`;
  body += `This branch locks workspace deps to exact versions (e.g. \`5.9.0\` instead of \`workspace:*\`) `;
  body += `and resolves them from the registry. `;
  body += `Bumping the version in \`${pkgDir}/package.json\` and running \`pnpm install\` will fetch the new version.\n\n`;
  body += `If your fix requires changes in a sibling package (e.g. \`apollo-core\`):\n\n`;
  body += `1. **If the dependency is still on the same major on \`main\`** — land the fix on \`main\`, `;
  body += `let it publish a new version, then bump the version in this branch's `;
  body += `\`${pkgDir}/package.json\` and run \`pnpm install\` to update the lockfile.\n`;
  body += `2. **If the dependency needs a support branch too** — cut a support branch for that package `;
  body += `(e.g. \`support/apollo-core@5.x\`), publish the fix from there, then update the dependency version here.\n`;

  await upsertComment({ github, context }, MARKER, body);
}

export async function removeScopeComment({ github, context }) {
  await removeComment({ github, context }, MARKER);
}
