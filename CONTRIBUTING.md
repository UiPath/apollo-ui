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
- pnpm >= 10

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
- `react-playground` - React testing app

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

### Code Style

- We use Biome for linting and code formatting
- Run `pnpm lint:fix` to fix linting issues
- Run `pnpm format` to format code
- Pre-commit hooks will automatically lint and format code

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

For testing unreleased changes, dev packages are automatically published for every PR.

**Automatic (CI):**
- When you push to a PR branch, packages with changes are published as `<version>-pr<number>`
- Example: `@uipath/apollo-react@3.19.3-pr123`
- A comment is added to the PR with the published versions
- Packages are automatically cleaned up when the PR is closed or merged

> **Note:** Cleanup runs when a PR is closed or merged via GitHub's UI. If a branch is deleted directly (e.g., via `git push origin --delete branch`) without closing the PR, packages may remain published until manually cleaned up.

**Manual (Local):**

```bash
# Publish a dev version
pnpm publish:dev @uipath/apollo-react my-feature
# → Publishes @uipath/apollo-react@3.19.3-my-feature

# Unpublish a dev version (within 72 hours of publication)
pnpm unpublish:dev @uipath/apollo-react my-feature
```

**Token Setup (for manual publishing):**

1. Go to [npmjs.com](https://www.npmjs.com/settings/YOUR_USERNAME/tokens) → Access Tokens
2. Generate a new **Automation** token:
   - ✅ Bypass two-factor authentication (required for automation)
   - ✅ Read and write permissions
3. Set the environment variable:
   ```bash
   export NPM_AUTH_TOKEN=your_token_here
   ```

> **Note:** npm only allows unpublishing within 72 hours of publication. After that, use `npm deprecate` instead.

**Installing dev packages:**

```bash
# Install a PR preview version (from CI)
npm install @uipath/apollo-react@3.19.3-pr123

# Install a manually published dev version (local)
npm install @uipath/apollo-react@3.19.3-my-feature
```

### Version Ranges

When a commit affects multiple packages:

```bash
# Only apollo-react is bumped and published
feat(apollo-react): add new ApButton variant

# Both packages are bumped and published
feat(apollo-react): add ApButton variant
feat(apollo-core): add new color token for button variant
```

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
    ├── storybook/         # Storybook
    └── react-playground/  # React testing
```

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the best solution, not winning arguments
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
