---
name: harden-github-action
description: Use when creating or reviewing GitHub Actions workflows in this repo. Applies all security patterns established during the apollo-ui hardening session — permissions, action pinning, checkout safety, install patterns, secrets handling, fork protection, Turbo caching, artifacts, and minimumReleaseAge.
---

# Harden GitHub Action

## When to Use

Use when the user asks to:

- "Create a new GitHub Actions workflow"
- "Harden / secure an existing workflow"
- "Review a workflow for security issues"
- "Add a CI job for X"
- "Why is my workflow failing the security scan?"
- Any phrasing involving `.github/workflows/*.yml` or `.github/actions/*/action.yml`

Do **not** use this skill for:
- Fixing npm/pnpm security vulnerabilities in `package.json` (use `fix-security-vulnerabilities`)
- General CI debugging unrelated to security patterns

## Repo Context

- **Package manager**: pnpm 11.x
- **Node version**: 22
- **Workspaces**: Turborepo monorepo (`packages/`, `web-packages/`, `apps/`)
- **Dual-publish, single-install**: packages publish to both npm public and GitHub Packages (`@uipath` scope on GHP). CI **installs** only from npm public — no `.npmrc` in repo, no GHP credentials needed at install time. GHP credentials still flow to publish/cleanup steps.
- **Composite install action**: `.github/actions/install-node-deps/action.yml` — always prefer this over manual setup
- **Security scanner**: zizmor (via `security-scan.yml`); suppression config at `zizmor.yml`
- **Workspace quarantine**: `pnpm-workspace.yaml` has `minimumReleaseAge: 20160` (14 days), `blockExoticSubdeps: true`, and a `minimumReleaseAgeExclude` list managed by the weekly `prune-release-age-exemptions.yml` workflow

---

## Rules Reference

### 1. Permissions — Scope Write Permissions to Jobs, Not Workflows

**The actual security boundary:** supply-chain-critical write permissions must never appear at workflow level. Everything else is a matter of hygiene.

#### Permissions safe at workflow level (read-only, no supply-chain risk)
`contents: read` · `pull-requests: read` · `issues: read` · `packages: read` · `checks: read` · `actions: read`

These cannot modify code, publish packages, or compromise infrastructure. `contents: read` at workflow level is the GitHub/OpenSSF-recommended baseline.

#### Permissions that must be job-scoped

| Permission | Why |
|---|---|
| `contents: write` | Can push commits, create releases — direct code tampering |
| `packages: write` | Can publish to registries — supply-chain critical |
| `id-token: write` | OIDC token for cloud auth / npm provenance — impersonation risk |
| `deployments: write` | Can trigger production deployments |
| `pull-requests: write` | Can merge PRs, bypass branch protections |
| `statuses: write` | Can fake commit status checks (bypass CI gates) |
| `issues: write` | Can close/modify issues (low direct risk but keep scoped) |
| `checks: write` | Can fake CI check results |
| `security-events: write` | Can upload SARIF; acceptable at workflow level only for a dedicated security-scanning workflow |

#### Pattern

```yaml
# Workflow containing any write-capable job → deny-all + per-job grants
permissions: {}

jobs:
  lint:
    permissions:
      contents: read
  release:
    permissions:
      contents: write         # push version bump
      packages: write         # publish to GHP
      id-token: write         # npm provenance — ONLY on publish job, nowhere else
```

```yaml
# Purely read-only workflow → workflow-level contents: read is fine
permissions:
  contents: read
```

**Never use** `permissions: write-all` or `permissions: read-all`.

---

### 2. Action Pinning — Full Commit SHA

All third-party actions **must** be pinned to a full 40-character commit SHA. Never use `@latest`, `@vX`, or branch tags.

```yaml
# ✅ Correct
uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
uses: actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830 # v4
uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
uses: pnpm/action-setup@b906affcce14559ad1aafd4ab0e942779e9f58b1 # v4
uses: actions/github-script@ed597411d8f924073f98dfc5c65a23a2325f34cd # v8
uses: actions/create-github-app-token@bcd2ba49218906704ab6c1aa796996da409d3eb1 # v3.2.0
uses: zizmorcore/zizmor-action@135698455da5c3b3e55f73f4419e481ab68cdd95 # v0.4.1
uses: reviewdog/action-actionlint@6fb7acc99f4a1008869fa8a0f09cfca740837d9d # v1.72.0

# ❌ Wrong — do not use
uses: actions/checkout@v4
uses: actions/checkout@latest
uses: actions/checkout@main
```

To find the correct SHA for any action version, run:
```bash
gh api repos/<owner>/<repo>/git/ref/tags/<tag> --jq '.object.sha'
# If the tag is an annotated tag, dereference it:
gh api repos/<owner>/<repo>/git/refs/tags/<tag> --jq '.object.sha' | xargs -I{} gh api repos/<owner>/<repo>/git/tags/{} --jq '.object.sha'
```

Local first-party composite actions (`.github/actions/*`) do **not** need pinning — use `./.github/actions/install-node-deps` directly.

---

### 3. Checkout Safety — `persist-credentials: false`

Always add `persist-credentials: false` to `actions/checkout` **unless** the job explicitly needs to push commits (e.g., the release bot that commits version bumps).

```yaml
# ✅ Standard checkout (read-only)
- name: Checkout code
  uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
  with:
    persist-credentials: false

# ✅ Release job exception — must document the exception
# zizmor: ignore[artipacked]
# Credentials needed for semantic-release to push version bumps; no artifacts uploaded in this workflow
- name: Checkout code
  uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
  with:
    fetch-depth: 0
    token: ${{ steps.app-token.outputs.token }}
```

For jobs that use the default checkout and then push a branch (e.g., `prune-release-age-exemptions.yml`), keep `persist-credentials` at its default (`true`) and document it inline:

```yaml
# persist-credentials kept (default true) so the job can push the cleanup branch.
- name: Checkout
  uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
```

Every `artipacked` suppression added to `zizmor.yml` **must** include a comment explaining why credentials are needed.

---

### 4. Install Pattern — Composite Action

Always use `./.github/actions/install-node-deps` instead of manually setting up pnpm and Node.

```yaml
- name: Install Node dependencies
  uses: ./.github/actions/install-node-deps
```

The composite action takes no required inputs. No `registry-token`, no `packages: read` permission, no GHP auth — all `@uipath/*` deps resolve from npm public. If a future change reintroduces GHP-only install deps, restore the input + permission and document why.

**Never:**
- Run `pnpm install` without `--frozen-lockfile` in CI — the composite action always uses it
- Use `pnpm dlx`, `pnpx`, or `npx -y` for packages already in `devDependencies` — use `pnpm exec` instead
- Add `pnpm/action-setup` or `actions/setup-node` manually when the composite action suffices

---

### 5. Secrets — Step-Scoped Only

Never place secrets in a workflow-level `env:` block. Always scope to the specific step that needs them.

```yaml
# ❌ Wrong — workflow-level env exposes secrets to all steps
env:
  GH_NPM_REGISTRY_TOKEN: ${{ steps.app-token.outputs.token }}

# ✅ Correct — step-level env
- name: Publish package
  env:
    GH_NPM_REGISTRY_TOKEN: ${{ steps.app-token.outputs.token }}
  run: pnpm publish:dev "$PACKAGE" "$SUFFIX"
```

**Three token classes in this repo, each step-scoped:**

- `${{ github.token }}` (the default GITHUB_TOKEN) — used as `GH_NPM_REGISTRY_TOKEN` for **GHP publish / unpublish / cleanup** steps in `release.yml`, `dev-publish.yml`, and `dev-cleanup.yml`. Requires `packages: write` on the publishing/cleanup job (never the workflow). Lives in the step's `env:` block; do not raise to workflow or job scope.
- GitHub App installation token (`steps.app-token.outputs.token`) — used **only** for pushing the version-bump commit in `release.yml`'s `commit-version-bump` job, which runs on an isolated runner separated from the release/publish job. Mint via `actions/create-github-app-token` with `permission-contents: write`. Never used for npm/GHP publishing.
- **npm.org publishing uses OIDC Trusted Publishing — there is no npm token in CI.** The publishing job declares `id-token: write` and the `@uipath/*` package's npm Trusted Publisher entry pins this repo + `release.yml`. pnpm 11 detects the OIDC env vars set by Actions and exchanges them for a short-lived publish token automatically.

**Install needs no token.** Since CI installs only from npm public, the composite install action takes no `registry-token` and jobs do not need `packages: read`.

---

### 6. Fork PR Protection

Any job that uses secrets, publishes packages, or modifies shared state **must** include a fork guard:

```yaml
jobs:
  publish:
    if: github.event.pull_request.head.repo.fork == false
```

**Always use `pull_request` event** (not `pull_request_target`) for PR-triggered workflows. `pull_request_target` runs with repo secrets against the base branch code, which is dangerous for untrusted forks.

---

### 7. Turborepo Cache — Branch-Isolated Keys

The Turbo cache key **must** include `github.ref_name` for branch isolation. Without it, branches share cache entries and can corrupt each other's build output.

```yaml
- name: Cache Turborepo
  uses: actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830 # v4
  with:
    path: .turbo
    key: ${{ runner.os }}-turbo-${{ github.ref_name }}-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-turbo-${{ github.ref_name }}-
```

The restore key intentionally omits `github.sha` to allow cache hits from earlier commits on the same branch.

---

### 8. Artifacts — Only Coverage, Short Retention

Do **not** upload `dist/`, `.turbo/`, or build outputs in failure artifacts — those can contain compiled secrets or sensitive outputs. Only upload `coverage/`.

```yaml
- name: Upload Coverage
  uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
  with:
    name: coverage
    path: coverage/
    retention-days: 7   # success artifacts

- name: Upload Failure Artifacts
  if: failure()
  uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
  with:
    name: failure-${{ matrix.check }}-${{ github.sha }}
    path: coverage/     # ← coverage only, NOT dist/ or .turbo/
    retention-days: 3   # failure artifacts expire sooner
```

---

### 9. PR Comment Parsing — Filter by Bot Author

When extracting data from PR comments written by the workflow bot, always filter by author to prevent injection from non-bot comments:

```bash
# ✅ Correct — filter by bot author
COMMENT=$(gh api "repos/${{ github.repository }}/issues/${PR_NUMBER}/comments" \
  --jq '[.[] | select(.body | contains("<!-- dev-packages-comment -->"))
         | select(.user.type == "Bot" or .user.login == "github-actions[bot]")
         | .body][0]' 2>/dev/null) || true

# ❌ Wrong — any user can inject data by posting a comment with the sentinel string
COMMENT=$(gh api ... --jq '[.[] | select(.body | contains("<!-- dev-packages-comment -->")) | .body][0]')
```

---

### 10. Vercel CLI — Exact Version Pin

Pin the Vercel CLI to an exact version number in both the install command and the cache key. Never use `@latest`.

```yaml
- name: Cache Vercel CLI
  uses: actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830 # v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-vercel-cli-53.4.0   # ← version in key

- name: Install Vercel CLI
  run: npm install -g vercel@53.4.0            # ← exact version
```

When upgrading the Vercel CLI, update both the install command and the cache key together.

---

### 11. `minimumReleaseAge` and `pnpm add`

`pnpm install --frozen-lockfile` (used in CI) **never re-resolves packages**, so it is unaffected by `minimumReleaseAge`. The lockfile is the contract.

`pnpm add` **does** re-resolve all packages and **will fail** if any currently-locked package was published within the 14-day quarantine window.

**When blocked by `minimumReleaseAge`:**

1. Identify the blocking package from the error message.
2. Add it to `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`. **The version number is required in the comment** — the `prune-release-age-exemptions.yml` workflow reads it to decide when to remove the entry:

```yaml
# pnpm-workspace.yaml
minimumReleaseAgeExclude:
  - some-package  # 1.2.3 — reason it was added (too new when pnpm add ran)
```

The format is `# <version> — <reason>`. Without the version, the prune workflow skips the entry and it will never be auto-removed.

3. The weekly `prune-release-age-exemptions.yml` workflow will open a PR to remove it automatically once that version ages past 14 days.

**When adding many packages at once** (multiple are blocking):
```bash
# Temporarily disable quarantine, add packages, restore
# 1. Set minimumReleaseAge: 0 in pnpm-workspace.yaml
# 2. Run: pnpm add <pkg1> <pkg2> ...
# 3. Restore minimumReleaseAge: 20160
# 4. Verify: pnpm install --frozen-lockfile succeeds
```

---

## Workflow Skeleton

Use this as a starting point for any new workflow:

```yaml
name: My Workflow

on:
  pull_request:
    branches:
      - main
      - 'support/**'

# Deny-all default; jobs grant only what they need.
permissions: {}

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  my-job:
    name: My Job
    runs-on: ubuntu-latest
    # Fork guard — remove if this job uses no secrets and touches no shared state
    if: github.event.pull_request.head.repo.fork == false
    permissions:
      contents: read
      # pull-requests: write  # add only if posting PR comments

    steps:
      - name: Checkout code
        uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Install Node dependencies
        uses: ./.github/actions/install-node-deps

      - name: Cache Turborepo
        uses: actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830 # v4
        with:
          path: .turbo
          key: ${{ runner.os }}-turbo-${{ github.ref_name }}-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-turbo-${{ github.ref_name }}-

      - name: Run checks
        run: pnpm <command>
```

---

## Review Checklist

Use this checklist when reviewing or hardening any workflow file.

### Permissions
- [ ] No supply-chain-critical write scope (`contents: write`, `packages: write`, `id-token: write`, `deployments: write`, `statuses: write`) at workflow level
- [ ] Workflows with any write-capable job use `permissions: {}` at workflow level
- [ ] Read-only workflows have at least `permissions: contents: read` at workflow level (or `{}`)
- [ ] Each job lists only the permissions it genuinely needs
- [ ] `id-token: write` appears only on the npm-publish job (provenance)
- [ ] No workflow uses `permissions: write-all` or `permissions: read-all`

### Action Pinning
- [ ] Every third-party `uses:` is pinned to a full 40-character SHA
- [ ] The SHA has a `# vX.Y.Z` comment showing the human-readable version
- [ ] No `@latest`, `@vX`, or branch-ref tags anywhere
- [ ] First-party composite actions (`./.github/actions/*`) are referenced by path, not SHA

### Checkout Safety
- [ ] Every `actions/checkout` step has `persist-credentials: false` — OR —
- [ ] The exception is documented with `# zizmor: ignore[artipacked]` and a comment, and the suppression is added to `zizmor.yml` with an explanation

### Install Pattern
- [ ] All install steps use `./.github/actions/install-node-deps`
- [ ] No `registry-token` argument passed and no `packages: read` permission on the job — CI installs from npm public only
- [ ] No raw `pnpm install` without `--frozen-lockfile`
- [ ] No `pnpm dlx` / `pnpx` / `npx -y` for packages already in devDependencies — use `pnpm exec`

### Secrets
- [ ] No secrets in workflow-level `env:` blocks
- [ ] No secrets in job-level `env:` blocks (unless unavoidable and documented)
- [ ] GitHub App token appears only in the `env:` of the specific step that needs it
- [ ] No `NPM_AUTH_TOKEN` / `NPM_TOKEN` anywhere — npm.org publishes use OIDC Trusted Publishing
- [ ] `id-token: write` declared only on the npm-publish job (release.yml), not workflow-level
- [ ] No secrets interpolated directly into `run:` shell strings — always via `env:`

### Fork PR Protection
- [ ] Every job that uses secrets has `if: github.event.pull_request.head.repo.fork == false`
- [ ] Every job that publishes packages has the fork guard
- [ ] Every job that modifies shared state (comments, deployments) has the fork guard
- [ ] Workflow uses `pull_request` event, not `pull_request_target`

### Turbo Cache
- [ ] Cache key includes `github.ref_name` for branch isolation
- [ ] Cache key format: `${{ runner.os }}-turbo-${{ github.ref_name }}-${{ github.sha }}`
- [ ] Restore key format: `${{ runner.os }}-turbo-${{ github.ref_name }}-`

### Artifacts
- [ ] Failure artifacts upload only `coverage/` — not `dist/`, `.turbo/`, or build outputs
- [ ] Success coverage artifacts: `retention-days: 7`
- [ ] Failure artifacts: `retention-days: 3`

### PR Comment Parsing
- [ ] Comment lookup filters by bot author: `select(.user.type == "Bot" or .user.login == "github-actions[bot]")`
- [ ] Sentinel strings are unique enough to prevent false matches

### Vercel Deploy (if applicable)
- [ ] Vercel CLI pinned to exact version: `npm install -g vercel@X.Y.Z`
- [ ] Cache key includes CLI version: `${{ runner.os }}-vercel-cli-X.Y.Z`
- [ ] `permissions: {}` at workflow level (has write-capable jobs)

### Security Scanning
- [ ] The new workflow will be scanned by zizmor (automatic via `security-scan.yml`)
- [ ] Any new `artipacked` suppression in `zizmor.yml` has a comment explaining why credentials are needed

---

## Common Mistakes

| Mistake | Correct Pattern |
|---------|----------------|
| `uses: actions/checkout@v4` | Pin to full SHA with `# v4` comment |
| Write scope at workflow level (`contents: write`, `packages: write`, etc.) | Move to the specific job; use `permissions: {}` at workflow level |
| Missing `permissions:` block entirely on a workflow with write jobs | Add `permissions: {}` + per-job grants |
| `persist-credentials: true` on read-only jobs | `persist-credentials: false` unless job pushes |
| `env: NPM_AUTH_TOKEN: ${{ secrets.NPM_AUTH_TOKEN }}` anywhere | npm.org publishes via OIDC Trusted Publishing — declare `id-token: write` on the publish job and drop the token entirely |
| `pnpm dlx tsx scripts/foo.ts` | `pnpm exec tsx scripts/foo.ts` (tsx is in devDependencies) |
| Cache key missing `github.ref_name` | `${{ runner.os }}-turbo-${{ github.ref_name }}-${{ github.sha }}` |
| Upload `dist/` in failure artifacts | Upload `coverage/` only |
| PR comment parsed without bot-author filter | Add `select(.user.type == "Bot" or .user.login == "github-actions[bot]")` |
| `npm install -g vercel@latest` | `npm install -g vercel@X.Y.Z` (exact version) |
| Fork jobs not guarded | `if: github.event.pull_request.head.repo.fork == false` |
| Missing `# zizmor: ignore[artipacked]` on release checkout | Add suppress comment and update `zizmor.yml` |
| Using `pnpm install --lockfile-only` as a security check | It's a no-op when lockfile is consistent — use CODEOWNERS review instead |

---

## Reference — Known-Good SHA Pins (as of this hardening session)

These are the verified SHAs in use in this repo. Check for newer versions when creating new workflows.

| Action | SHA | Version |
|--------|-----|---------|
| `actions/checkout` | `34e114876b0b11c390a56381ad16ebd13914f8d5` | v4 |
| `actions/setup-node` | `49933ea5288caeca8642d1e84afbd3f7d6820020` | v4 |
| `actions/cache` | `0057852bfaa89a56745cba8c7296529d2fc39830` | v4 |
| `actions/upload-artifact` | `ea165f8d65b6e75b540449e92b4886f43607fa02` | v4 |
| `actions/github-script` | `f28e40c7f34bde8b3046d885e986cb6290c5673b` | v7 |
| `pnpm/action-setup` | `b906affcce14559ad1aafd4ab0e942779e9f58b1` | v4 |
| `zizmorcore/zizmor-action` | `135698455da5c3b3e55f73f4419e481ab68cdd95` | v0.4.1 |
| `reviewdog/action-actionlint` | `6fb7acc99f4a1008869fa8a0f09cfca740837d9d` | v1.72.0 |

Always verify the SHA is still correct before using it in a new workflow:
```bash
gh api repos/actions/checkout/git/ref/tags/v4 --jq '.object.sha'
```
