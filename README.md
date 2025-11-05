# Apollo v.4 Design System

Apollo v.4 is an open-source design system for UiPath, providing a unified, accessible, and framework-agnostic component library.

## Features

- **Framework-optimized**: First-class React and Angular support
- **Design tokens**: Shared tokens across all frameworks
- **Tailwind support**: Modern styling with apollo-wind
- **Web Components**: Cross-framework components
- **TypeScript**: Full type safety
- **Storybook**: Interactive component documentation
- **Monorepo**: Managed with Turborepo and pnpm

## Repository Structure

```
apollo-ui/
├── packages/              # Core + framework packages
│   ├── apollo-core/       # Design tokens, icons, fonts
│   ├── apollo-utils/      # Shared utilities
│   ├── apollo-react/      # React components + MUI theme
│   ├── apollo-angular/    # Angular components + Material theme
│   └── apollo-wind/       # Tailwind + shadcn/ui
│
├── web-packages/          # Cross-framework web components
│   ├── ap-autopilot-chat/ # Chat web component
│   └── ap-data-grid/      # Data grid web component
│
└── apps/                  # Development applications
    ├── storybook/         # Component documentation
    ├── react-playground/  # React testing environment
    └── angular-playground/# Angular testing environment
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Run all packages in development mode
pnpm dev

# Run Storybook
pnpm storybook

# Lint all packages
pnpm lint

# Run tests
pnpm test

# Run visual regression tests
pnpm test:visual
```

### Building

```bash
# Build all packages
pnpm build

# Build Storybook
pnpm storybook:build
```

## Packages

### Core Packages

- **[@uipath/apollo-core](./packages/apollo-core)** - Design tokens, icons, and fonts
- **[@uipath/apollo-utils](./packages/apollo-utils)** - Shared utilities and helpers

### Framework Packages

- **[@uipath/apollo-react](./packages/apollo-react)** - React components with Material UI theming
- **[@uipath/apollo-angular](./packages/apollo-angular)** - Angular components with Angular Material theming
- **[@uipath/apollo-wind](./packages/apollo-wind)** - Tailwind CSS and shadcn/ui implementation

### Web Packages

- **[@uipath/ap-autopilot-chat](./web-packages/ap-autopilot-chat)** - Chat web component
- **[@uipath/ap-data-grid](./web-packages/ap-data-grid)** - Data grid web component with React wrapper

## Usage

### React

```tsx
import '@uipath/apollo-react/core/theme.css';
import { ApButton } from '@uipath/apollo-react/components';

function App() {
  return <ApButton variant="contained">Click me</ApButton>;
}
```

### Angular

```typescript
import { ApolloButtonModule } from '@uipath/apollo-angular';

@NgModule({
  imports: [ApolloButtonModule],
})
export class AppModule {}
```

### Tailwind

```tsx
import { Button } from '@uipath/apollo-wind';

function App() {
  return <Button variant="default">Click me</Button>;
}
```

### Web Components

```html
<script type="module">
  import '@uipath/ap-autopilot-chat';
</script>

<ap-autopilot-chat></ap-autopilot-chat>
```

## Contributing

Please read [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation and contribution guidelines.

### Component Checklist

- [ ] Follows naming conventions (Ap\* prefix for React)
- [ ] Uses tokens from apollo-core
- [ ] Includes TypeScript types
- [ ] Has Storybook story
- [ ] Has unit tests
- [ ] Has visual regression tests
- [ ] Documented in package README
- [ ] Accessible (WCAG 2.1 AAA compliant)

## License

MIT

## Documentation

- [Architecture](./CLAUDE.md) - Detailed architecture and contribution guidelines
- [Storybook](https://uipath.github.io/apollo-ui) - Component documentation (coming soon)
- [Confluence](https://uipath.atlassian.net/wiki/spaces/CLD/pages/89705644276/Apollo+v.4+Architecture) - Design system documentation
