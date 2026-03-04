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

## Git Workflow

Follow conventional commits:
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

## Theme & Color Token Updates

**Important**: Color tokens and theme values should **only be updated in `registry.json`** within the `apollo-vertex-theme` configuration, **not in `app/globals.css`**.

The `app/globals.css` file is **automatically generated** from `registry.json` when you run:

```bash
bun run dev
```
or 
```bash
bun run build
```

## Key Dependencies

- `next@16` - React framework
- `tailwindcss@4` - CSS framework
- `@radix-ui/*` - Accessible UI primitives
- `class-variance-authority` - Variant styling
- `clsx` + `tailwind-merge` - Class utilities (via `cn()`)
- `lucide-react` - Icons
- `nextra` - Documentation framework
