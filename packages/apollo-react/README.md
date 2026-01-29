# @uipath/apollo-react

React component library with Material UI theming for the Apollo Design System.

## Overview

`apollo-react` provides React components built on top of Material UI with Apollo design tokens and theming.

## Installation

```bash
npm install @uipath/apollo-react
# or
pnpm add @uipath/apollo-react
# or
yarn add @uipath/apollo-react
```

## Usage

### Import CSS Variables

```typescript
import '@uipath/apollo-react/core/theme.css';
```

### Import Components

```typescript
import { ApButton, ApTextField, ApCard } from '@uipath/apollo-react/components';

function App() {
  return (
    <div>
      <ApButton variant="contained">Click me</ApButton>
      <ApTextField label="Name" />
    </div>
  );
}
```

### Import Design Tokens

```typescript
import { ColorPrimary500, SpacingMd } from '@uipath/apollo-react/core';
```

### Import Theme

```typescript
import { ThemeProvider } from '@mui/material';
import { apolloMaterialUiThemeDark, apolloMaterialUiThemeLight } from '@uipath/apollo-react/theme';

function App() {
  return (
    <ThemeProvider theme={apolloMaterialUiThemeDark}>
      {/* Your app */}
    </ThemeProvider>
  );
}
```

## Component Naming

All React components use the `Ap` prefix:

- `ApButton`
- `ApTextField`
- `ApCard`
- etc.

## Exports

- `components`: All Ap\* React components
- `core`: Re-exported apollo-core tokens
- `theme`: Material UI theme overrides (apolloMaterialUiThemeDark, apolloMaterialUiThemeLight)
- `utils`: Re-exported apollo-utils functions

## Development

### Local Development with yalc

This package uses [yalc](https://github.com/wclr/yalc) for local development against consumer projects without publishing to npm.

#### Setup

yalc is installed as a devDependency. Install it with:

```bash
pnpm install
```

#### Development Workflow

When making changes that you want to test in a consumer project:

```bash
# Build and publish to yalc
pnpm build
pnpm run yalc:publish

# Or push updates to already linked projects
pnpm run yalc:push
```

The consumer project's dev server will automatically detect the changes and hot-reload.

#### Available Scripts

- `pnpm run yalc:publish` - Publish to local yalc store
- `pnpm run yalc:push` - Push updates to linked projects
- `pnpm run build` - Build the package

#### Consuming Projects

Projects using this package via yalc should run:

```bash
# Link this package
yalc add @uipath/apollo-react
pnpm install

# Unlink and restore npm version
yalc remove @uipath/apollo-react
pnpm install
```

See consumer projects (e.g., flow-workbench) for detailed setup instructions.

## License

MIT
