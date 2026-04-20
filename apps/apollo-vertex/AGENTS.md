# AGENTS.md - Apollo Vertex

This file provides guidance for AI coding agents working in the `apollo-vertex` app.

## Project Overview

Apollo Vertex is a Next.js 16 documentation site and component registry for the Apollo Design System. It uses:
- **Next.js 16** with Turbopack for development
- **Tailwind CSS 4** for styling
- **Radix UI** primitives for accessible components
- **shadcn/ui** patterns with `class-variance-authority`
- **Nextra** for documentation

## Build/Lint/Test Commands

### Development
```bash
# Start dev server with Turbopack
pnpm dev

# From monorepo root
pnpm dev:apollo-vertex
```

### Build
```bash
pnpm build                    # Build the app (includes registry:build)
pnpm registry:build           # Build shadcn registry only
```

### Linting & Formatting
```bash
pnpm lint                     # Check with Biome
pnpm format                   # Format with Biome
pnpm format:check             # Check formatting without writing
pnpm lint:deps                # Check dependency constraints
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

Note: apollo-vertex currently has no test files. Tests are in `packages/apollo-wind` and `packages/apollo-react`.

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

### Tailwind CSS
- Use Tailwind utility classes directly in JSX
- Use `cn()` to merge conditional classes
- Prefer semantic color tokens (`bg-primary`, `text-muted-foreground`)
- Use CSS variables for theming: `var(--color-*)`

### Error Handling
- Use TypeScript's strict null checks
- Handle loading and error states explicitly in UI
- Use Zod for runtime validation when needed

## File Structure

```
apollo-vertex/
├── app/                    # Next.js app router pages
│   ├── layout.tsx          # Root layout
│   └── [routes]/           # Documentation pages (MDX)
├── registry/               # UI component registry
│   ├── button/
│   │   └── button.tsx
│   └── [component]/
│       └── [component].tsx
├── lib/
│   └── utils.ts            # Utility functions (cn, etc.)
├── templates/              # Page templates
└── public/                 # Static assets
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

### Stacked PRs Are Required

Apollo Vertex uses **stacked PRs** for any PR that targets this app. Standardize on
**`ghstack`** for creating and updating those PRs.

- Do **not** open Apollo Vertex PRs with a plain branch workflow (`git push` + `gh pr create`).
- Do **not** use Graphite, `gh stack`, `spr`, Git Town, or manual base-branch rewiring here unless
  the user explicitly asks for it.
- Treat **each commit as one PR layer**. A stack should be a sequence of small, reviewable,
  logically complete commits.
- If the work is truly one indivisible change, a **single-commit stack** is acceptable. Do not
  invent artificial PR layers just to satisfy the rule.
- If `ghstack` is missing or not configured, **stop and tell the user** instead of silently falling
  back to a non-stacked workflow.

### ghstack Setup

`ghstack` requires:
- `gh` authenticated for GitHub access
- Python 3.9.1+
- a configured `~/.ghstackrc`

Install it with:

```bash
uv tool install ghstack
```

Set it up using the upstream instructions from
[`ezyang/ghstack`](https://github.com/ezyang/ghstack#how-to-setup):

- Read and follow the upstream setup steps at the GitHub link above.
- Do not recreate the setup from memory or invent a repo-specific variant unless the user asks.

If `ghstack` is not installed or `~/.ghstackrc` is missing, stop and tell the user.

### ghstack Usage

Follow the upstream usage guide from
[`ezyang/ghstack`](https://github.com/ezyang/ghstack#how-to-use), with Apollo Vertex's trunk branch
being `main` rather than `master`:

- Make sure you have write permission to the repository where the PRs will be created.
- Prepare a series of focused commits on top of `main`.
- Run `ghstack` to push the stack and create or update one PR per commit.
- To stack another PR on top of an existing one, check out the latest commit from that stack, add a
  new commit on top, then run `ghstack` again.
- To modify an existing PR layer, edit the corresponding commit directly:
  use `git commit --amend` if it is the top commit, otherwise use `git rebase -i`.
- To rebase, use `git rebase origin/main`. Do not merge `main` into your stack.
- To land a ghstack-created PR, use `ghstack land <pr-url-or-number>` rather than the normal GitHub
  merge UI.

`ghstack` manages the entire stack together. Do not try to update only one layer via ad hoc branch
pushes or manual PR base changes.

### Rebasing & Commit History

Always **rebase over main** instead of creating merge commits. This keeps commit history linear and clean. When updating your PR:

```bash
git fetch origin main
git rebase -i origin/main
# Resolve any conflicts, then continue
ghstack
```

### Fixing Previous Changes in a PR

If a previous commit in your stack already contains the change you're making, **do not add a new
"fix" commit**. Update the existing PR layer with fixup commits and autosquash:

```bash
# Make your changes
git add .
git commit --fixup <original-commit-sha>

# Rebase and auto-squash
git rebase -i origin/main --autosquash
ghstack
```

This keeps the stack clean with meaningful, non-duplicate commits.

### Creating And Updating A Stack

For Apollo Vertex work, structure the change as a stack from the start:

```bash
# Create focused commits from bottom layer to top layer
git commit -m "refactor(apollo-vertex): ..."
git commit -m "feat(apollo-vertex): ..."
git commit -m "docs(apollo-vertex): ..."

# Create or update the stacked PRs on GitHub
ghstack
```

When review feedback lands on an older layer, amend or fix up that specific commit, rebase the
stack, then run `ghstack` again. Do not add a "follow-up" commit on top unless it is intentionally
a new PR layer.

### Finalizing Changes

After implementing components or making changes, **always run the build, linting, and formatting**:

```bash
pnpm build
pnpm lint
pnpm format
```

If build errors are found:
1. Review the error output from `pnpm build`
2. Fix any type errors, missing imports, or other build issues
3. Re-run `pnpm build` to confirm the errors are resolved

If linting or formatting issues are found:
1. Review the issues reported by `pnpm lint`
2. Fix any issues manually if needed
3. Run `pnpm format` to auto-format the code

Commit any build, formatting, or lint fixes before pushing. This ensures all code compiles correctly, follows the project's style guidelines, and catches any issues before submitting the PR.

## Theme & Color Token Updates

**Important**: Color tokens and theme values should **only be updated in `registry.json`** within the `apollo-vertex-theme` configuration, **not in `app/globals.css`**.

The `app/globals.css` file is **automatically generated** from `registry.json` when you run:

```bash
pnpm dev
```
or 
```bash
pnpm build
```

## Key Dependencies

- `next@16` - React framework
- `tailwindcss@4` - CSS framework
- `@radix-ui/*` - Accessible UI primitives
- `class-variance-authority` - Variant styling
- `clsx` + `tailwind-merge` - Class utilities (via `cn()`)
- `lucide-react` - Icons
- `nextra` - Documentation framework
