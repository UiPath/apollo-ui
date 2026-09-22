# UiPath Apollo Vertex

Compiled React components for Vertical Solutions. Import from the package root.
Vite tree-shakes unused named exports.

```tsx
import { Button, DataTable } from "@uipath/apollo-vertex";
import "@uipath/apollo-vertex/theme.css";
```

Do not import primitives from deep paths such as `@uipath/apollo-vertex/button`.

Optional-peer features are separate subpaths. Import them only when the host
app provides those peers:

```ts
import { ApolloShell, ShellAuthProvider } from "@uipath/apollo-vertex/shell";
import { useEntityDataTable } from "@uipath/apollo-vertex/shell/entities";
import { BarChart, dataFabricAdapter } from "@uipath/apollo-vertex/charts";
import { FeatureFlagProvider } from "@uipath/apollo-vertex/feature-flags";
import { createProteusProvider } from "@uipath/apollo-vertex/feature-flags/proteus";
import { SolutionTestsView } from "@uipath/apollo-vertex/solution-tests";
import { SolutionTests } from "@uipath/apollo-vertex/solution-tests/data";
import { AiChat } from "@uipath/apollo-vertex/ai-chat";
```

`./shell` is layout and auth. vs-core entity hooks live on `./shell/entities`.
`./feature-flags` is the generic provider. Proteus is `./feature-flags/proteus`.
`./solution-tests` is presentational. Collection hooks are `./solution-tests/data`.
`./charts` is Recharts views and Data Fabric / Insights adapters.

## Install

```bash
pnpm add @uipath/apollo-vertex
```

This package is published to npm and GitHub Package Registry. External users
pull from npm. Internal UiPath users with `.npmrc` configured pull from GitHub
Packages.

`@uipath/vs-core` and `@uipath/proteus-client` are GitHub Packages only. They
are not on npm, so they are not `peerDependencies` of this package (pnpm would
404). Install them from GitHub Packages in the host app before importing
`./shell/entities`, `./feature-flags/proteus`, or `./solution-tests/data`.

## Tailwind

The build is unbundled (`rslib` `bundle: false`), so class names live in the
published JS. Point Tailwind at `dist`:

```css
@import "@uipath/apollo-vertex/tailwind.css";

@source "./src/**/*.{ts,tsx}";
@source "./node_modules/@uipath/apollo-vertex/dist/**/*.js";
```

`theme.css` is variables only (`@theme inline`, `:root`, `.dark`).
`tailwind.css` imports Tailwind, the theme, and `tw-animate-css`.

Do not import `@uipath/apollo-wind` CSS alongside this. Vertex tokens (oklch,
insight, AI gradients) are not apollo-core Future tokens.

## Customize

Wrap the public API. Do not fork files out of `node_modules`.

```tsx
import { Button } from "@uipath/apollo-vertex";

export function PrimaryButton(props: React.ComponentProps<typeof Button>) {
  return <Button variant="default" {...props} />;
}
```

## Tree-shaking

`package.json` `sideEffects` is CSS-only. The root `index` is named ESM
re-exports over per-file modules. A modern bundler (Vite) includes only the
components you import.

## Status

Peers are React 19+ only. TypeScript target/lib is modern (`ESNext`); `toSorted`
and `React.use` stay as written.

Root export: primitives, Data Table, `cn`, and theme CSS. Optional-peer
subpaths (`./shell`, `./shell/entities`, `./charts`, `./feature-flags`,
`./feature-flags/proteus`, `./solution-tests`, `./solution-tests/data`,
`./ai-chat`) stay off the root graph.
