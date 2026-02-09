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
import { ApButton, ApTextField } from '@uipath/apollo-react/components';

function App() {
  return (
    <div>
      <ApButton variant="primary">Click me</ApButton>
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

#### Available Themes

| Theme | Description | Import |
|-------|-------------|--------|
| **Light** | Standard light theme | `apolloMaterialUiThemeLight` |
| **Dark** | Standard dark theme | `apolloMaterialUiThemeDark` |
| **Light High Contrast** | High contrast light theme for accessibility | `apolloMaterialUiThemeLightHC` |
| **Dark High Contrast** | High contrast dark theme for accessibility | `apolloMaterialUiThemeDarkHC` |

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

## License

MIT
