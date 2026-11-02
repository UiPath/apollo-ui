# AGENTS.md - apollo-react

This file provides guidance for AI coding agents working in the `@uipath/apollo-react` package.

## Project Overview

| Path | Entry | What |
|---|---|---|
| `src/material/` | `./material` | Legacy `Ap*` components and Material UI theme overrides. Maintenance only |
| `src/canvas/` | `./canvas` | Canvas components built on xyflow. See `src/canvas/README.md` |
| `src/chat/` | `./chat` | Chat service and renderers. See `src/chat/README.md` |
| `src/core/` | `./core` | Re-exports `apollo-core` tokens, fonts and icons |
| `src/i18n/` | `./i18n` | Lingui provider and helpers |

## Commands

```bash
pnpm build                    # Icons, i18n compile, rslib build and canvas/chat CSS
pnpm test                     # Compile i18n and run vitest
pnpm lint                     # Biome lint
pnpm format                   # Biome format
pnpm i18n:extract             # Extract Lingui messages
```

## Rules

### Styling Standards

**No new `styled-components` (Emotion) or direct MUI component usage in `apollo-react`.**

The package is actively migrating from Emotion (`@emotion/styled`, `@emotion/react`) and raw MUI components to **Tailwind CSS classes via `apollo-wind`**. All new code must follow the new patterns:

- **Do not** import from `@emotion/styled`, `@emotion/react`, or use `styled.*` / `css` helpers
- **Do not** create new `*.styles.ts` files
- **Do not** introduce new MUI component imports (`@mui/material/*`) for building UI — existing MUI theme overrides in `theme/` are exempt
- **Do not** use `Ap*` components from `@uipath/apollo-react` (these are MUI wrappers) — use `apollo-wind` components instead
- **Do** use Tailwind utility classes (static literal strings in JSX)
- **Do** use `cn()` from `@uipath/apollo-wind` only when classes conflict/override
- **Do** use CSS custom properties for dynamic dimensions (Pattern B from migration guide)

When **significantly editing** an existing component that uses styled/MUI patterns, migrate that component to Tailwind as part of the change. Use the `/migrate-canvas-styled-to-tailwind` skill for guidance.

For the full migration patterns and reference examples, see `.claude/skills/migrate-canvas-styled-to-tailwind/SKILL.md`.

### Storybook copy

Never use ` — ` (em dash with spaces) in `.stories.tsx` copy. See `apps/storybook/AGENTS.md` for the
replacements to use.
