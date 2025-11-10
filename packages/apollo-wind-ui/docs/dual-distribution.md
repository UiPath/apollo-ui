# Dual Distribution Guide

@uipath/apollo-wind-ui supports two installation methods.

## Option 1: NPM Package (Recommended for most users)

Install the entire component library as a dependency:

```bash
pnpm add @uipath/apollo-wind-ui @uipath/apollo-wind-css
```

**Pros:**

- Faster setup
- Automatic updates via package manager
- Tree-shaking supported
- Smaller bundle in production
- Easy version management

**Cons:**

- Less customization flexibility
- Components live in node_modules

**Usage:**

```tsx
import { Button, Card } from '@uipath/apollo-wind-ui';

export function Example() {
  return (
    <Card>
      <Button>Click me</Button>
    </Card>
  );
}
```

---

## Option 2: shadcn Registry (For customization)

Copy components directly into your project:

```bash
npx shadcn@latest add button --registry https://uipath.github.io/apollo-wind/registry.json
```

**Pros:**

- Full component source in your project
- Easy to customize and modify
- No dependency on npm package
- Own the code completely

**Cons:**

- Manual updates required
- More initial setup
- Larger codebase

**Usage:**

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function Example() {
  return (
    <Card>
      <Button>Click me</Button>
    </Card>
  );
}
```

---

## Setup for Registry Method

### 1. Install dependencies

```bash
pnpm add @uipath/apollo-wind-css
pnpm add -D tailwindcss@^4.1.14 @tailwindcss/vite
```

### 2. Configure Tailwind CSS v4

In your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### 3. Import Apollo Wind CSS

In your `src/index.css`:

```css
@import 'tailwindcss';
@import '@uipath/apollo-wind-css';
@import '@uipath/apollo-wind-css/theme-selectors';
```

### 4. Add components via registry

```bash
npx shadcn@latest add button --registry https://uipath.github.io/apollo-wind/registry.json
```

---

## When to Use Each Method

### Use NPM Package when:

- Building applications quickly
- Don't need deep component customization
- Want automatic updates
- Working in a team with standardized components
- Prefer smaller application codebase

### Use Registry when:

- Need to modify component internals
- Want full control over component code
- Building a design system on top of Apollo Wind
- Prototyping custom component variants
- Learning how components work internally

---

## Migration Between Methods

### From Registry to NPM Package:

1. Remove copied components from `src/components/ui/`
2. Install: `pnpm add @uipath/apollo-wind-ui`
3. Update imports from `@/components/ui/*` to `@uipath/apollo-wind-ui`
4. Remove `utils.ts` if only used by shadcn components

### From NPM Package to Registry:

1. Uninstall: `pnpm remove @uipath/apollo-wind-ui`
2. Install components via registry: `npx shadcn@latest add <component>`
3. Update imports from `@uipath/apollo-wind-ui` to `@/components/ui/*`
4. Add `lib/utils.ts` with cn() function

---

## FAQ

**Q: Can I mix both methods?**
A: Not recommended. Choose one method for consistency.

**Q: Which method has better performance?**
A: Both are equivalent at runtime. NPM package may have slightly smaller bundles due to tree-shaking.

**Q: How do I update components from the registry?**
A: Re-run the `npx shadcn@latest add` command. Your custom modifications will be overwritten, so back them up first.

**Q: Does the registry support TypeScript?**
A: Yes, all components include full TypeScript types.

**Q: What about CSS?**
A: Both methods require `@uipath/apollo-wind-css` for Apollo theming.

---

## Support

For issues or questions:

- NPM Package: Check package documentation
- Registry: Refer to [shadcn/ui docs](https://ui.shadcn.com/docs/cli)
- Apollo Wind: See main repository README
