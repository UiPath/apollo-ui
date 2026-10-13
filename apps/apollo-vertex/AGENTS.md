# AGENTS.md - Apollo Vertex docs

This file provides guidance for AI coding agents working in the `apollo-vertex` docs app.

## Project Overview

This app is the Fumadocs documentation site for Apollo Vertex. It does not own any components: their
sources live in the `@uipath/apollo-vertex` package (`packages/apollo-vertex`). Read
`packages/apollo-vertex/AGENTS.md` before changing a component.

The app consumes the package in two ways:
- **Live examples**: `tsconfig.json` extends `packages/apollo-vertex/tsconfig.json`, so `@/registry/*`,
  `@/components/ui/*` and the shared `@/lib/*` helpers resolve to the package sources.
- **shadcn registry**: `pnpm registry:build` compiles `packages/apollo-vertex/registry.json` into
  `public/r/*.json`, which consumers install with the shadcn CLI.

Because `@/` is the package's namespace, files that belong to this app (`app/`, `content/`, `templates/`,
`lib/`) import each other with relative paths.

## Commands

```bash
pnpm dev                      # Generate theme CSS and start the dev server (Turbopack)
pnpm build                    # Theme CSS, registry build and Next.js build
pnpm registry:build           # Build the shadcn registry only
pnpm generate:theme           # Regenerate app/theme.generated.css from the package registry.json
pnpm lint                     # oxlint (extends the package config)
pnpm format                   # Format with Biome
pnpm typecheck                # TypeScript type checking
```

## Structure

```
apps/apollo-vertex/
├── app/                    # Next.js app router: layout, docs catch-all route, search index, API proxies
├── content/docs/           # MDX docs pages; meta.json files set sidebar order and titles
├── templates/              # Example compositions used on docs pages
├── lib/                    # Docs-only helpers (content source, API proxy, foundation tokens, theme schema)
├── scripts/                # Theme CSS and registry index generation
└── public/r/               # Generated registry JSON (do not edit)
```

## Documenting a New Component

1. Add the component and its `registry.json` entry in `packages/apollo-vertex` (see its AGENTS.md).
2. Create a documentation page in `content/docs/components/<component>.mdx` with a `title` and a
   one-line `description` in its frontmatter. The page renders both, so don't repeat them as an
   H1 and intro paragraph. Add the page to `content/docs/components/meta.json` to place it in the sidebar.
3. Run `pnpm build` to confirm the docs and registry build.
