# Apollo Vertex

This app is the [Fumadocs](https://fumadocs.dev) documentation site for the Apollo Vertex design system. It also builds the `shadcn` registry that serves component code to other applications.

The component sources live in [`packages/apollo-vertex`](../../packages/apollo-vertex). This app imports them for live examples and compiles them into the registry, so there is a single copy of every component.

## Project Structure

```text
apps/apollo-vertex/
├── app/                   # Next.js App Router (layout, docs route, API proxies)
├── content/docs/          # MDX docs pages and meta.json sidebar order
│   └── components/        # MDX docs for each component
├── templates/             # Example compositions used on docs pages
├── public/
│   └── r/                 # Generated Registry JSONs (do not edit)
└── package.json

packages/apollo-vertex/
├── registry/              # Source code for Registry Components
│   └── button/            # e.g. Button component source
└── registry.json          # Registry configuration
```

## Development

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run Development Server
Starts the documentation site and playground.
```bash
pnpm dev
```
Visit [http://localhost:3000](http://localhost:3000) to view the docs.

## Registry

### How it Works
We write components in `packages/apollo-vertex/registry/` and use them directly in our `content/docs/` documentation pages. When we are ready to publish, we build the registry.

### Build Registry
This command parses `packages/apollo-vertex/registry.json` and compiles the components from `packages/apollo-vertex/registry/` into JSON files located in `public/r/`.
```bash
pnpm registry:build
```

### Consuming Components
Once the registry is built and the app is running (or deployed), other apps can install components using the `shadcn` CLI:

```bash
npx shadcn@latest add http://localhost:3000/r/button.json
```
*(Replace URL with your deployed domain in production)*

## Adding a New Component

1.  Create the component file in `packages/apollo-vertex/registry/<component>/<component>.tsx`.
2.  Add the component definition to `packages/apollo-vertex/registry.json`.
3.  Create a documentation page in `content/docs/components/<component>.mdx` (with a `title` in its frontmatter) and add it to `content/docs/components/meta.json`.
4.  Run `pnpm registry:build` to update the registry artifacts.

