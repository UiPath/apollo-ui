# Apollo Vertex

This app serves two purposes:
1.  **Documentation Site**: A Nextra-powered documentation site for the Apollo Vertex design system.
2.  **Component Registry**: A `shadcn` compatible registry that serves component code to other applications.

## Project Structure

```text
apps/apollo-vertex/
├── app/                   # Next.js App Router (Documentation Pages)
│   └── components/        # MDX docs for each component
├── registry/              # Source code for Registry Components
│   └── button/            # e.g. Button component source
├── public/
│   └── r/                 # Generated Registry JSONs (do not edit)
├── registry.json          # Registry configuration
└── package.json
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
We write components in `registry/` and use them directly in our `app/` documentation pages. When we are ready to publish, we build the registry.

### Build Registry
This command parses `registry.json` and compiles the components from `registry/` into JSON files located in `public/r/`.
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

1.  Create the component file in `registry/<component>/<component>.tsx`.
2.  Add the component definition to `registry.json`.
3.  Create a documentation page in `app/components/<component>/page.mdx`.
4.  Run `pnpm registry:build` to update the registry artifacts.

