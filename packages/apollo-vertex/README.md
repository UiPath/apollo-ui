# @uipath/apollo-vertex

Source for every Apollo Vertex component. The same files are distributed two ways:

- As a compiled npm package, built into `dist/` by `pnpm build`.
- As a [shadcn](https://ui.shadcn.com/) registry, which the
  [`apps/apollo-vertex`](../../apps/apollo-vertex) docs app builds from the files here.

## Usage

The package is ESM only. React 19.2+ and Tailwind CSS 4 are required. Import the stylesheet once from your app's CSS, then import
components from the package root:

```css
@import "@uipath/apollo-vertex/tailwind.css";
@source "./"; /* your own sources */
```

```tsx
import { Button, DataTable } from "@uipath/apollo-vertex";
```

`tailwind.css` includes Tailwind, the Vertex theme and a `@source` for the package's built files. Use
`@uipath/apollo-vertex/theme.css` instead if you only want the theme variables.

Everything, including the app shell, charts, feature flags, Solution Tests and AI chat, is exported
from the package root. Translation JSON files are available at `@uipath/apollo-vertex/locales/*`.

npm 7+ and pnpm install the packages in `peerDependencies` automatically. Use the `@tanstack/react-db`
release that depends on the same `@tanstack/db` version as your `@tanstack/query-db-collection`; each
release pins an exact `@tanstack/db`, and collections from two copies do not work together.

The Proteus feature flag adapter, `createProteusProvider`, is exported from
`@uipath/apollo-vertex/proteus` instead of the root. It needs `@uipath/proteus-client`, which is not on
the public npm registry, so it is declared only in `peerDependenciesMeta` (as optional). Install it
yourself if you import that subpath.

## Layout

```text
packages/apollo-vertex/
├── entries/           # Public API barrel (index.ts)
├── registry/          # Component sources, one directory per registry item
├── registry.json      # shadcn registry manifest (items, files, theme tokens)
├── lib/               # Helpers shipped with registry items (cn, asserts, i18n, auth)
├── locales/           # Translation files (edit en.json only)
├── styles/            # Consumer stylesheets copied to dist/ (theme.css is generated)
└── types/             # Ambient declarations shipped with registry items
```

Registry files import each other through shadcn aliases (`@/components/ui/*`, `@/lib/*`, `@/hooks/*`).
`tsconfig.json` maps those aliases to files in this package, and the shadcn CLI rewrites them to the
consumer's aliases on install.

## Scripts

```bash
pnpm build         # Generate theme.css, build dist/ with rslib, check every export resolves
pnpm build:check   # List the external packages each public entry reaches
pnpm lint          # oxlint (type-aware)
pnpm lint:deps     # Check that registry files only import from registry/ and lib/
pnpm -w knip       # Find unused files, exports and dependencies (both workspaces)
pnpm typecheck     # tsc --noEmit
pnpm format        # Biome
```

## Adding a Component

1. Create the component in `registry/<component>/<component>.tsx`.
2. Add a `@/components/ui/<component>` alias to `tsconfig.json` if other components import it.
3. Add the item to `registry.json`.
4. Export it from `entries/index.ts`.
5. Document it in `apps/apollo-vertex/content/docs/components/<component>.mdx`.
6. Run `pnpm build` and `pnpm --filter apollo-vertex registry:build` to check both outputs.
