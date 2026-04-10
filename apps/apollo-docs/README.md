# apollo-docs

Central documentation site for the Apollo UI design system.

Built with [Nextra v4](https://nextra.site) and [Next.js](https://nextjs.org), using the Apollo future-dark/light theme.

## Getting Started

From the monorepo root:

```bash
pnpm install
pnpm dev:apollo-docs
```

Then open [http://localhost:3000](http://localhost:3000).

## Structure

```
apps/apollo-docs/
├── app/                        # Next.js app router
│   ├── introduction/           # What is Apollo?, Installation, Prototyping, CLI, Contributing
│   ├── theme/                  # Theme documentation
│   ├── components/             # Component documentation
│   ├── templates/              # Template documentation
│   ├── forms/                  # Forms documentation
│   ├── canvas/                 # Canvas documentation
│   ├── chat/                   # Chat documentation
│   ├── layout.tsx              # Root layout with Nextra theme
│   ├── globals.css             # Apollo future-dark/light theme tokens
│   └── page.tsx                # Root redirect
├── components/                 # Shared MDX demo components
│   ├── WindButtonDemo.tsx      # Live apollo-wind Button demo
│   └── ReactButtonDemo.tsx     # Live apollo-react Button demo
├── mdx-components.tsx          # Global MDX component registration
├── next.config.mjs             # Next.js + Nextra configuration
└── package.json
```

## Adding Pages

Pages are MDX files inside the `app/` directory. Each folder can have a `_meta.ts` to control sidebar labels and ordering.

```ts
// app/components/_meta.ts
export default {
  button: 'Button',
  input: 'Input',
};
```

Then create the page at `app/components/button/page.mdx`.

## Theming

The site uses Apollo's `future-dark` theme by default. The Nextra toolbar in the top-right toggles between `future-dark` and `future-light`.

Theme tokens are defined in `app/globals.css` and sourced from `@uipath/apollo-wind/styles.css`.
