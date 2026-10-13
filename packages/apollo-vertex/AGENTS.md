# AGENTS.md - Apollo Vertex

This file provides guidance for AI coding agents working in the `@uipath/apollo-vertex` package (`packages/apollo-vertex`).

## Project Overview

This package holds the source of every Apollo Vertex component. The same sources are shipped two ways:
- `pnpm build` compiles them into `dist/` as the `@uipath/apollo-vertex` npm package. The public API is
  the barrel files in `entries/`, one per `package.json` export.
- The `apps/apollo-vertex` docs app imports these files for its live examples and builds them into a
  shadcn registry (`public/r/*.json`).

It uses:
- **Tailwind CSS 4** for styling
- **Radix UI** primitives for accessible components
- **shadcn/ui** patterns with `class-variance-authority`

## Build/Lint/Test Commands

### In this package
```bash
pnpm build                    # Generate theme.css, build dist/ with rslib, check every export resolves
pnpm build:check              # List the external packages each public entry reaches
pnpm lint                     # Lint with oxlint (type-aware)
pnpm format                   # Format with Biome
pnpm format:check             # Check formatting without writing
pnpm lint:deps                # Check registry import boundaries
pnpm typecheck                # TypeScript type checking
```

### Docs app and registry build (`apps/apollo-vertex`)
```bash
pnpm dev:apollo-vertex                       # From monorepo root: docs site with live components
pnpm --filter apollo-vertex registry:build   # Build the shadcn registry from this package
pnpm --filter apollo-vertex build            # Full docs build (includes registry:build)
```

### From Monorepo Root
```bash
pnpm lint                     # Lint all packages
pnpm lint:fix                 # Fix lint issues
pnpm format                   # Format all packages
pnpm typecheck                # TypeScript type checking
pnpm test                     # Run all tests
```

### Running a Single Test (in packages with tests)
```bash
# Run a specific test file
pnpm --filter @uipath/apollo-wind test -- button.test.tsx

# Run tests matching a pattern
pnpm --filter @uipath/apollo-react test -- --grep "ApButton"

# Watch mode for a specific test
pnpm --filter @uipath/apollo-wind test:watch -- button.test.tsx
```

Note: @uipath/apollo-vertex currently has no test files. Tests are in `packages/apollo-wind` and `packages/apollo-react`.

## Code Style Guidelines

### Formatting (Biome)
- **Indent**: 2 spaces
- **Quotes**: Single quotes for JS/TS
- **Semicolons**: Always
- **Trailing commas**: ES5 style
- **Line width**: 100 characters
- **Arrow parens**: Always use parentheses

### Imports
- Biome auto-organizes imports on format
- Group order: external packages, then internal (`@/*`)
- Use path alias `@/*` for internal imports (e.g., `@/lib/utils`, `@/components/ui/button`)

```typescript
// External imports first
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

// Internal imports after
import { cn } from "@/lib/utils";
```

### TypeScript
- **Strict mode** enabled
- Use `type` imports when importing only types: `import type { Foo } from "bar"`
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use `React.ComponentProps<"element">` for extending HTML element props
- Avoid `any` - use `unknown` and narrow types

### Component Patterns
- Use function declarations (not arrow functions) for components
- Use `class-variance-authority` (cva) for variant-based styling
- Use `cn()` utility for merging Tailwind classes
- Add `data-slot` attributes for styling hooks
- Export both component and variants
- **Define component props as a `ComponentProps` interface** (named `[ComponentName]Props`)

#### Props Interface Pattern

Always define component props in an explicit `interface [ComponentName]Props`:

```typescript
interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
```

**Benefits of using `ComponentProps` interface:**
- Type clarity: Props are explicitly defined and easy to discover
- Reusability: Consumers can import and extend `ButtonProps` in their own components
- Maintainability: Props changes are centralized in one place
- Documentation: Interface name clearly indicates what props the component accepts

### Naming Conventions
- **Files**: kebab-case (`button-group.tsx`, `use-mobile.ts`)
- **Components**: PascalCase (`Button`, `ButtonGroup`)
- **Hooks**: camelCase with `use` prefix (`useMobile`, `useLocalStorage`)
- **Utilities**: camelCase (`cn`, `formatDate`)
- **CSS variables**: kebab-case (`--color-primary`, `--spacing-md`)

### Hooks

Before implementing a custom hook, check whether a well-maintained, widely-used
package already provides it. Prefer adopting a battle-tested implementation
over writing one from scratch — it saves maintenance, edge-case handling, and
test surface. Only implement a hook locally when no suitable package exists,
the package is unmaintained, or the dependency cost outweighs the benefit.

### Tailwind CSS
- Use Tailwind utility classes directly in JSX
- Use `cn()` to merge conditional classes
- Prefer semantic color tokens (`bg-primary`, `text-muted-foreground`)
- Use CSS variables for theming: `var(--color-*)`

### Translation Keys

User-facing strings are looked up via `useVertexTranslation()` from `@/lib/vertex-translation` against flat keys in `locales/*.json` (one file per locale). It reads from the `apollo-vertex` namespace, so vertex strings stay separate from the consuming app's own keys. Don't call `useTranslation` from `react-i18next` directly (oxlint enforces this), and don't export the hook: it's internal to vertex. Use a translation key whenever a string is rendered to the user — labels, placeholders, button text, aria labels, etc.

**Only edit `locales/en.json`.** Add new keys there in alphabetical order. Do not touch the other locale files — the localization team syncs translations into them as a separate workflow. PRs that modify non-English locales will be sent back.

### Error Handling
- Use TypeScript's strict null checks
- Handle loading and error states explicitly in UI
- Use Zod for runtime validation when needed

## File Structure

```
packages/apollo-vertex/
├── registry/               # Component sources, one directory per registry item
│   ├── button/
│   │   └── button.tsx
│   └── [component]/
│       └── [component].tsx
├── registry.json           # shadcn registry manifest (items, files, theme tokens)
├── lib/                    # Shared helpers shipped with registry items (cn, asserts, i18n, auth)
├── locales/                # Translation files (edit en.json only)
└── types/                  # Ambient declarations shipped with registry items
```

## Registry Components

Components in `registry/` follow shadcn/ui patterns:
- Each component in its own directory
- Uses Radix UI primitives for accessibility
- Styled with Tailwind CSS + cva variants
- Path aliases configured in tsconfig.json

Avoid near-duplicate components:
- Prefer composition, variants, and shared primitives over copying similar components.
- When differences are small, expose a variant, prop, or slot instead of creating a new component.
- Extract common logic and styling into a base component or utility so multiple variants can reuse it.
- Duplicate components make maintenance and accessibility fixes harder—reuse where possible.

### Multi-file component gotchas

shadcn has a known bug ([shadcn-ui/ui#7309](https://github.com/shadcn-ui/ui/issues/7309)) where barrel imports are rewritten to point at the main file instead of `index.ts`. For example, `@/components/ui/data-table` gets rewritten to `@/components/ui/data-table/data-table`, bypassing the barrel entirely.

When working with multi-file registry components:
- **Add `target` fields** to every file entry in `registry.json` to preserve subdirectory structure during installation.
- **Re-export from the main file** anything that other registry components import via the barrel. The CI registry check (`tsc --noEmit`) will catch missed re-exports.
- If a consumer registry component needs a symbol from a multi-file component, the safest import is from the specific subfile (e.g., `@/components/ui/data-table/data-table-column-header`), but be aware that shadcn may still rewrite this path.

## Git Workflow

Follow conventional commits. Commit body lines must not be longer than 100 characters.
```
type(scope): description

# Examples:
feat(apollo-vertex): add new Button variant
fix(apollo-vertex): resolve dark mode toggle issue
docs(apollo-vertex): update component documentation
```

Valid scopes: `apollo-vertex`, `apollo-react`, `apollo-wind`, `apollo-core`, `repo`

### Rebasing & Commit History

Always **rebase over main** instead of creating merge commits. This keeps commit history linear and clean. When updating your PR:

```bash
git fetch origin main
git rebase -i origin/main
# Resolve any conflicts, then continue
git push --force-with-lease
```

### Fixing Previous Changes in a PR

If a previous commit in your PR already contains the change you're making, **do not add a new commit**. Instead, use fixup commits and rebase to squash them together:

```bash
# Make your changes
git add .
git commit --fixup <original-commit-sha>

# Rebase and auto-squash
git rebase -i origin/main --autosquash
git push --force-with-lease
```

This keeps the PR history clean with meaningful, non-duplicate commits.

### Finalizing Changes

After implementing components or making changes, **always run the build, linting, and formatting**:

```bash
pnpm typecheck
pnpm lint
pnpm format
pnpm --filter @uipath/apollo-vertex build   # verifies the npm package build
pnpm --filter apollo-vertex build           # verifies the docs app and registry build
```

If build errors are found:
1. Review the error output from the build
2. Fix any type errors, missing imports, or other build issues
3. Re-run the build to confirm the errors are resolved

If linting or formatting issues are found:
1. Review the issues reported by `pnpm lint`
2. Fix any issues manually if needed
3. Run `pnpm format` to auto-format the code

Commit any build, formatting, or lint fixes before pushing. This ensures all code compiles correctly, follows the project's style guidelines, and catches any issues before submitting the PR.

## Theme & Color Token Updates

**Important**: Color tokens and theme values should **only be updated in `registry.json`** within the `apollo-vertex-theme` configuration, **not in `apps/apollo-vertex/app/globals.css`**.

The docs app generates `apps/apollo-vertex/app/theme.generated.css` from this package's `registry.json` whenever you run `pnpm dev` or `pnpm build` in `apps/apollo-vertex`.

## Key Dependencies

- `tailwindcss@4` - CSS framework
- `@radix-ui/*` - Accessible UI primitives
- `class-variance-authority` - Variant styling
- `clsx` + `tailwind-merge` - Class utilities (via `cn()`)
- `lucide-react` - Icons
