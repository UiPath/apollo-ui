# Apollo UI — Copilot Instructions

## Project Overview

Apollo v.4 is UiPath's open-source design system. Monorepo with Turborepo + pnpm workspaces, TypeScript strict mode, Biome for linting/formatting, Vitest + Playwright for testing, Storybook 10 for docs, semantic-release for publishing.

## Project Structure

```
packages/        # apollo-core (tokens/icons), apollo-react (React+MUI), apollo-wind (Tailwind+shadcn) — REQUIRE TESTS
web-packages/    # ap-chat (web component) — REQUIRE TESTS
apps/            # storybook — NO TESTS NEEDED
.github/         # workflows, actions, scripts
```

All packages depend on `apollo-core`. Node ≥ 22, pnpm ≥ 11. Build: Rslib/Rsbuild (packages), Vite (Storybook).

## General Guidelines

- **Think critically** — analyze before agreeing; push back on mistakes.
- **Plan before acting** — for major changes propose what + why before writing code.
- **Do not gold-plate** — complete the task, no unrequested features or abstractions.
- **No docs files** — do not create `*.md` files unless explicitly asked.

---

## GitHub Actions Security

Rules apply whenever any `.github/` file is touched.

### Permissions

`permissions: {}` at workflow level on any workflow with a write-capable job. Per-job grants only.

**Must be job-scoped — never workflow-level:**

| Permission | Risk |
|---|---|
| `contents: write` | Push code / create releases |
| `packages: write` | Publish to registries — supply chain critical |
| `id-token: write` | OIDC — only on jobs that call `--provenance` or use OIDC directly |
| `deployments: write` | Production deployments |
| `pull-requests: write` | Merge PRs |
| `statuses: write` | Fake commit status checks |
| `issues: write` | Close/modify issues |
| `checks: write` | Fake CI check results |

### Action SHA Reference

All `uses:` pinned to a full 40-character SHA with a `# vX` comment. No `@v*`, `@latest`, `@main`.

| Action | SHA | Version |
|---|---|---|
| `actions/checkout` | `34e114876b0b11c390a56381ad16ebd13914f8d5` | v4 |
| `actions/setup-node` | `49933ea5288caeca8642d1e84afbd3f7d6820020` | v4 |
| `actions/cache` | `0057852bfaa89a56745cba8c7296529d2fc39830` | v4 |
| `actions/upload-artifact` | `ea165f8d65b6e75b540449e92b4886f43607fa02` | v4 |
| `actions/download-artifact` | `d3f86a106a0bac45b974a628896c90dbdf5c8093` | v4 |
| `actions/github-script` | `ed597411d8f924073f98dfc5c65a23a2325f34cd` | v8 |
| `actions/dependency-review-action` | `a1d282b36b6f3519aa1f3fc636f609c47dddb294` | v5.0.0 |
| `actions/attest-sbom` | `c604332985a26aa8cf1bdc465b92731239ec6b9e` | v4.1.0 |
| `actions/attest-build-provenance` | `a2bbfa25375fe432b6a289bc6b6cd05ecd0c4c32` | v4.1.0 |
| `actions/create-github-app-token` | `bcd2ba49218906704ab6c1aa796996da409d3eb1` | v3.2.0 |
| `pnpm/action-setup` | `b906affcce14559ad1aafd4ab0e942779e9f58b1` | v4 |
| `zizmorcore/zizmor-action` | `135698455da5c3b3e55f73f4419e481ab68cdd95` | v0.4.1 |
| `reviewdog/action-actionlint` | `6fb7acc99f4a1008869fa8a0f09cfca740837d9d` | v1.72.0 |
| `advanced-security/dismiss-alerts` | `3478381bd53e9f9a9ea1c23bd25ef0ec236e0d06` | v2 |
| `github/codeql-action/init` | `45cbd0c69e560cd9e7cd7f8c32362050c9b7ded2` | v4.32.2 |
| `github/codeql-action/analyze` | `45cbd0c69e560cd9e7cd7f8c32362050c9b7ded2` | v4.32.2 |

First-party composite actions (`./.github/actions/*`) referenced by path — no SHA needed.

### PR Review Checklist

When any PR touches `.github/workflows/`, `.github/actions/`, `.npmrc`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, or `scripts/`:

**Action pinning**
- [ ] All `uses:` are full 40-char SHAs with `# vX` comment — no tags, branches, or partial SHAs
- [ ] New actions verified against the action's releases page before adding

**Permissions**
- [ ] `permissions: {}` at workflow level when any job needs write access
- [ ] `id-token: write` only on the publish job (provenance/OIDC)
- [ ] `contents: write` only on jobs that push commits (release, prune-release-age-exemptions)

**Secrets**
- [ ] No `${{ secrets.* }}` in workflow-level or job-level `env:` — step-scoped only
- [ ] `persist-credentials: false` on all checkouts that don't push
- [ ] Jobs that must push inject credentials via `git remote set-url` immediately before the push, not at checkout
- [ ] Secrets appearing in command output are redacted before `$GITHUB_OUTPUT`, step summaries, or PR comments

**Fork safety**
- [ ] Every job using secrets or publishing has `if: github.event.pull_request.head.repo.fork == false`
- [ ] No `pull_request_target` trigger — use `pull_request` (see Supply Chain §3)
- [ ] No `on: workflow_run` trigger without an explicit `if: github.event.workflow_run.head_repository.full_name == github.repository` guard — same trust-boundary collapse risk as `pull_request_target`
- [ ] PR comment parsing filters by `select(.user.type == "Bot" or .user.login == "github-actions[bot]")`
- [ ] Jobs triggered by `workflow_run` that consume artifacts validate attestation via `gh attestation verify` before executing any artifact content

**Install safety**
- [ ] Every `pnpm install` uses `--frozen-lockfile` — use `./.github/actions/install-node-deps`, never call pnpm directly
- [ ] No bare `pnpm dlx <pkg>` / `npx -y <pkg>` without exact version pin
- [ ] Approved pinned `pnpm dlx` versions: `shadcn@4.4.0`, `serve@14.2.6`, `tsx@4.20.6` — changes require same review bar as dependency updates
- [ ] New `minimumReleaseAgeExclude` entries in `pnpm-workspace.yaml` include exact version + reason: `- 'pkg'  # x.y.z — reason`

**Cache**
- [ ] Turbo cache key: `${{ runner.os }}-turbo-${{ github.ref_name }}-${{ github.sha }}`; `restore-keys` scoped to same branch — never matches entries from other branches or PR runs
- [ ] pnpm store cache key (if used): also includes `github.sha`; `restore-keys` scoped to same branch — never broad enough to be written by a fork/PR run and read by a release run
- [ ] Scheduled workflow jobs (`on: schedule`) do not restore caches under keys that a fork PR could have written

**Injection**
- [ ] No `${{ github.event.* }}` or `${{ github.head_ref }}` interpolated directly in `run:` — pass through `env:`
- [ ] `GITHUB_OUTPUT` heredoc delimiters use `openssl rand -hex 8`, not the literal string `EOF`

**CODEOWNERS + tooling**
- [ ] New CI-executed scripts and security-sensitive configs are covered by CODEOWNERS
- [ ] New `# zizmor: ignore[rule]` suppressions have a comment explaining why
- [ ] New `// codeql[query-id]` inline suppressions require @UiPath/Apollo sign-off — `codeql.yml` auto-dismisses them post-merge

---

## Supply Chain Attack Reference

Flag these patterns immediately:

| Attack | Flag this pattern | Defense in repo |
|---|---|---|
| **Lockfile drift (shai-hulud)** | `pnpm install` without `--frozen-lockfile`; `npm install` | `install-node-deps` enforces `--frozen-lockfile` |
| **Day-zero publish via pnpm dlx** | `pnpm dlx pkg` without `@x.y.z`; `npx -y pkg` | All `pnpm dlx` calls version-pinned |
| **TanStack: `pull_request_target` + pnpm store cache poison + OIDC extract** | `on: pull_request_target`; broad `restore-keys` missing `ref_name`; pnpm store cache writable from fork run | No `pull_request_target`; Turbo + pnpm store cache branch-scoped |
| **Cache poisoning (pnpm store)** | `actions/cache` write from fork/PR run with restore-key matching release pipeline | pnpm store cache keys include `github.sha`; `restore-keys` scoped to same branch only |
| **Published package protocol injection** | `github:`, `file:`, `link:`, or `git+` protocol in `optionalDependencies`/`dependencies` of a new/updated package | Audit lockfile diff; flag any non-registry URL reference in prod deps |
| **OIDC trusted-publisher scope too broad** | `id-token: write` on a workflow that isn't `release.yml`; npm trusted-publisher not constrained by `job_workflow_ref` | `id-token: write` job-scoped to release job only; verify npmjs.org trusted-publisher settings include `job_workflow_ref` for `release.yml@refs/heads/main` |
| **`workflow_run` without head-repo guard** | `on: workflow_run` without `if: github.event.workflow_run.head_repository.full_name == github.repository` | No `workflow_run` trigger in repo; add guard if ever introduced |
| **Maintainer account takeover / burst publish** | Package receives 3+ new versions in a 6-minute window; new maintainer added within last 30 days; unusual publish time | `monitor-npm-publishes.yml` flags version-to-release mismatch; check socket.dev for maintainer changes |
| **Forged bot commit identity** | Version-bump commit where committer email ≠ `semantic-release-bot@users.noreply.github.com` | Check committer email on release commits; semantic-release-bot identity is fixed in `release.yml` git config step |
| **Dependency confusion** | New `.npmrc` adding `@uipath` registry routing, or `publishConfig.registry` change pointing `@uipath` at a non-npm.org registry | Repo `.npmrc` carries only the GHP publish `_authToken` placeholder — never an `@uipath:registry=` line; all 4 names claimed on npm.org; publish script pins `--@uipath:registry=https://registry.npmjs.org` for the npm.org publish step |
| **Workflow injection** | `${{ github.event.*.title }}` etc. in `run:` blocks | Pass via `env:` |
| **Compromised maintainer / day-zero** | Any production dep update without verifying age, changelog, and postinstall scripts | `minimumReleaseAge: 20160` (14d quarantine); `npm audit signatures` |
| **Fork secret exfiltration** | Missing `fork == false` guard; `pull_request_target` | All publish/secret jobs guarded |
| **Artifact injection** | Cross-run `actions/download-artifact` without attestation | Same-run only; `actions/attest-sbom` on release |

---

## Commit Messages & Semantic Versioning

Every package publishes via `semantic-release` with the `conventionalcommits` preset (`semantic-release-monorepo` scopes each release to the commits that touch that package's path). **The commit message alone decides the version bump — there is no manual approval gate.** A published version can never be unpublished (npm blocks unpublish once a package has dependents), so a wrong bump is permanent.

**What triggers each bump:**

| Commit | Bump |
|---|---|
| `fix: ...` | patch (`x.y.Z`) |
| `feat: ...` | minor (`x.Y.z`) |
| `feat(scope)!: ...` / `fix!: ...` — any `!` after the type/scope | **major (`X.y.z`)** |
| `BREAKING CHANGE:` in the body/footer | **major (`X.y.z`)** |

**Rules for authoring commits (including AI-generated / co-authored messages):**

- **Never add `!` or a `BREAKING CHANGE:` footer unless the change actually breaks the package's public contract:** a removed or renamed export/prop, a changed prop type or required-ness, a removed variant, or a documented default that existing consumers depend on.
- A behavior tweak, bug fix, new optional prop, or internal refactor is **`fix:` or `feat:`, not breaking**, even when runtime behavior changes. "The button now opens a new tab" is `feat:`/`fix:`, not `feat!:`.
- When unsure whether a change is breaking, default to `feat:`/`fix:` and flag the uncertainty to a maintainer in the PR. Do **not** reflexively mark a change breaking.
- Prefer the package name as the commit scope (`apollo-react`, `apollo-wind`, `apollo-core`, `ap-chat`) for a readable changelog. Release attribution is by **file path**, not scope, so a non-package scope like `docs(repo)` / `ci` won't misroute a bump.
- **Keep a single commit's changes within one package's folder.** `semantic-release-monorepo` routes each commit to a package by the files it touched, so a commit that edits two packages' files applies its bump level (including a `!` major) to *both*, regardless of scope. Split cross-package changes into separate commits.

**In review, block any commit (including the squash-merge title) that marks a change breaking when it does not remove, rename, or retype a public export or prop.** Ask the author to reword it before merge. Once merged to `main` and released, a bad major bump cannot be reverted.

---

## Release and Publishing Review

When reviewing `release.yml`, `dev-publish.yml`, `dev-cleanup.yml`, or `scripts/`:

- [ ] `semantic-release` config not changed to publish to unexpected registries or add unexpected plugins
- [ ] `--provenance` still present in `publish-to-registries.sh` (SLSA L2)
- [ ] All publishes scoped to `@uipath/*` only
- [ ] Dev-publish versions use `x.y.z-prNNN.sha` format
- [ ] `dev-publish.yml` / `dev-cleanup.yml` cleanup steps validate `^@uipath/[a-z0-9-]+@[0-9.]+-pr[0-9]+(\.[a-z0-9]+)?$` before `pnpm unpublish:dev`
- [ ] npm publishes use OIDC Trusted Publishing — no `NPM_AUTH_TOKEN` / `NPM_TOKEN` in workflow `env:`; release job declares `id-token: write`
- [ ] GitHub App token (`steps.app-token.outputs.token`) step-scoped to the steps that need it — not job-level or workflow-level
- [ ] `release.yml` checkout uses `persist-credentials: false`; credentials injected via `git remote set-url` only after `pnpm build` + `pnpm test`

---

## Dependabot Review

**All Dependabot PRs:**
- [ ] `pnpm-lock.yaml` diff matches the stated update — no unexpected additions
- [ ] Production deps: new version published >14 days ago (Dependabot bypasses `minimumReleaseAge`)
- [ ] `dependency-review-action` check passed
- [ ] `Audit Package Signatures` check passed when `pnpm-lock.yaml` changed

**All production dependency updates — apply these checks before approving:**
1. `pnpm-lock.yaml` diff matches the stated update — no unexpected additions or removals
2. New version was published **more than 14 days ago** — Dependabot bypasses `minimumReleaseAge`, manual check required
3. Read the changelog between old and new version for anything unexpected
4. Verify no new or changed `postinstall`/`preinstall` scripts, obfuscated code, or new remote fetch calls introduced in the new version
5. Check https://socket.dev/npm/package/[package-name] for supply chain signals — look specifically for recent maintainer additions (last 90 days) and burst-publish patterns
6. `dependency-review-action` check passed; `Audit Package Signatures` passed if `pnpm-lock.yaml` changed
7. Confirm the PR was opened by `app/dependabot` (GitHub's verified bot) — verify the PR author badge. A human PR falsely attributing changes to Dependabot is suspicious.
8. Flag any `github:`, `file:`, `link:`, or `git+` protocol reference appearing in the updated `pnpm-lock.yaml` — legitimate Dependabot PRs only introduce registry versions.
9. If a package received a new maintainer within the last 90 days AND the new version was published within the last 14 days, hold the PR until the 14-day quarantine window passes even if Dependabot bypassed `minimumReleaseAge`.

Note: `@tanstack/*` packages have a confirmed supply chain incident history (May 2025) — apply extra care, but these checks apply to every production dependency, not just tanstack.

**GitHub Actions SHA updates:** verify new SHA resolves to a tagged release (not arbitrary commit); `# vX.Y.Z` comment matches the tag.

**Grouped PRs:** apply all checks to every production dep in the group individually before approving the group.

---

## pnpm / Node

- Use `./.github/actions/install-node-deps` in CI — never call `pnpm install` directly.
- Use `pnpm exec <tool>` for tools in `devDependencies` — not `pnpm dlx`.
- `pnpm install --frozen-lockfile` never re-resolves. `pnpm add` re-resolves and may fail `minimumReleaseAge`. When it does, add to `minimumReleaseAgeExclude` with version + reason:
  ```yaml
  - 'pkg'  # 1.2.3 — locked version too new when added   # ✅
  - 'pkg'  # too new                                      # ❌ missing version, prune workflow won't remove it
  ```
- Vercel CLI: always `npm install -g vercel@X.Y.Z` — never `@latest`.
- **pnpm 11 breaking change ([pnpm/pnpm#11536](https://github.com/pnpm/pnpm/issues/11536)):** pnpm 11 silently ignores the entire `pnpm.*` block in `package.json` (overrides, packageExtensions, onlyBuiltDependencies, etc.). All pnpm configuration must live in `pnpm-workspace.yaml`. Never add `pnpm.overrides` or `pnpm.packageExtensions` to `package.json` — they will be silently ignored with no warning.

---

## TypeScript / React (apollo-react)

The package is migrating from Emotion/MUI → Tailwind + `apollo-wind`. **Block:**
- New `@emotion/styled`, `@emotion/react`, `styled.*`, `css` helper imports
- New `*.styles.ts` files
- New `@mui/material/*` UI component imports (theme overrides in `theme/` are exempt)
- New `Ap*` component imports from `@uipath/apollo-react` used to build other components

**Use instead:** Tailwind utility classes (static literal strings); `cn()` from `apollo-wind` only when classes conflict; CSS custom properties for dynamic dimensions.

**Naming:** React components `Ap*`; files PascalCase for components, camelCase for utilities; tests `*.test.ts` / `*.spec.ts`; stories `*.stories.tsx`. TypeScript strict — no `any`, export types alongside implementations.

When a PR significantly modifies an existing styled/MUI component, migrate it to Tailwind as part of the change.

**Prefer keeping components platform-data-agnostic.** These packages are open-source and consumed externally, so lean away from "connected" components that embed UiPath platform data-fetching (Discovery, Orchestrator folders, BYO connections, etc.). Prefer accepting data via props, render props, or callbacks and leaving the platform wiring to the consuming app. This is a preference, not a hard block. Raise it in review when a new component reaches into platform data sources directly.

---

## Code Review

**Block on:**
- Workflow-level `permissions` missing or includes write-capable permission that should be job-scoped
- Unpinned actions (`@v*`, `@latest`, branch refs)
- Missing `persist-credentials: false` on read-only checkouts
- `${{ secrets.* }}` in workflow/job-level `env:`
- `pnpm install` without `--frozen-lockfile`; `pnpm dlx` / `npx -y` without version pin
- Missing fork guard on secret-using or publishing jobs
- `on: workflow_run` trigger without `if: github.event.workflow_run.head_repository.full_name == github.repository` guard
- `optionalDependencies`, `dependencies`, or `devDependencies` containing `github:`, `git+`, `file:`, or `link:` protocol references in a PR that also modifies `pnpm-lock.yaml`
- Modification to `monitor-npm-publishes.yml` that removes or weakens the alert-on-mismatch logic
- Literal `EOF` heredoc delimiter in a `run:` step where the output value is attacker-influenced — use `openssl rand -hex 8`
- New Emotion/MUI usage in `apollo-react`
- A commit marked breaking (`!` or `BREAKING CHANGE:`) for a change that does not remove/rename/retype a public export or prop — mislabeling forces a permanent, irreversible major version bump (see Commit Messages & Semantic Versioning)
- Breaking public API changes
- Runtime security vulnerabilities (XSS, injection, prototype pollution)
- TypeScript errors
- Missing tests in `packages/` or `web-packages/`

**Do not block on:** style/formatting (Biome); theoretical issues in build-time scripts; missing tests in `apps/`; minor optimizations.

---

## Component Checklist

- [ ] `Ap*` prefix, tokens from `apollo-core`, TypeScript types
- [ ] Storybook story, unit tests (if in `packages/` or `web-packages/`), visual regression tests
- [ ] README entry
- [ ] No new `@emotion/styled`, `@emotion/react`, or `@mui/material` imports

---

## Available Scripts

| Command | Does |
|---|---|
| `pnpm build` | Build all packages |
| `pnpm dev` | Dev mode all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format with Biome |
| `pnpm storybook:dev` | Run Storybook |
| `pnpm test:visual` | Visual regression tests |
| `pnpm release` | Release (semantic-release) |
