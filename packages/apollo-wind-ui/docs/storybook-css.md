# Storybook CSS Utilities

The prebuilt `@uipath/apollo-wind-ui/storybook.css` bundle is only meant for Storybook and other docs surfaces. Real consumer apps should keep using Tailwind in “JIT” mode so new classes are generated automatically.

Because Tailwind v4 no longer ships every utility by default, we maintain a **hard-coded allowlist** of the shadcn-specific classes our components require. That list lives in `src/styles/shadcn-utilities.css`, which maps each class to the correct Apollo token (e.g. `.bg-primary` → `var(--color-primary)`, `.ring-ring` → `--tw-ring-color`, etc.).

When you add or update a component:

1. Check its `cva` strings for any class that references shadcn tokens (`bg-primary`, `text-muted-foreground`, `ring-offset-background`, etc.).
2. If the class is already present in `shadcn-utilities.css`, you’re done.
3. Otherwise, append a new rule to `shadcn-utilities.css` and keep the declaration in sync with the expected Tailwind behavior (background color, text color, ring variables, pseudo selectors, etc.).
4. Re-run `pnpm --filter @uipath/apollo-wind-ui build` so `dist/storybook.css` picks up the change.

This document is only about the Storybook/doc bundle. Real apps should not import `storybook.css`; they should rely on Tailwind to generate classes from their own content.\*\*\*
