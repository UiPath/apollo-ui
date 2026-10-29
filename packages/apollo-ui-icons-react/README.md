# @uipath/apollo-ui-icons-react

The Apollo icon set as React components: one component for each SVG in
[`@uipath/apollo-ui-icons`](../apollo-ui-icons).

Kept apart from `@uipath/apollo-ui-icons` so that SVG-only consumers don't
take on a React peer dependency or the size of 1300+ compiled components.

## Installation

```bash
pnpm add @uipath/apollo-ui-icons-react
# or
npm install @uipath/apollo-ui-icons-react
```

React 18.3 or later is a peer dependency.

## Usage

Each icon is a `forwardRef` `<svg>` that paints with `currentColor`, so it
takes the text colour of its parent. `size` sets both width and height and
defaults to 24.

```tsx
import { AddComment, Close } from '@uipath/apollo-ui-icons-react';
import Lock from '@uipath/apollo-ui-icons-react/Lock';

<Close />
<AddComment size={16} className="text-muted-foreground" />
<Lock />
```

Every icon is also exported as `<Name>Icon` from the root entry. Import one
icon per subpath where your test runner or dev server doesn't tree-shake.

`@uipath/apollo-react/icons` re-exports these components.

## Directory Structure

```
apollo-ui-icons-react/
├── src/                       # Generated components, one per icon, and index.ts
├── scripts/
│   ├── generate-react-icons.ts # Component generation from ../apollo-ui-icons/src/svg
│   └── build-react-icons.ts    # Cached wrapper, skips unchanged SVGs
└── dist/                      # One ESM, CJS and .d.ts module per icon
```

`src/` is generated and replaced on every run. Change the SVGs in
`@uipath/apollo-ui-icons` or the generator instead, and commit the result.

## Scripts

```bash
pnpm build           # Generate the components when the SVGs changed, then compile
pnpm build:icons     # Generate the components only (cached by SVG mtime and size)
pnpm generate:icons  # Generate the components, ignoring the cache
```

## License

MIT
