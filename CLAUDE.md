# CLAUDE.md

## Rules

### Default to verified docs, not memory.

When working with frameworks or UI libraries (e.g., Tailwind, Shadcn, Storybook, etc.) — **never rely on memory or training data**.

- **Always check official documentation** for the latest APIs and examples.
- **Use live sources** (e.g., Context7 API) to fetch up-to-date references when possible.
- **Trust verified sources**, even for tools you already know well.

### Think Critically and Verify

When asked _"Does it make sense?"_, _"What do you think?"_, or given a statement or plan — **never assume it's correct**.

- Always **analyze and validate** logic before agreeing.
- **Push back** on mistakes or weak reasoning.
- Give a **short, reasoned explanation** instead of simple approval.
- If uncertain, **state assumptions** and what extra info you need to confirm.

### Plan Before You Act

Before making meaningful changes, **propose and confirm a plan first**.

- Small safe edits (e.g., formatting, lint, typo) are fine directly.
- **Discuss first** for any major change — type fixes, refactors, new features, or behavior changes.
- Present **what you'll change and why** before acting.
- Once agreed, **follow the plan** and summarize results after.

### Pause on Unknowns — Hypothesize, Don't Act

When facing an unexpected error or ambiguous situation, **never act on guesses**.

- **Analyze first:** form hypotheses and note confidence levels.
- **Diagnostics only:** run safe, read-only checks (logs, dry-runs), no side effects.
- **Report back:** explain what happened, root cause, and possible solutions.
- **Get approval, then act:** execute the agreed fix and confirm results.

---

# Apollo v.4 Design System Architecture

## Project Overview

Apollo v.4 is an open-source design system for UiPath, built to provide a unified, accessible, and framework-agnostic component library for both internal and external consumers. This monorepo contains design tokens, utilities, and framework-specific implementations (React, Angular, Web Components).

### Goals

- **Open-source**: Public repository for internal and external adoption
- **Framework-optimized**: First-class React and Angular support with shared design tokens
- **Simplified architecture**: Clear separation between core tokens and framework implementations
- **Enhanced DX**: Easier contributions, predictable releases, comprehensive documentation
- **AI-assisted workflows**: Integration with AI tools for contribution guidance and development

### Repository

This is the **UiPath/apollo-ui** public repository - the open-source design system for UiPath's component library.

---

## Technology Stack

### Build & Tooling

- **Turborepo**: Monorepo management with caching and parallel task execution
- **TypeScript**: Type-safe development across all packages
- **ESLint**: Code quality and consistency
- **Changesets** or **Semantic-release**: Version management and release automation

### Framework Support

- **React**: Primary component library with Material UI theming
- **Angular**: Component library with Angular Material theming
- **Web Components**: Cross-framework components using standard web APIs
- **Tailwind CSS + shadcn/ui**: Modern styling approach (apollo-wind package)

### Testing & Documentation

- **Storybook 9**: Component documentation and visual testing
- **Playwright**: Visual regression testing
- **Unit tests**: Component behavior verification
- **GitHub Actions**: CI/CD automation

---

## Monorepo Structure

```
apollo-ui/
├── .github/
│   └── workflows/              # CI/CD pipelines
│       ├── ci.yml              # Lint, test, build
│       ├── visual-regression.yml
│       └── publish.yml         # NPM publishing
│
├── apps/                       # Development applications
│   ├── storybook/              # Storybook documentation
│   ├── react-playground/       # React testing environment
│   └── angular-playground/     # Angular testing environment
│
├── packages/                   # Core + framework packages
│   ├── apollo-core/            # Design tokens (fonts, colors, spacing, icons)
│   ├── apollo-utils/           # Framework-agnostic utilities
│   ├── apollo-react/           # React components + Material UI theme
│   ├── apollo-angular/         # Angular components + Angular Material theme
│   └── apollo-wind/            # Tailwind/shadcn implementation
│
├── web-packages/               # Cross-framework web components
│   ├── ap-autopilot-chat/      # Chat component (web component)
│   └── ap-data-grid/           # Data grid (web component + React wrapper)
│
├── turbo.json                  # Turborepo configuration
├── package.json                # Root package.json with workspaces
├── tsconfig.json               # Base TypeScript configuration
├── .eslintrc.js                # ESLint configuration
└── CLAUDE.md                   # This file - architecture documentation
```

---

## Package Architecture

### Core Packages (Framework-Agnostic)

#### `apollo-core`

- **Purpose**: Design system foundation - tokens, icons, fonts, CSS variables
- **Exports**:
  - Design tokens (colors, typography, spacing, shadows, etc.)
  - Icon library
  - Font assets
  - CSS custom properties
- **No dependencies on React/Angular**

#### `apollo-utils`

- **Purpose**: Shared utilities and helpers
- **Exports**:
  - Formatting utilities (dates, numbers, currency)
  - Accessibility helpers
  - Common helper functions
- **No dependencies on React/Angular**

### Framework Packages

#### `apollo-react`

- **Purpose**: React component library with Material UI theming
- **Dependencies**: React, Material UI, apollo-core, apollo-utils
- **Structure**:
  ```
  apollo-react/
  ├── src/
  │   ├── components/           # Ap* components (ApButton, ApTextField, etc.)
  │   ├── theme/                # Material UI theme overrides
  │   ├── core/                 # Re-export apollo-core
  │   └── index.ts              # Main exports
  ├── package.json
  └── tsconfig.json
  ```
- **Exports**:
  - `components`: All Ap\* React components
  - `core`: Re-exported apollo-core tokens
  - `theme`: Material UI theme overrides (apolloMaterialUiThemeDark, apolloMaterialUiThemeLight)

#### `apollo-angular`

- **Purpose**: Angular component library with Angular Material theming
- **Dependencies**: Angular, Angular Material, apollo-core, apollo-utils
- **Structure**:
  ```
  apollo-angular/
  ├── src/
  │   ├── lib/
  │   │   ├── components/       # Angular components
  │   │   └── theming/          # Angular Material theme overrides
  │   ├── public-api.ts         # Public exports
  │   └── index.ts
  ├── package.json
  └── tsconfig.json
  ```
- **Exports**:
  - Angular modules for all components
  - Angular Material theme overrides

#### `apollo-wind`

- **Purpose**: Tailwind CSS + shadcn/ui implementation for modern React apps
- **Dependencies**: React, Tailwind CSS, apollo-core
- **Structure**:
  ```
  apollo-wind/
  ├── src/
  │   ├── components/           # Tailwind-based components
  │   ├── lib/                  # shadcn/ui utilities
  │   └── index.ts
  ├── tailwind.config.js        # Tailwind configuration with Apollo tokens
  ├── package.json
  └── tsconfig.json
  ```

### Web Packages (Cross-Framework)

#### `ap-autopilot-chat`

- **Purpose**: Chat interface as a web component
- **Technology**: Web Components (Custom Elements)
- **Exports**: `<ap-autopilot-chat>` custom element

#### `ap-data-grid`

- **Purpose**: Data grid component
- **Technology**: Web component + React wrapper
- **Exports**:
  - `<ap-data-grid>` web component
  - React wrapper component

---

## Package Dependencies

```
apollo-core (tokens, icons, fonts)
    ↓
apollo-utils (utilities)
    ↓
├─→ apollo-react (React + MUI)
├─→ apollo-angular (Angular + Material)
├─→ apollo-wind (Tailwind + shadcn)
└─→ web-packages/* (Web Components)
```

---

## Component Standards

### Naming Conventions

- **React components**: `Ap` prefix (e.g., `ApButton`, `ApTextField`)
- **Angular components**: No specific selector naming convention enforced
- **Web components**: `ap-` prefix (e.g., `<ap-autopilot-chat>`, `<ap-data-grid>`)

### Component Structure

- **Primitives/Atoms**: Simple, composable building blocks (buttons, inputs, text)
- **Complex components**: Feature-rich components (data grids, chat interfaces)
- **Theme overrides**: Primary consumption pattern for existing Material UI/Angular Material apps

### Export Pattern

**React and Angular packages** (`apollo-react`, `apollo-angular`) export:

1. **Components**: All public components
2. **Core**: Design tokens (re-exported from apollo-core)
3. **Theme**: Theme customization objects (Material UI/Angular Material overrides)
4. **Utils**: Utility functions (re-exported from apollo-utils)

**Other packages** export only what's relevant to their purpose (e.g., web components export custom elements only).

### Usage Pattern

```typescript
// Import CSS variables
import '@uipath/apollo-react/core/theme.css';

// Import components
import { ApButton, ApTextField } from '@uipath/apollo-react/components';

// Import tokens
import { ColorOrange500, SpacingMd } from '@uipath/apollo-react/core';

// Import theme
import { apolloMaterialUiThemeDark } from '@uipath/apollo-react/theme';
```

---

## Design Token System

### Token Categories

- **Colors**: Semantic colors (primary, secondary, success, error, etc.)
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Consistent spacing scale (xs, sm, md, lg, xl, etc.)
- **Shadows**: Elevation system for depth
- **Borders**: Border radii and widths
- **Z-index**: Layering system
- **Icons**: SVG icon library

### Token Format

- **CSS Custom Properties**: `--color-primary-500`
- **TypeScript/JavaScript**: `ColorPrimary500`
- **SCSS Variables**: `$color-primary-500`

### Token Sources

- Figma as source of truth
- Automated sync via Figma plugin (e.g., Tokens Studio) or Figma API + GitHub Actions
- Plugins can automatically create PRs when design tokens are updated in Figma
- Generated token files stored in `apollo-core`
- Consumed by all framework packages

---

## Development Workflow

### Adding a New Component

1. Identify which package (apollo-react, apollo-angular, or web-packages)
2. Create component following naming conventions
3. Use design tokens from apollo-core
4. Write Storybook stories
5. Add unit tests
6. Add visual regression tests
7. Document usage and API

### Package Structure Requirements

Each package must include:

- `package.json` with proper exports and dependencies
- `tsconfig.json` extending root configuration
- `README.md` with usage instructions
- `src/` directory with source code
- `dist/` directory for build output (gitignored)

### File Naming

- Component files: PascalCase (e.g., `ApButton.tsx`)
- Utility files: camelCase (e.g., `formatDate.ts`)
- Test files: `*.test.ts` or `*.spec.ts`
- Story files: `*.stories.tsx`

---

## Build & Release

### Turborepo Tasks

- `build`: Build all packages
- `lint`: Lint all packages
- `test`: Run unit tests
- `test:visual`: Run visual regression tests
- `storybook:build`: Build Storybook documentation
- `dev`: Development mode with hot reload

### CI/CD Pipeline

#### Pre-merge Checks

1. Lint (ESLint + TypeScript type checking)
2. Unit tests
3. Build verification
4. Visual regression tests (Playwright)

#### Post-merge Actions

1. Package publishing to NPM (on version bump)
2. Storybook deployment
3. GitHub release creation

### Release Strategy

- **Changesets** (recommended): Manual changelog curation with automated versioning
- Or **Semantic-release**: Automatic versioning based on commit messages
- Versioned together or independently per package (TBD)

---

## Testing Strategy

### Unit Tests

- Test component behavior and logic
- Test utility functions
- Aim for >80% code coverage

### Visual Regression Tests

- Playwright-based screenshot comparison
- Test all component variants and states
- Run on PRs to catch visual regressions

### Storybook Stories

- Document all component variants
- Serve as visual test cases
- Interactive documentation for consumers

---

## Migration Path

### Phase 1: Setup & Consolidation

- Setup monorepo structure
- Migrate core tokens to apollo-core
- Establish React components (apollo-react)

### Phase 2: Build Out & Alignment

- Complete React component library
- Add Angular support (apollo-angular)
- Migrate web components to web-packages

### Phase 3: Rollout

- Internal adoption
- Documentation and examples
- Open-source release

---

## Configuration Files

### Root `package.json`

- Defines workspaces for all packages
- Shared devDependencies (TypeScript, ESLint, Turborepo)
- Root scripts for common tasks

### `turbo.json`

- Pipeline definitions for tasks
- Cache configuration
- Task dependencies

### `tsconfig.json`

- Base TypeScript configuration
- Extended by all packages
- Strict mode enabled

### `.eslintrc.js`

- Shared ESLint rules
- React/Angular specific overrides
- Accessibility rules enabled

---

## Integration Points

### Figma Integration

- **Figma as single source of truth** for design tokens
- **Automated synchronization options**:
  - Tokens Studio (Figma Tokens plugin) with GitHub sync
  - Figma API + GitHub Actions to create PRs on token changes
  - Style Dictionary for token transformation and multi-platform export
  - MCP integration (optional future enhancement)
- **Workflow**: Design token updates in Figma → Automated PR creation → Review and merge → Tokens available in `apollo-core`

### GitHub Actions

- Automated CI/CD
- PR checks and validations
- Release automation

---

## Contribution Guidelines

### Component Checklist

- [ ] Follows naming conventions (Ap\* prefix)
- [ ] Uses tokens from apollo-core
- [ ] Includes TypeScript types
- [ ] Has Storybook story
- [ ] Has unit tests
- [ ] Has visual regression tests
- [ ] Documented in package README
- [ ] Accessible (WCAG 2.1 AAA compliant)

### PR Requirements

- Descriptive title and description
- Tests pass
- No linting errors
- Visual regression tests pass
- Changeset added (if applicable)

---

## References

- Architecture Document: [Apollo v.4 Architecture](https://uipath.atlassian.net/wiki/spaces/CLD/pages/89705644276/Apollo+v.4+Architecture)
- Turborepo Docs: https://turbo.build/repo/docs
- Storybook Docs: https://storybook.js.org/
- Material UI: https://mui.com/
- Angular Material: https://material.angular.io/
