# Apollo UI — Copilot Instructions

## Project Overview

Apollo v.4 is UiPath's open-source design system. Monorepo with Turborepo + pnpm workspaces, TypeScript strict mode, Biome for linting/formatting, Vitest + Playwright for testing, Storybook 10 for docs, semantic-release for publishing.

## Project Structure

```
packages/        # apollo-core (tokens/icons), apollo-react (React+MUI), apollo-wind (Tailwind+shadcn) — REQUIRE TESTS
web-packages/    # ap-chat (web component) — REQUIRE TESTS
apps/            # storybook, react-playground — NO TESTS NEEDED
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
- [ ] PR comment parsing filters by `select(.user.type == "Bot" or .user.login == "github-actions[bot]")`

**Install safety**
- [ ] Every `pnpm install` uses `--frozen-lockfile` — use `./.github/actions/install-node-deps`, never call pnpm directly
- [ ] No bare `pnpm dlx <pkg>` / `npx -y <pkg>` without exact version pin
- [ ] Approved pinned `pnpm dlx` versions: `shadcn@4.4.0`, `serve@14.2.6`, `tsx@4.20.6` — changes require same review bar as dependency updates
- [ ] New `minimumReleaseAgeExclude` entries in `pnpm-workspace.yaml` include exact version + reason: `- 'pkg'  # x.y.z — reason`

**Cache**
- [ ] Cache keys include `github.sha`; Turbo pattern: `${{ runner.os }}-turbo-${{ github.ref_name }}-${{ github.sha }}`
- [ ] `restore-keys` scoped to same branch first — never broad enough to match entries from unrelated branches

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
| **TanStack: `pull_request_target` + cache poison + OIDC extract** | `on: pull_request_target`; broad Turbo `restore-keys` missing `ref_name` | No `pull_request_target`; Turbo cache branch-scoped |
| **Dependency confusion** | `.npmrc` change to `@uipath` registry routing | `@uipath:registry=https://npm.pkg.github.com`; all 4 names claimed on npm.org |
| **Workflow injection** | `${{ github.event.*.title }}` etc. in `run:` blocks | Pass via `env:` |
| **Compromised maintainer / day-zero** | Any production dep update without verifying age, changelog, and postinstall scripts | `minimumReleaseAge: 20160` (14d quarantine); `npm audit signatures` |
| **Fork secret exfiltration** | Missing `fork == false` guard; `pull_request_target` | All publish/secret jobs guarded |
| **Artifact injection** | Cross-run `actions/download-artifact` without attestation | Same-run only; `actions/attest-sbom` on release |

---

## Release and Publishing Review

When reviewing `release.yml`, `dev-publish.yml`, `dev-cleanup.yml`, or `scripts/`:

- [ ] `semantic-release` config not changed to publish to unexpected registries or add unexpected plugins
- [ ] `--provenance` still present in `publish-to-registries.sh` (SLSA L2)
- [ ] All publishes scoped to `@uipath/*` only
- [ ] Dev-publish versions use `x.y.z-prNNN.sha` format
- [ ] `dev-publish.yml` / `dev-cleanup.yml` cleanup steps validate `^@uipath/[a-z0-9-]+@[0-9.]+-pr[0-9]+(\.[a-z0-9]+)?$` before `pnpm unpublish:dev`
- [ ] `RELEASE_TOKEN`, `NPM_AUTH_TOKEN`, `NPM_TOKEN`, `GH_NPM_REGISTRY_TOKEN` step-scoped to the Release step only — not job-level or workflow-level
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
5. Check https://socket.dev/npm/package/[package-name] for supply chain signals
6. `dependency-review-action` check passed; `Audit Package Signatures` passed if `pnpm-lock.yaml` changed

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

---

## Code Review

**Block on:**
- Workflow-level `permissions` missing or includes write-capable permission that should be job-scoped
- Unpinned actions (`@v*`, `@latest`, branch refs)
- Missing `persist-credentials: false` on read-only checkouts
- `${{ secrets.* }}` in workflow/job-level `env:`
- `pnpm install` without `--frozen-lockfile`; `pnpm dlx` / `npx -y` without version pin
- Missing fork guard on secret-using or publishing jobs
- New Emotion/MUI usage in `apollo-react`
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
