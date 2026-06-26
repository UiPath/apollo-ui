# Contributing to Apollo Design System

Thank you for your interest in contributing to the Apollo Design System! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Development Setup](#development-setup)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Making Changes](#making-changes)
- [Release Process](#release-process)
- [Dev Packages (Preview Releases)](#dev-packages-preview-releases)
- [Code of Conduct](#code-of-conduct)

## Development Setup

### Prerequisites

- Node.js >= 22
- pnpm >= 11

### Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/UiPath/apollo-ui.git
   cd apollo-ui
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build all packages:

   ```bash
   pnpm build
   ```

4. Start development:
   ```bash
   pnpm dev
   ```

### Running Tests

```bash
# Run all tests
pnpm test

# Run linting
pnpm lint

# Run type checking
pnpm typecheck
```

## Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages. This enables automatic versioning and changelog generation.

### Format

```
type(scope): subject

[optional body]

[optional footer]
```

### Type

Must be one of:

- **feat**: A new feature (triggers minor version bump)
- **fix**: A bug fix (triggers patch version bump)
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Changes to build system or dependencies
- **ci**: Changes to CI configuration
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Scope

**Required**. Must be one of the following package names:

- `apollo-core` - Design tokens, icons, fonts
- `apollo-react` - React components
- `apollo-wind` - Tailwind/shadcn components
- `apollo-vertex` - Documentation site and component registry
- `ap-chat` - Chat component
- `storybook` - Storybook app

Or one of these monorepo-wide scopes:

- `repo` - Repository-wide changes
- `ci` - CI/CD changes
- `docs` - Documentation changes
- `build` - Build system changes

### Subject

- Use imperative, present tense: "add" not "added" nor "adds"
- Don't capitalize first letter
- No period (.) at the end
- Maximum 100 characters

### Breaking Changes

To trigger a major version bump, add `!` after the type/scope OR include `BREAKING CHANGE:` in the footer:

```bash
feat(apollo-react)!: remove deprecated Button API

BREAKING CHANGE: The `variant` prop has been renamed to `appearance`.
```

### Examples

**Feature (minor version bump):**

```bash
feat(apollo-react): add new ApDatePicker component
```

**Bug fix (patch version bump):**

```bash
fix(apollo-react): resolve import path for theme utilities
```

**Breaking change (major version bump):**

```bash
feat(apollo-core)!: update color tokens structure

BREAKING CHANGE: All color tokens now use numeric scale (100-900)
instead of semantic names (light, dark).

Migration:
- color-primary-light → color-primary-300
- color-primary-dark → color-primary-700
```

**Documentation:**

```bash
docs(repo): add contributing guidelines
```

**CI changes:**

```bash
ci: update Node.js version in GitHub Actions
```

### Commit Validation

Commits are validated automatically:

1. **Locally**: Git hook validates commit message format before allowing commit
2. **CI**: Pull requests have all commits validated

If your commit message doesn't follow the format, the commit will be blocked.

## Making Changes

### Branch Naming

- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Documentation: `docs/description`

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following our coding standards
3. Write or update tests as needed
4. Ensure all tests pass: `pnpm test`
5. Build all packages: `pnpm build`
6. Commit using conventional commit format
7. Push your branch and create a pull request
8. Wait for CI checks to pass
9. Request review from maintainers

### Stale PR Policy

Open PRs with no new commits for more than **2 weeks** are automatically closed each week by the [Close Stale PRs](.github/workflows/close-stale-prs.yml) workflow. A comment is posted on close, and you can reopen the PR at any time if you'd like to resume the work.

Staleness is measured from the PR's **last commit** — comments, label changes, and other activity don't reset the clock.

**Opting out:** add the `do-not-close` label to a PR to exempt it from this automation (useful for long-lived WIPs or PRs blocked on external dependencies).

**Reopening a closed PR:** standard PR checks re-run on reopen. If your PR previously had the `dev-packages` label, dev package versions were unpublished when the PR closed — re-add the label after reopening to publish a fresh set.

**Maintainers:** the workflow supports a dry-run via `workflow_dispatch` (defaults to dry-run when triggered manually, real run when triggered on schedule).

### Code Style

- We use Biome for linting and code formatting
- Run `pnpm lint:fix` to fix linting issues
- Run `pnpm format` to format code
- Pre-commit hooks will automatically lint and format code

## Registry Configuration

This repository uses a **dual-registry publishing setup**:

### Why Two Registries?

All Apollo packages (`@uipath/apollo-*`) are published to **both** registries simultaneously:

- **npm** (`registry.npmjs.org`) - For external open-source users
  - No authentication required for installation
  - Global accessibility and discoverability
  - Publishes via npm OIDC Trusted Publisher (no long-lived token in CI)

- **GitHub Package Registry** (`npm.pkg.github.com`) - For internal UiPath users
  - Seamless installation for users with existing `.npmrc` configuration
  - Also hosts private dependencies
  - Requires: GitHub App installation token for publishing (managed by CI)

### How It Works

**Installing packages as a user:**

*External users (default):*
```bash
npm install @uipath/apollo-react  # Pulls from npm
```

*Internal UiPath users with `.npmrc`:*
```
@uipath:registry=https://npm.pkg.github.com
```
```bash
npm install @uipath/apollo-react  # Pulls from GitHub automatically
```

**Publishing packages (automated):**

When code is merged to `main`:
1. Package is built and tested
2. Package is published to **npm** via an OIDC token minted from the workflow's `id-token: write` grant (npm Trusted Publisher)
3. Package is published to **GitHub Package Registry** using a short-lived GitHub App token
4. Both registries receive identical versions

## Release Process

Releases are **fully automated** using semantic-release based on commit messages:

### How It Works

1. **Developer commits** using conventional commit format
2. **CI analyzes commits** on push to `main`
3. **semantic-release determines** version bump:
   - `fix(...)` → Patch version (0.0.1 → 0.0.2)
   - `feat(...)` → Minor version (0.0.1 → 0.1.0)
   - `feat(...)!` or `BREAKING CHANGE` → Major version (0.0.1 → 1.0.0)
4. **Automatic actions**:
   - Version bumped in package.json
   - CHANGELOG.md generated/updated
   - Git tag created
   - Package published to NPM
   - GitHub Release created

### Independent Package Versioning

Each package is versioned independently:

- `@uipath/apollo-core@1.2.3`
- `@uipath/apollo-react@2.0.1`

Only packages with new commits since their last release will be published.

### Dev Packages (Preview Releases)

For testing unreleased changes, dev packages can be published for PRs on-demand. Dev packages are published **only to GitHub Package Registry** — public npm is reserved for production releases.

**Automatic (CI):**
- **Trigger:** Add the `dev-packages` label to your PR to publish dev versions
- When the label is present, packages with changes are published as `<version>-pr<number>.<short-sha>`
- Example: `@uipath/apollo-react@3.19.3-pr123.abc1234`
- Published to **GitHub Package Registry** with `@dev` tag
- A comment is added to the PR with the published versions and installation instructions
- **Continuous publishing:** New commits will automatically re-publish while the label is present
- **Stop publishing:** Remove the `dev-packages` label to stop publishing on subsequent commits
- Packages are automatically cleaned up from GitHub Package Registry when the PR is closed or merged

**Manual (Local):**

```bash
# Publish a dev version to GitHub Package Registry
pnpm publish:dev @uipath/apollo-react my-feature
# → Publishes @uipath/apollo-react@3.19.3-my-feature to GitHub Package Registry

# Unpublish a dev version
pnpm unpublish:dev @uipath/apollo-react my-feature
```

**Token Setup (for manual publishing):**

- Go to [github.com/settings/tokens](https://github.com/settings/tokens) → Fine-grained tokens
- Set resource owner to **UiPath**, repository access to **UiPath/apollo-ui** only
- Permissions: `Packages: Read and write`
- Export: `export GH_NPM_REGISTRY_TOKEN=your_github_token`

**Installing dev packages:**

Dev packages live only on GitHub Package Registry. Internal UiPath users with `.npmrc` configured for `@uipath:registry=https://npm.pkg.github.com` install them as normal:

```bash
# Install latest preview version
npm install @uipath/apollo-react@dev

# Install specific PR preview (from CI)
npm install @uipath/apollo-react@3.19.3-pr123.abc1234

# Install manually published dev version
npm install @uipath/apollo-react@3.19.3-my-feature
```

External users cannot install dev packages — they're scoped to UiPath internal consumption. Public npm only receives production releases.

### Version Ranges

When a commit affects multiple packages:

```bash
# Only apollo-react is bumped and published
feat(apollo-react): add new ApButton variant

# Both packages are bumped and published
feat(apollo-react): add ApButton variant
feat(apollo-core): add new color token for button variant
```

## Maintenance Releases

Maintenance branches allow backporting fixes to older major versions after a new major version has been released. For example, releasing `@uipath/apollo-react@3.70.4` after `4.0.0` ships.

### Branch Naming

Maintenance branches are package-scoped: `support/<package-name>@<major>.x`

Examples: `support/apollo-react@3.x`, `support/apollo-core@5.x`

### When to Create a Maintenance Branch

Create one when main has moved to a newer major and you need to continue shipping fixes for the previous major.

### Creating a Maintenance Branch

Use the Claude Code skill:

```
"Create a support branch for apollo-react v3"
```

The skill (`.claude/skills/cut-maintenance-branch/SKILL.md`) handles the full workflow:
1. Finds the latest `@uipath/apollo-react@3.*` tag
2. Creates and pushes `support/apollo-react@3.x` bare from that tag
3. Opens a PR to the support branch that locks `workspace:*` deps to concrete versions, replaces `"main"` in `.releaserc.json` with the support branch entry, and regenerates the lockfile

Each support branch owns its own `.releaserc.json` — main's `.releaserc.json` is never modified. The support branch's `branches` array contains only its own entry (not `"main"`).

### Backporting Fixes

Create a PR targeting the maintenance branch directly:

```bash
git checkout support/apollo-react@3.x
git checkout -b fix/my-fix
# make changes
git push -u origin fix/my-fix
# open PR targeting support/apollo-react@3.x
# → after merge, CI releases apollo-react@3.70.4 with dist-tag `latest-v3`
```

A scope check workflow enforces that PRs to support branches only modify files within the target package's directory.

### Installing Maintenance Releases

Maintenance releases publish under a dedicated npm dist-tag (not `latest`):

```bash
# Install latest maintenance release for 3.x
npm install @uipath/apollo-react@latest-v3

# Install a specific version
npm install @uipath/apollo-react@3.70.4
```

### Cross-Package Dependency Updates

Support branches lock workspace deps to exact versions (e.g., `5.9.0` instead of `workspace:*`). If a fix requires a newer version of a sibling package:

1. **If the dependency is still on the same major on `main`** — land the fix on `main`, let it publish, then bump the version in the support branch's `package.json` and run `pnpm install`.
2. **If the dependency needs its own support branch** — cut one (e.g., `support/apollo-core@5.x`), publish the fix from there, then update the version here.

### How Other Packages Behave

When CI runs `pnpm release` on a maintenance branch, semantic-release executes for all packages. Packages whose `.releaserc.json` doesn't list the branch simply skip with exit code 0 — no special handling needed.

## Package Structure

```
apollo-ui/
├── packages/              # Framework packages
│   ├── apollo-core/       # Design tokens
│   ├── apollo-react/      # React components
│   └── apollo-wind/       # Tailwind components
├── web-packages/          # Web components
│   └── ap-chat/           # Chat component
└── apps/                  # Development apps
    ├── apollo-vertex/     # Documentation site
    └── storybook/         # Storybook
```

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the best solution, not winning arguments
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
