# Apollo UI - Copilot Instructions

## Project Overview

Apollo v.4 is UiPath's open-source design system for building consistent user experiences across all UiPath products. It's a multi-framework component library (React, Angular, Web Components) with shared design tokens, built as a monorepo with Turborepo and pnpm.

**Target Audience**: Internal UiPath developers and external consumers using the design system.

**Key Features**: 1300+ icons, comprehensive design tokens, Material UI/Angular Material theming, TypeScript support, Storybook documentation.

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
- Angular 18+ with Angular Material (in development)
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
│   ├── apollo-utils/     # Shared utilities, formatters
│   ├── apollo-react/     # React components + Material UI theme
│   ├── apollo-angular/   # Angular components (WIP)
│   └── apollo-wind/      # Tailwind CSS + shadcn/ui
├── web-packages/         # Cross-framework web components (REQUIRE TESTS)
│   ├── ap-chat/          # Chat web component
│   └── ap-data-grid/     # Data grid (may be removed)
└── apps/                 # Development/demo apps (NO TESTS NEEDED)
    ├── storybook/        # Component documentation
    ├── react-playground/ # React demo app
    └── angular-playground/ # Angular demo app
```

**Package Dependencies:**
- All packages depend on `apollo-core` (design tokens)
- Framework packages depend on `apollo-utils`
- Web components depend on framework packages

## Coding Guidelines

### Naming Conventions

**React Components:**
- Prefix: `Ap*` (e.g., `ApButton`, `ApTextField`, `ApCard`)
- File naming: PascalCase (e.g., `ApButton.tsx`)

**Files:**
- Components: PascalCase (`ApButton.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Tests: `*.test.ts` or `*.spec.ts`
- Stories: `*.stories.tsx`

**TypeScript:**
- Strict mode enabled - use proper types, avoid `any`
- Prefer type inference where clear
- Use generics for reusable components
- Export types alongside implementations

### Component Patterns

- Use design tokens from `apollo-core` (never hardcode colors/spacing)
- Prefer composition over inheritance
- Keep components focused and single-purpose
- Follow existing patterns in the codebase
- Material UI components wrapped with `Ap*` prefix

### Testing Requirements

**Required (Library Code):**
- All code in `packages/` and `web-packages/`
- Unit tests for utilities and hooks
- Component tests for critical UI behavior
- Visual regression tests for components

**NOT Required (Demo Code):**
- Code in `apps/` folder (Storybook, playgrounds)
- Showcase/demo applications

### Documentation

- JSDoc comments for public APIs
- Storybook stories for all components
- README.md in each package with usage examples

## Build-Time vs Runtime Security Model

**This is critical for security reviews:**

### Build-Time Scripts (`packages/*/scripts/*.ts`)
✅ **Safe/Acceptable:**
- Run in trusted CI/CD environment with repository files
- Process trusted sources (Figma exports, repository structure)
- Path operations on repository files
- Processing files from `src/icons/svg/` (trusted design team exports)
- String operations on folder names from repository structure
- Missing input validation for build-time configuration
- Recursive directory traversal with depth limits
- File system operations in `scripts/` folders

### Runtime Code (Components, Hooks, Utilities)
⚠️ **Requires Strict Security:**
- Runs in user applications
- Validate all user inputs
- Sanitize data before rendering
- Prevent XSS, prototype pollution, injection attacks
- Missing input validation on user-facing APIs is a security issue

### Context-Specific Patterns
- `new Function()` in library config: OK (developer-defined, not user input)
- SVG processing in build scripts: OK (trusted Figma source)
- `innerHTML` in dev.ts: OK (dev-only file with static markup)
- Regex patterns for internal file matching: OK (build-time only)

## What to Flag as Security Issues

**Flag these ONLY in runtime code:**
- Secrets/credentials in code or configs
- XSS vulnerabilities in React components
- Prototype pollution in runtime utilities
- Missing input validation on user-facing APIs
- Unsafe dependencies with known CVEs
- Template injection in user-controlled content

**DO NOT flag in build scripts:**
- Theoretical security issues in trusted build-time contexts
- Path operations on repository files
- File processing from known trusted sources

## Code Review Approach

When providing suggestions or reviewing code:

1. **Summary**: Brief overview of what's being done
2. **Code Quality**: Critical issues with structure, patterns, or best practices
3. **Security**: Real security concerns (distinguish build-time vs runtime)
4. **Type Safety**: TypeScript errors or type issues
5. **Testing**: Missing tests for library code (NOT required for apps/)
6. **Performance**: Significant performance implications

**Focus on blocking issues** - things that prevent safe merging:
- Breaking changes to public APIs
- Security vulnerabilities in runtime code
- TypeScript errors
- Missing tests for critical library functionality
- Incorrect use of design tokens

**Don't block on:**
- Minor style/formatting (Biome handles this)
- Theoretical security in build scripts
- Missing tests in playground apps
- Minor optimizations

**Be pragmatic:**
- Approve when functionally correct and secure
- Build-time scripts != runtime code
- Test library code, not demos
- Trust the tools (Biome, TypeScript)

## Component Checklist

When creating new components, verify:
- [ ] Follows naming conventions (`Ap*` prefix for React)
- [ ] Uses tokens from `apollo-core`
- [ ] Includes TypeScript types
- [ ] Has Storybook story
- [ ] Has unit tests (if in packages/ or web-packages/)
- [ ] Has visual regression tests
- [ ] Documented in package README

## Available Resources

**Scripts (from root):**
- `pnpm build` - Build all packages
- `pnpm dev` - Run all packages in dev mode
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
- `pnpm storybook` - Run Storybook
- `pnpm format` - Format with Biome

**Package-specific:**
- `pnpm build:packages` - Build only packages/
- `pnpm dev:react-playground` - Run React playground
- `pnpm test:visual` - Visual regression tests

**Release:**
- `pnpm release` - Release packages (semantic-release)

## Key Principles

1. **Context matters**: Build-time scripts != runtime code
2. **Pragmatic over perfect**: Functional and secure > style nitpicks
3. **Test what matters**: Library code needs tests, demos don't
4. **Trust the tools**: Biome handles formatting, TypeScript handles types
5. **Design tokens first**: Use apollo-core tokens, never hardcode
