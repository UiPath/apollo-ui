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

Features that need extra packages live on subpaths. Install the optional peer dependencies for the
subpaths you use:

| Subpath | Contents | Extra packages |
| --- | --- | --- |
| `.` | Primitives, forms, data table, sidebar | None |
| `./charts` | Charts, chart models, Data Fabric and Insights adapters | `recharts`, `@tanstack/react-query`, `@ts-rest/core`, `react-error-boundary` |
| `./shell` | App shell, auth, locale and theme providers | `@tanstack/react-query`, `@tanstack/react-router`, `jwt-decode`, `pkce-challenge` |
| `./shell/entities` | Group membership and entity table hooks | `./shell` packages, `@uipath/vs-core`, `@tanstack/react-db` |
| `./feature-flags` | Feature flag provider, guard and hooks | None |
| `./feature-flags/proteus` | Proteus feature flag adapter | `@uipath/proteus-client` |
| `./solution-tests` | Presentational Solution Tests views | `@tanstack/react-router`, `recharts` |
| `./solution-tests/data` | Solution Tests containers and hooks | `./solution-tests` packages, `@uipath/vs-core`, `@tanstack/react-db`, `@tanstack/react-query`, `@uipath/uipath-typescript` |
| `./ai-chat` | AI chat and data fabric chat tools | `@tanstack/ai`, `@tanstack/ai-client`, `@tanstack/react-query`, `@uipath/uipath-typescript`, `eventsource-parser`, `highlight.js`, `react-markdown`, `remark-breaks`, `remark-gfm`, `recharts`, `react-error-boundary`, `@ts-rest/core` |
| `./locales/*` | Translation JSON files | None |

`@uipath/vs-core`, `@uipath/proteus-client` and `@tanstack/react-db` are declared only in
`peerDependenciesMeta` (as optional) and not in `peerDependencies`, because they are not on the public
npm registry and pnpm would try to install them in this workspace. The host app provides them.

## Layout

```text
packages/apollo-vertex/
├── entries/           # Public API barrels, one per package.json export
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
pnpm typecheck     # tsc --noEmit
pnpm format        # Biome
```

## Adding a Component

1. Create the component in `registry/<component>/<component>.tsx`.
2. Add a `@/components/ui/<component>` alias to `tsconfig.json` if other components import it.
3. Add the item to `registry.json`.
4. Export it from the matching barrel in `entries/` (the root `entries/index.ts` for primitives).
5. Document it in `apps/apollo-vertex/content/docs/components/<component>.mdx`.
6. Run `pnpm build` and `pnpm --filter apollo-vertex registry:build` to check both outputs.
