# AGENTS.md - apollo-wind

This file provides guidance for AI coding agents working in the `@uipath/apollo-wind` package: Tailwind
CSS 4 and shadcn/ui components built on `apollo-core` tokens.

## Where things live

- `src/components/ui/`: shadcn/ui based components
- `src/components/forms/`: form components
- `src/components/custom/`: product compositions such as headers, panels and canvas layouts
- `src/styles/`: Tailwind entry CSS (`tailwind.css`) and the consumer theme variables (`tailwind.consumer.css`)
- `apollo-ai-context.md`: token and styling rules for generated UI. Follow it when choosing colors,
  radius, spacing or typography
- `docs/`: usage, accessibility, localization and AI consumer guides

## Commands

```bash
pnpm build                    # rslib build and dist/styles.css
pnpm test                     # vitest
pnpm lint                     # Biome lint
pnpm format                   # Biome format
pnpm storybook                # Storybook on port 6006
```

## Rules

### Storybook copy

Never use ` — ` (em dash with spaces) in `.stories.tsx` copy. See `apps/storybook/AGENTS.md` for the
replacements to use.
