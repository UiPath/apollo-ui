---
name: cut-maintenance-branch
description: Use when cutting a maintenance/support branch for an older major version of an apollo-ui package (e.g. apollo-react@3.x) so that fixes can keep shipping after main has moved to the next major. Orchestrates branch creation, workspace dep locking, lockfile regeneration, push, and the companion main-side .releaserc.json PR. Confirms commit messages and git actions with the user before executing them.
---

# Cut Maintenance Branch

## When to use

Use when the user asks to:

- "Cut a maintenance branch for `<package>@<major>`"
- "Set up a support branch for an older major version"
- "Maintain `<package>@<old-major>` after the major bump"
- Any phrasing equivalent to creating a `support/<package>@<major>.x` branch

Do **not** use this skill for:
- General release questions (covered by the package's `.releaserc.json`)
- Backporting individual fixes to an existing maintenance branch (normal git workflow)
- Cutting a branch for a major version that hasn't been published yet (no tags to branch from)

## Architecture

The skill owns all orchestration, user interaction, and git/network actions. It calls two small deterministic file-transform scripts:

- [scripts/maintenance-branch/lock-workspace-deps.sh](../../../scripts/maintenance-branch/lock-workspace-deps.sh) — rewrites `workspace:*` deps in one `package.json` to concrete versioned ranges. Idempotent. No git, no network.
- [scripts/maintenance-branch/update-releaserc.sh](../../../scripts/maintenance-branch/update-releaserc.sh) — adds a maintenance entry (or replaces an existing one with the same name) in one `.releaserc.json`'s `branches` array, before `"main"`. Idempotent.

Everything else — finding the tag, creating the branch, committing, running `pnpm install`, pushing, opening the PR — is the skill's responsibility. **Confirm every commit message and every git/network action with the user before executing.**

## Required inputs

Confirm with the user:

- **Package name** — must exist in `packages/<name>/` or `web-packages/<name>/`. If ambiguous, list candidates from `ls packages/ web-packages/`.
- **Major version** — must have at least one published tag matching `@uipath/<package>@<major>.*`.
- **Lock operator** (only if the user wants something other than the default `^`) — options: `^`, `~`, `=`.

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
# 4. gh CLI authenticated (only matters for the main-side PR)
gh auth status
```
If 401: surface the saved memory hint — `unset GITHUB_TOKEN && gh auth status`. The token may hold an SSH fingerprint in this environment.
If unavailable, the skill can still cut the support branch — but the main-side PR step will fall back to printing instructions for manual creation. Tell the user this trade-off before proceeding.

```bash
# 5. Find the latest matching tag
git tag --list "@uipath/<package>@<major>.*" --sort=-version:refname | head -1
```
If empty: **stop**. Show the user the available tags for that package: `git tag --list "@uipath/<package>@*" --sort=-version:refname | head -10`.

## Phase 2 — Dry-run preview

Show the user a concrete preview before any mutation:

- Tag the support branch will be cut from
- Support branch name: `support/<package>@<major>.x`
- Channel: `latest-v<major>`
- Lock operator
- Workspace deps that will be locked, with the version each will be locked to. Read sibling versions at the tag (not from main):
  ```bash
  git show "<tag>:packages/<sibling>/package.json" | jq -r .version
  ```
  For each `workspace:*` dep in the package's `package.json`, look up the sibling's version at the tag.
- Companion main-side branch name: `ci/release-config-<package>@<major>.x`
- Where the entry will be inserted in `<package>/.releaserc.json` on main

Get explicit user confirmation (e.g., "proceed?") before Phase 3.

## Phase 3 — Create branch + apply transforms + commit (support branch)

```bash
git checkout -b "support/<package>@<major>.x" "<tag>"
```

Run the two transforms:

```bash
scripts/maintenance-branch/lock-workspace-deps.sh "<pkg-dir>/package.json" [--operator=...]
scripts/maintenance-branch/update-releaserc.sh "<pkg-dir>/.releaserc.json" "support/<package>@<major>.x" <major>
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

## Phase 4 — Regenerate lockfile

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

## Phase 5 — Push support branch

**Confirm with the user** before pushing.

```bash
git push -u origin "support/<package>@<major>.x"
```

If the user declines: stop here. Print recovery instructions (the branch exists locally; they can push later). Skip Phase 6 (main-side PR is meaningless without a pushed support branch).

## Phase 6 — Companion main-side PR (via worktree)

This phase runs in a temporary git worktree so the user's working directory stays on the support branch undisturbed.

```bash
git fetch origin main
WORKTREE_DIR=$(mktemp -d -t apollo-maintenance-XXXXXX)
git worktree add -b "ci/release-config-<package>@<major>.x" "$WORKTREE_DIR" origin/main
```

Set up cleanup: regardless of how the rest of the phase ends, the worktree must be removed:

```bash
git worktree remove --force "$WORKTREE_DIR" 2>/dev/null || true
```

Apply the transform inside the worktree:

```bash
scripts/maintenance-branch/update-releaserc.sh \
  "$WORKTREE_DIR/<pkg-dir>/.releaserc.json" \
  "support/<package>@<major>.x" \
  <major>
```

Check whether anything changed:

```bash
git -C "$WORKTREE_DIR" diff --quiet -- "<pkg-dir>/.releaserc.json" || echo "changed"
```

- If unchanged: main's `.releaserc.json` already has the entry. Tell the user, clean up the worktree, skip to Phase 7.
- If changed: propose commit message and **confirm**:

  > `ci(<package>): add support/<package>@<major>.x to release branches`

  Then:

  ```bash
  git -C "$WORKTREE_DIR" add "<pkg-dir>/.releaserc.json"
  git -C "$WORKTREE_DIR" commit -m "<approved message>"
  git -C "$WORKTREE_DIR" push -u origin "ci/release-config-<package>@<major>.x"
  ```

Propose PR title and body and **confirm with the user**. Suggested defaults:

- **Title:** `ci(<package>): add support/<package>@<major>.x to release branches`
- **Body** (write to a tempfile and pass via `--body-file`):

  ```markdown
  Adds the `support/<package>@<major>.x` maintenance branch to `<pkg-dir>/.releaserc.json` so semantic-release on `main` is aware of the full release topology.

  ## Why this matters

  semantic-release reads the `branches` array from whichever branch it is running on, and uses the full topology to enforce release constraints. Without this entry on `main`:

  - **Range enforcement breaks.** With this entry declared *before* `"main"`, semantic-release infers the release range for main is `>=<NEXT_MAJOR>.0.0`. Without it, a stray patch/minor commit on main could in theory produce a `<major>.x.y` release, colliding with the maintenance branch.
  - **Channel routing breaks.** main publishes to `latest`; the support branch publishes to `latest-v<major>`. Backports and merges between the two need both branch configs to agree on the topology to route to the right dist-tag.
  - **Validation breaks.** semantic-release validates the branches config on every run. This entry is what lets it catch overlapping ranges or misconfigured backport branches.

  ## Companion change

  Cut from tag `<tag>` on branch `support/<package>@<major>.x` (already pushed). That branch contains the same `.releaserc.json` entry plus locked `workspace:*` dependencies and a regenerated lockfile.
  ```

Open the PR:

```bash
gh pr create \
  --base main \
  --head "ci/release-config-<package>@<major>.x" \
  --title "<approved title>" \
  --body-file "<tempfile>"
```

Capture the PR URL.

Clean up the worktree.

## Phase 7 — Report

Surface to the user:

- Support branch: `support/<package>@<major>.x` at SHA `<git rev-parse>` (pushed)
- Lockfile: committed at SHA `<sha>` (or "no changes — skipped")
- Main-side PR: `<url>` (or "skipped — already present on main", or "skipped — gh unavailable; manual instructions printed")

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
| `gh` 401 | `GITHUB_TOKEN` env var holds an SSH fingerprint | Suggest `unset GITHUB_TOKEN && gh auth status` (saved memory) |
| `lock-workspace-deps.sh` errors with "no resolvable version" | `workspace:*` dep references a package not in `packages/*` or `web-packages/*` | Investigate manually — typo in `package.json`, removed package, or package in `apps/*` (which is excluded — apps are not published) |
| `ci/release-config-...` branch already exists | Previous run partially completed | **Stop**. Tell user to clean up the stale branch before retrying. |
| `pnpm install` fails | Locked sibling version not actually published, or registry issue | **Stop**. The support branch's `package.json` is committed but lockfile commit didn't happen. Tell user; they can investigate and either fix the lock manually or amend the dep-locking commit. |
| Worktree creation fails | Disk space, permissions, or stale worktree from prior run | Try `git worktree prune`, then retry |

## Things this skill explicitly does NOT do

- **Does not delete sibling package source from the support branch.** The locked deps make publish output correct regardless. Source is left in place so local builds still work.
- **Does not auto-merge the main-side PR.** Human review required.
- **Does not handle `peerDependencies` differently from `dependencies`** — they're rewritten the same way. If a package needs special peer-range strategy, handle manually.
- **Does not amend or force-push commits** at any point. If something goes wrong mid-flow, leave artifacts in place and surface the state to the user.
