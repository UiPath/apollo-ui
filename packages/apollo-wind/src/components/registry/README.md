# Apollo Wind UI Registry

This directory contains the shadcn/ui registry configuration for Apollo Wind components.

## Usage

Install components using the shadcn CLI:

```bash
npx shadcn@latest add button --registry https://uipath.github.io/apollo-wind/registry.json
```

## Registry Structure

- `registry.json` - Main registry manifest
- `r/*.json` - Individual component registry items
- `schema.ts` - TypeScript types for registry format
- `scripts/generate-registry.ts` - Auto-generation script

## Auto-generation

Registry files are auto-generated from component source:

```bash
pnpm generate:registry
```

This ensures the npm package and registry stay in sync.

## Deployment

Registry is deployed to GitHub Pages via CI/CD on every push to main that modifies:

- `packages/apollo-wind-ui/registry/**`
- `packages/apollo-wind-ui/src/components/ui/**`

## Registry URL

```
https://uipath.github.io/apollo-wind/registry.json
```

## Available Components

- button
- card
- input
- label
- select

More components coming soon!
