# @uipath/apollo-vertex

Source for every Apollo Vertex component. This package is private and is not published to npm.
Components are distributed as a [shadcn](https://ui.shadcn.com/) registry, which the
[`apps/apollo-vertex`](../../apps/apollo-vertex) docs app builds from the files here.

## Layout

```text
packages/apollo-vertex/
├── registry/          # Component sources, one directory per registry item
├── registry.json      # shadcn registry manifest (items, files, theme tokens)
├── lib/               # Helpers shipped with registry items (cn, asserts, i18n, auth)
├── locales/           # Translation files (edit en.json only)
└── types/             # Ambient declarations shipped with registry items
```

Registry files import each other through shadcn aliases (`@/components/ui/*`, `@/lib/*`, `@/hooks/*`).
`tsconfig.json` maps those aliases to files in this package, and the shadcn CLI rewrites them to the
consumer's aliases on install.

## Scripts

```bash
pnpm lint          # oxlint (type-aware)
pnpm lint:deps     # Check that registry files only import from registry/ and lib/
pnpm typecheck     # tsc --noEmit
pnpm format        # Biome
```

## Adding a Component

1. Create the component in `registry/<component>/<component>.tsx`.
2. Add a `@/components/ui/<component>` alias to `tsconfig.json` if other components import it.
3. Add the item to `registry.json`.
4. Document it in `apps/apollo-vertex/content/docs/components/<component>.mdx`.
5. Run `pnpm --filter apollo-vertex registry:build` to check the registry output.
