# @uipath/apollo-wind-ui

Apollo Design System React Components built with shadcn/ui + Radix UI + Tailwind CSS v4.

## Status

✅ **Phase 4 Complete** - Tier 1 & Tier 2 Components + Registry Support Available

## Installation

### Option 1: NPM Package (Recommended)

```bash
pnpm add @uipath/apollo-wind-ui @uipath/apollo-wind-css
```

### Option 2: shadcn Registry

```bash
npx shadcn@latest add button --registry https://uipath.github.io/apollo-wind/registry.json
```

See [Dual Distribution Guide](./docs/dual-distribution.md) for details on which method to use.

## Components

### Tier 1 (Available Now)

- ✅ **Button** - Multiple variants (default, destructive, outline, secondary, ghost, link) with sizes
- ✅ **Card** - Compositional card component with Header, Title, Description, Content, Footer
- ✅ **Input** - Styled form input with Apollo theming
- ✅ **Label** - Accessible form labels with Radix UI
- ✅ **Select** - Dropdown select with Radix UI primitives

### Tier 2 (Available Now)

- ✅ **Dialog** - Modal dialogs with overlay, accessible and keyboard-navigable
- ✅ **Dropdown Menu** - Context menus with sub-menus, keyboard shortcuts, and separators
- ✅ **Tooltip** - Hover tooltips with customizable positioning and delay
- ✅ **Popover** - Rich popover content with portal rendering
- ✅ **Tabs** - Tabbed interfaces with keyboard navigation

## Usage

Always import both the base CSS package and the UI utility sheet so shadcn classes resolve to Apollo tokens:

```css
/* app/src/index.css */
@import '@uipath/apollo-wind-css';
@import '@uipath/apollo-wind-css/theme-selectors';
@import '@uipath/apollo-wind-ui/utilities.css';
```

### Button Example

```tsx
import { Button } from '@uipath/apollo-wind-ui';

export function Example() {
  return (
    <div>
      <Button variant="default">Click me</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Cancel</Button>
    </div>
  );
}
```

### Card Example

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@uipath/apollo-wind-ui';

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content</p>
      </CardContent>
    </Card>
  );
}
```

### Form Example

```tsx
import {
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@uipath/apollo-wind-ui';

export function Example() {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Enter your name" />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Select>
          <SelectTrigger id="role">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

## Development

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Registry

Apollo Wind UI supports dual distribution:

**Registry URL:** `https://uipath.github.io/apollo-wind/registry.json`

Available components via registry:

**Tier 1:**

- button
- card
- input
- label
- select

**Tier 2:**

- dialog
- dropdown-menu
- tooltip
- popover
- tabs

## Roadmap

- [x] Phase 1: Setup & Foundation
- [x] Phase 2: Tier 1 Components (Button, Card, Input, Label, Select)
- [x] Phase 3: shadcn Registry Support
- [x] Phase 4: Tier 2 Interactive Components (Dialog, Dropdown Menu, Tooltip, Popover, Tabs)
- [ ] Phase 5: Polish & Release v1.0.0

## Documentation

- [Dual Distribution Guide](./docs/dual-distribution.md) - NPM vs Registry comparison
- [Registry Schema](../../plan/registry-schema.md) - Technical registry documentation
- [Storybook CSS](./docs/storybook-css.md) - Understanding the prebuilt CSS bundle

For design specifications and implementation details, see the project documentation.

## Architecture

This package provides React components that:

- Build on shadcn/ui component patterns
- Use Radix UI primitives for accessibility
- Style with Tailwind CSS v4 and Apollo Design System tokens
- Integrate seamlessly with @uipath/apollo-wind-css

## License

Copyright 2025, UiPath, all rights reserved
