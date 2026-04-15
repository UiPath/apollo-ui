---
name: cut-maintenance-branch
description: Use when cutting a maintenance/support branch for an older major version of an apollo-ui package (e.g. apollo-react v3, v4, v5). Orchestrates branch creation, pushes it bare, then opens a PR with workspace dep locking, release config, and lockfile regeneration. Confirms commit messages and git actions with the user before executing them.
---

# Cut Maintenance Branch

## When to use

Use when the user asks to:

- "Cut a maintenance branch for `<package>@<major>`"
- "Create a support branch for apollo-react v3" / "...v4" / "...v5"
- "Set up a support branch for an older major version"
- "Maintain `<package>@<old-major>` independently"
- Any phrasing equivalent to creating a `support/<package>@<major>.x` branch

The user only needs to specify the package and major version. The skill finds the latest tag for that major. Main must already be on a newer major version.

Do **not** use this skill for:
- General release questions (covered by the package's `.releaserc.json`)
- Backporting individual fixes to an existing maintenance branch (normal git workflow)
- Cutting a branch for a major version that has no published tags (nothing to branch from)

## Architecture

The skill owns all orchestration, user interaction, and git/network actions. It calls two small deterministic file-transform scripts:

- [scripts/maintenance-branch/lock-workspace-deps.sh](../../../scripts/maintenance-branch/lock-workspace-deps.sh) — rewrites workspace deps in one `package.json` to exact pinned versions by default (e.g. `workspace:*` → `5.9.0`). Supports `--operator=^|~|=` to override. Idempotent. No git, no network.
- [scripts/maintenance-branch/update-releaserc.sh](../../../scripts/maintenance-branch/update-releaserc.sh) — replaces `"main"` with a maintenance entry in one `.releaserc.json`'s `branches` array (the `"main"` entry is removed, not kept alongside). Each support branch owns its own release config; main's `.releaserc.json` is never modified. Idempotent.

Everything else — finding the tag, creating the branch, pushing it bare, opening the configuration PR, running `pnpm install` — is the skill's responsibility. **Confirm every commit message and every git/network action with the user before executing.**

## Required inputs

Confirm with the user:

- **Package name** — must exist in `packages/<name>/` or `web-packages/<name>/`. If ambiguous, list candidates from `ls packages/ web-packages/`.
- **Major version** — must have at least one published tag matching `@uipath/<package>@<major>.*`.
- **Lock operator** — defaults to `=` (exact pin, e.g. `5.9.0`). Ask the user if they want exact pinning or a range (`^`, `~`). Mention that exact pinning is the default and recommended.

Do not ask about anything else upfront — the rest is handled phase by phase with confirmations.

## Phase 1 — Pre-flight

Run all of these. Report results to the user.

```bash
# 1. Working tree clean
git status --porcelain
```
If non-empty: **stop**. Tell the user to commit or stash. Do not act on their behalf.

```bash
# 2. On main and synced
git rev-parse --abbrev-ref HEAD
git fetch origin main
git rev-list --left-right --count HEAD...origin/main
```
If not on `main`: warn but proceed if the user confirms (cutting from a non-main branch is occasionally intentional).
If behind `origin/main`: warn — recommend `git pull` before proceeding.

```bash
# 3. Tags fetched
git fetch --tags
```

```bash
# 4. gh CLI authenticated (needed for PR creation)
gh auth status
```
If 401: suggest `unset GITHUB_TOKEN && gh auth status` — the env var may hold an SSH fingerprint in this environment.
If unavailable: **stop**. The skill requires `gh` to create the configuration PR.

```bash
# 5. Check remote branch does not already exist
git ls-remote --heads origin "support/<package>@<major>.x"
```
If non-empty: **stop**. The support branch already exists on the remote. Tell the user — don't delete it.

```bash
# 6. Find the latest matching tag
git tag --list "@uipath/<package>@<major>.*" --sort=-version:refname | head -1
```
If empty: **stop**. Show the user the available tags for that package: `git tag --list "@uipath/<package>@*" --sort=-version:refname | head -10`.

## Phase 2 — Dry-run preview

Show the user a concrete preview before any mutation:

- Tag the support branch will be cut from
- Support branch name: `support/<package>@<major>.x`
- Channel: `latest-v<major>`
- Workspace deps that will be locked, with the version each will be locked to. Read sibling versions at the tag (not from main):
  ```bash
  git show "<tag>:packages/<sibling>/package.json" | jq -r .version
  ```
  For each `workspace:*` dep in the package's `package.json`, look up the sibling's version at the tag.
- How `"main"` in `.releaserc.json` will be replaced with the support branch entry
- PR branch name: `ci/configure-support-<package>@<major>.x`

Get explicit user confirmation (e.g., "proceed?") before Phase 3.

## Phase 3 — Create and push bare support branch

Create the support branch at the tag and push it with no modifications. This establishes the branch on the remote so it can be targeted by a PR.

**Confirm with the user** before creating and pushing.

```bash
git checkout -b "support/<package>@<major>.x" "<tag>"
git push -u origin "support/<package>@<major>.x"
```

If the user declines the push: stop here. Print recovery instructions (the branch exists locally; they can push later).

## Phase 4 — Create PR branch + apply transforms + commit

Create a PR branch off the support branch:

```bash
git checkout -b "ci/configure-support-<package>@<major>.x"
```

Run the two transforms from the repo root. **Important:** the scripts live on `main` and may not exist at the tag. Use `origin/main` (not local `main`) to ensure the latest version:

```bash
cd "$(git rev-parse --show-toplevel)"
git show origin/main:scripts/maintenance-branch/lock-workspace-deps.sh | bash -s -- "<pkg-dir>/package.json" [--operator=<operator>]
git show origin/main:scripts/maintenance-branch/update-releaserc.sh | bash -s -- "<pkg-dir>/.releaserc.json" "support/<package>@<major>.x" <major>
```

Show the diff:

```bash
git diff -- "<pkg-dir>/package.json" "<pkg-dir>/.releaserc.json"
```

Propose a commit message and **confirm with the user before committing**:

> `ci(<package>): configure maintenance branch for <major>.x [skip ci]`

Then:

```bash
git add "<pkg-dir>/package.json" "<pkg-dir>/.releaserc.json"
git commit -m "<approved message>"
```

## Phase 5 — Regenerate lockfile

`pnpm install` is run automatically (no prompt) since the lockfile *must* match the locked `package.json` for the support branch to install cleanly. Stream output to the user.

```bash
pnpm install
```

Check whether `pnpm-lock.yaml` actually changed:

```bash
git diff --quiet -- pnpm-lock.yaml || echo "changed"
```

- If unchanged: tell the user and skip the lockfile commit. (This typically means all locked sibling versions resolve identically to what was in the lockfile at the tag.)
- If changed: propose a commit message and **confirm with the user**:

  > `chore(<package>): update lockfile for <major>.x maintenance [skip ci]`

  Then:

  ```bash
  git add pnpm-lock.yaml
  git commit -m "<approved message>"
  ```

## Phase 6 — Push PR branch and open PR

**Confirm with the user** before pushing and opening the PR.

```bash
git push -u origin "ci/configure-support-<package>@<major>.x"
```

Propose PR title and body and **confirm with the user**. Suggested defaults:

- **Title:** `ci(<package>): configure support/<package>@<major>.x maintenance branch`
- **Body** (write to a tempfile and pass via `--body-file`):

  ```markdown
  Configures the `support/<package>@<major>.x` maintenance branch for independent releases.

  ## Changes

  - **Locked workspace deps** — workspace dependencies pinned to exact versions (e.g. `5.9.0`) so the branch installs independently of main's workspace
  - **Release config** — `.releaserc.json` updated: `"main"` replaced with the support branch entry (`range: <major>.x`, `channel: latest-v<major>`)
  - **Lockfile regenerated** — `pnpm-lock.yaml` updated to match locked dependencies (if applicable)

  ## Context

  Branch cut from tag `<tag>`. After this PR is merged, the branch is ready to receive fix PRs and publish `<major>.x.y` releases to the `latest-v<major>` npm dist-tag.
  ```

Open the PR:

```bash
gh pr create \
  --base "support/<package>@<major>.x" \
  --head "ci/configure-support-<package>@<major>.x" \
  --title "<approved title>" \
  --body-file "<tempfile>"
```

Capture the PR URL.

## Phase 7 — Report

Surface to the user:

- Support branch: `support/<package>@<major>.x` (pushed bare from `<tag>`)
- Configuration PR: `<url>`

Ask whether to switch back to `main`:

```bash
git checkout main
```

## Failure modes

| Symptom | Likely cause | Action |
|---|---|---|
| `Error: no tags found matching '...'` | Wrong major, or tags not fetched | `git fetch --tags`, re-confirm with user |
| `Error: branch 'support/...' already exists` | Already cut | **Stop**. Don't delete — could destroy work. Tell user. |
| Working tree not clean | Uncommitted changes | Tell user to commit/stash. Don't act on their behalf. |
| `gh` 401 | `GITHUB_TOKEN` env var holds an SSH fingerprint | Suggest `unset GITHUB_TOKEN && gh auth status` |
| `lock-workspace-deps.sh` errors with "no resolvable version" | `workspace:*` dep references a package not in `packages/*` or `web-packages/*` | Investigate manually — typo in `package.json`, removed package, or package in `apps/*` (which is excluded — apps are not published) |
| `ci/configure-support-...` branch already exists | Previous run partially completed | **Stop**. Tell user to clean up the stale branch before retrying. |
| `pnpm install` fails | Locked sibling version not actually published, or registry issue | **Stop**. The PR branch has the `package.json` commit but lockfile commit didn't happen. Tell user; they can investigate and either fix the lock manually or amend the commit. |

## Things this skill explicitly does NOT do

- **Does not delete sibling package source from the support branch.** The locked deps make publish output correct regardless. Source is left in place so local builds still work.
- **Does not modify main's `.releaserc.json`.** Each support branch owns its own release config. Main only has `"main"` in its branches array.
- **Does not handle `peerDependencies` differently from `dependencies`** — they're rewritten the same way. If a package needs special peer-range strategy, handle manually.
- **Does not amend or force-push commits** at any point. If something goes wrong mid-flow, leave artifacts in place and surface the state to the user.
