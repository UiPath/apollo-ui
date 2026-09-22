# UiPath Apollo Vertex

Compiled React components for Vertical Solutions. Import from the package root.
Vite tree-shakes unused named exports.

```tsx
import { Button, DataTable } from "@uipath/apollo-vertex";
import "@uipath/apollo-vertex/theme.css";
```

Do not import primitives from deep paths such as `@uipath/apollo-vertex/button`.
Subpaths are reserved for optional-peer features (`shell`, `solution-tests`,
`feature-flags`, `ai-chat`) and are not in this first release.

## Install

```bash
pnpm add @uipath/apollo-vertex
```

This package is published to npm and GitHub Package Registry. External users
pull from npm. Internal UiPath users with `.npmrc` configured pull from GitHub
Packages.

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

First slice: primitives, Data Table, `cn`, and theme CSS. Shell, solution-tests,
feature-flags, and ai-chat stay out of the root graph until a later release.
