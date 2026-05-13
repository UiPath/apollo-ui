# Apollo UI - Copilot Instructions

## Project Overview

Apollo v.4 is UiPath's open-source design system for building consistent user experiences across all UiPath products. It's a multi-framework component library (React, Web Components) with shared design tokens, built as a monorepo with Turborepo and pnpm.

**Target Audience**: Internal UiPath developers and external consumers using the design system.

**Key Features**: 1300+ icons, comprehensive design tokens, Material UI theming, TypeScript support, Storybook documentation.

## Tech Stack

**Build & Tooling:**
- Monorepo: Turborepo + pnpm workspaces
- Language: TypeScript (strict mode)
- Linter/Formatter: Biome
- Testing: Vitest, React Testing Library, Playwright (visual regression)
- Documentation: Storybook 10
- CI/CD: GitHub Actions
- Release: semantic-release

**Frameworks:**
- React 18+ with Material UI 5.x
- Tailwind CSS with shadcn/ui
- Web Components (Custom Elements)

**Dependencies:**
- Package manager: pnpm >= 10
- Node.js: >= 22
- Build: Rslib/Rsbuild (packages), Vite (Storybook builder)

## Project Structure

```
apollo-ui/
├── .github/              # GitHub workflows, issue templates
├── packages/             # Core + framework packages (REQUIRE TESTS)
│   ├── apollo-core/      # Design tokens, 1300+ icons, fonts
│   ├── apollo-react/     # React components + Material UI theme
│   └── apollo-wind/      # Tailwind CSS + shadcn/ui
├── web-packages/         # Cross-framework web components (REQUIRE TESTS)
│   ├── ap-chat/          # Chat web component
└── apps/                 # Development/demo apps (NO TESTS NEEDED)
    ├── storybook/        # Component documentation
    ├── react-playground/ # React demo app
```

**Package Dependencies:**
- All packages depend on `apollo-core` (design tokens)
- Web components depend on framework packages

## General Guidelines

- **Think critically**: When asked "does this make sense?" or given a plan, analyze it before agreeing. Push back on mistakes.
- **Plan before acting**: For major changes (refactors, new features, behavior changes), propose what you'll change and why before writing code.
- **Do not gold-plate**: Complete the task; do not add unrequested features, files, or abstractions.
- **No documentation files**: Do not create `*.md` files unless the user explicitly requests them.

---

## GitHub Actions Security

Flag these issues immediately when editing or reviewing any `.github/workflows/*.yml` or `.github/actions/*/action.yml` file.

### Permissions

**Safe at workflow level** (read-only, no supply-chain risk):
`contents: read`, `pull-requests: read`, `issues: read`, `packages: read`, `checks: read`, `actions: read`

**Must be job-scoped** — never at workflow level:
| Permission | Risk |
|---|---|
| `contents: write` | Can push code / create releases |
| `packages: write` | Can publish to registries — supply chain critical |
| `id-token: write` | OIDC token; can impersonate workflow to cloud providers |
| `deployments: write` | Can trigger production deployments |
| `pull-requests: write` | Can merge PRs, bypass branch protections |
| `statuses: write` | Can fake commit status checks |
| `issues: write` | Can close/modify issues |
| `checks: write` | Can fake CI check results |
| `security-events: write` | Can upload SARIF; keep job-scoped unless the whole workflow is a dedicated security scanner |

**Pattern:**
- Workflows with any write-capable job → `permissions: {}` at workflow level + explicit per-job grants
- Purely read-only workflows → `permissions: contents: read` at workflow level is sufficient

```yaml
# Workflow with mixed jobs — deny-all + per-job grants
permissions: {}

jobs:
  lint:
    permissions:
      contents: read
  publish:
    permissions:
      contents: write   # push version bump
      packages: write   # publish to GHP
      id-token: write   # npm provenance — only ever on the publish job
```

Flag: missing `permissions:` block, `write-all`, `read-all`, or any of the must-be-job-scoped permissions at workflow level.

### Action Pinning — Full Commit SHA Required

All third-party `uses:` must be pinned to a full 40-character SHA with a human-readable version comment.

```yaml
# Correct
uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4

# Wrong — flag these
uses: actions/checkout@v4
uses: actions/checkout@latest
uses: actions/checkout@main
```

Known-good SHAs in use in this repo:

| Action | SHA | Version |
|--------|-----|---------|
| `actions/checkout` | `34e114876b0b11c390a56381ad16ebd13914f8d5` | v4 |
| `actions/setup-node` | `49933ea5288caeca8642d1e84afbd3f7d6820020` | v4 |
| `actions/cache` | `0057852bfaa89a56745cba8c7296529d2fc39830` | v4 |
| `actions/upload-artifact` | `ea165f8d65b6e75b540449e92b4886f43607fa02` | v4 |
| `actions/github-script` | `f28e40c7f34bde8b3046d885e986cb6290c5673b` | v7 |
| `pnpm/action-setup` | `b906affcce14559ad1aafd4ab0e942779e9f58b1` | v4 |

First-party composite actions (`./.github/actions/*`) are referenced by path — no SHA needed.

### Checkout — `persist-credentials: false`

Always set `persist-credentials: false` on `actions/checkout` unless the job explicitly pushes commits (e.g., the release job).

```yaml
# Correct for read-only jobs
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
  with:
    persist-credentials: false

# Release job exception — must document with zizmor suppress comment
# zizmor: ignore[artipacked]
# Credentials needed for semantic-release to push version bumps
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
  with:
    token: ${{ secrets.RELEASE_TOKEN }}
```

Flag: `actions/checkout` without `persist-credentials: false` on jobs that do not push.

### Secrets — Step-Scoped Only

Never put secrets in workflow-level or job-level `env:` blocks. Always scope to the specific step that needs them.

```yaml
# Wrong — flag this
env:
  NPM_AUTH_TOKEN: ${{ secrets.NPM_AUTH_TOKEN }}

# Correct
- name: Publish
  env:
    NPM_AUTH_TOKEN: ${{ secrets.NPM_AUTH_TOKEN }}
  run: pnpm publish:dev ...
```

Flag: `${{ secrets.* }}` appearing in a workflow-level or job-level `env:` block.

### Fork PR Protection

Any job that uses secrets, publishes packages, or modifies shared state must include a fork guard:

```yaml
if: github.event.pull_request.head.repo.fork == false
```

Also flag: use of `pull_request_target` event for PR-triggered workflows — this passes repo secrets to untrusted fork code. Use `pull_request` instead.

### Install Pattern — Use Composite Action

Always use `./.github/actions/install-node-deps` instead of manually setting up pnpm and Node.

```yaml
# Correct
- uses: ./.github/actions/install-node-deps
  with:
    registry-token: ${{ secrets.GH_NPM_REGISTRY_TOKEN }}

# Wrong — flag manual setup when the composite action suffices
- uses: pnpm/action-setup@...
- uses: actions/setup-node@...
- run: pnpm install
```

Never run `pnpm install` without `--frozen-lockfile` in CI.

Flag: `pnpm dlx`, `pnpx`, or `npx -y` for packages that are already in `devDependencies` — use `pnpm exec` instead.

### Turborepo Cache — Branch-Isolated Key

The cache key must include `github.ref_name` for branch isolation:

```yaml
# Correct
key: ${{ runner.os }}-turbo-${{ github.ref_name }}-${{ github.sha }}
restore-keys: |
  ${{ runner.os }}-turbo-${{ github.ref_name }}-

# Wrong — missing ref_name causes branches to share cache
key: ${{ runner.os }}-turbo-${{ github.sha }}
```

### Artifacts — Coverage Only, Short Retention

Do not upload `dist/`, `.turbo/`, or build outputs in failure artifacts. Only upload `coverage/`.

```yaml
# Correct
- name: Upload Failure Artifacts
  if: failure()
  uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
  with:
    path: coverage/       # NOT dist/ or .turbo/
    retention-days: 3     # failure artifacts
```

Success coverage artifacts: `retention-days: 7`. Failure artifacts: `retention-days: 3`.

---

## pnpm / Node

- Always use `pnpm install --frozen-lockfile` in CI. The composite action handles this.
- Use `pnpm exec <tool>` for CLI tools already in `devDependencies`. Never `pnpm dlx` / `pnpx` / `npx -y` for them.
- `pnpm install --frozen-lockfile` is unaffected by `minimumReleaseAge` (it never re-resolves). `pnpm add` re-resolves and may fail if locked packages were published within the 14-day quarantine.
- When `pnpm add` is blocked by `minimumReleaseAge`, add the offending package to `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`. **The version must be in the comment** — the prune workflow reads it to know when to remove the entry. Format: `- 'pkg'  # 1.2.3 — reason`. Flag any entry that is missing the version.

```yaml
# ✅ correct
minimumReleaseAgeExclude:
  - 'next'  # 16.2.6 — locked version too new when added

# ❌ missing version — prune workflow will never remove this
minimumReleaseAgeExclude:
  - 'next'  # too new when added
```
- Pin the Vercel CLI to an exact version: `npm install -g vercel@X.Y.Z` — never `@latest`.

---

## TypeScript / React Patterns (apollo-react)

### No New Styled-Components or MUI

The `apollo-react` package is migrating from Emotion/MUI to Tailwind CSS + `apollo-wind`. All new code must use Tailwind.

**Block PRs that introduce:**
- New imports from `@emotion/styled`, `@emotion/react`, or usage of `styled.*` / `css` helpers
- New `*.styles.ts` files
- New `@mui/material/*` component imports for building UI (existing MUI theme overrides in `theme/` are exempt)
- New `Ap*` components from `@uipath/apollo-react` used to build other components (these are MUI wrappers — use `apollo-wind` components instead)

**Flag for migration when:**
- A PR significantly modifies an existing file that uses styled-components or MUI — recommend migrating the touched component to Tailwind as part of the change

**Approved patterns:**
- Tailwind utility classes as static literal strings in JSX
- `cn()` from `@uipath/apollo-wind` only when classes conflict or need overrides
- CSS custom properties (`style` prop) for dynamic dimensions
- Existing MUI theme overrides in `packages/apollo-react/src/theme/` (maintenance only)

### Naming Conventions

- React components: `Ap*` prefix (e.g., `ApButton`, `ApTextField`)
- Files: PascalCase for components, camelCase for utilities
- Tests: `*.test.ts` / `*.spec.ts`
- Stories: `*.stories.tsx`

### TypeScript

- Strict mode enabled — use proper types, avoid `any`
- Export types alongside implementations
- Use generics for reusable components

---

## Build-Time vs Runtime Security

**Build-time scripts** (`packages/*/scripts/*.ts`) run in trusted CI. Path operations on repository files, processing trusted Figma exports, and recursive directory traversal are acceptable. Do not flag theoretical issues in this context.

**Runtime code** (components, hooks, utilities) runs in user applications. Flag: missing input validation, XSS, prototype pollution, unsafe dependencies with known CVEs, template injection.

---

## Code Review Approach

**Block on:**
- Missing `permissions: {}` (or a maximally restrictive scope like `contents: read`) at workflow level
- Unpinned third-party actions (`@v4`, `@latest`, branch tags)
- Missing `persist-credentials: false` on read-only checkouts
- Secrets in workflow or job-level `env:` blocks
- `pnpm dlx` / `npx -y` for packages in devDependencies
- Missing `--frozen-lockfile` on `pnpm install` in CI
- Missing fork guard on jobs that use secrets or publish
- New Emotion styled-components or MUI component usage in `apollo-react`
- Breaking changes to public APIs
- Security vulnerabilities in runtime code
- TypeScript errors
- Missing tests in `packages/` or `web-packages/`

**Do not block on:**
- Minor style/formatting (Biome handles this)
- Theoretical security issues in build-time scripts
- Missing tests in `apps/` (Storybook, playgrounds)
- Minor optimizations

---

## Coding Guidelines

### Component Patterns

- Use design tokens from `apollo-core` (never hardcode colors/spacing)
- Prefer composition over inheritance
- Keep components focused and single-purpose

### Testing Requirements

- Required for all code in `packages/` and `web-packages/`
- Unit tests for utilities and hooks
- Component tests for critical UI behavior
- Visual regression tests for components
- NOT required for `apps/` (demo apps, Storybook)

### Documentation

- JSDoc comments for public APIs
- Storybook stories for all components
- README in each package with usage examples

---

## Component Checklist

When creating new components, verify:
- [ ] Follows naming conventions (`Ap*` prefix for React)
- [ ] Uses tokens from `apollo-core`
- [ ] Includes TypeScript types
- [ ] Has Storybook story
- [ ] Has unit tests (if in `packages/` or `web-packages/`)
- [ ] Has visual regression tests
- [ ] Documented in package README
- [ ] No new `@emotion/styled`, `@emotion/react`, or `@mui/material` imports (use Tailwind + apollo-wind)

---

## Available Scripts (from root)

- `pnpm build` — Build all packages
- `pnpm dev` — Run all packages in dev mode
- `pnpm test` — Run all tests
- `pnpm lint` — Lint all packages
- `pnpm storybook:dev` — Run Storybook
- `pnpm format` — Format with Biome
- `pnpm build:packages` — Build only packages/
- `pnpm test:visual` — Visual regression tests
- `pnpm release` — Release packages (semantic-release)
