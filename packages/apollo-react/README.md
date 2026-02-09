# @uipath/apollo-react

React component library with Material UI theming for the Apollo Design System.

## ⚠️ Important: Package Usage Guide

### When to Use apollo-react

**✅ Actively Supported - Use for:**
- **Canvas/workflow components** - Hierarchical canvas, agent workflows, XYFlow integration (unique to this package)
- **ApChat** - AI chat interface component
- **Icons** - React icon components
- **Core tokens** - Re-exported from @uipath/apollo-core

**⚠️ Maintenance Mode - Avoid for New Development:**
- **Material UI (`./material`)** - Entire Material UI section including themes and Ap* components

### For New Development: Use `@uipath/apollo-wind`

For new UI components, theming, and general application development, use `@uipath/apollo-wind` (Tailwind CSS + shadcn/ui) instead. It provides a modern, maintainable approach to building UI.

> **Note:** Canvas components will remain in apollo-react but will be refactored internally to consume apollo-wind components instead of Material UI, improving maintainability while keeping the same public API.

### Material UI Section (⚠️ Maintenance Mode)

The Material UI themes and components (`./material`) are maintained for backwards compatibility only. The themes apply Apollo design tokens to all Material UI components:

```typescript
import { ThemeProvider } from '@mui/material';
import { Button, TextField } from '@mui/material';
import { apolloMaterialUiThemeDark } from '@uipath/apollo-react/material/theme';

// Theme applies Apollo styling to standard MUI components
<ThemeProvider theme={apolloMaterialUiThemeDark}>
  <Button variant="contained">Styled with Apollo theme</Button>
  <TextField label="Uses Apollo tokens" />
</ThemeProvider>
```

**Why maintenance mode?**
- Moving to Tailwind CSS (apollo-wind) for better maintainability
- Material UI theming adds complexity
- Ap* components duplicate MUI's API surface

## Overview

`@uipath/apollo-react` provides:

**Actively Maintained:**
- **Canvas/Workflow Components** - Hierarchical canvas for agent workflows with XYFlow integration
- **ApChat** - Full-featured AI chat interface component with i18n support
- **Icons** - 1300+ React icon components
- **Design Tokens** - Re-exported from @uipath/apollo-core

**Maintenance Mode (Backwards Compatibility Only):**
- **Material UI (`./material`)** - Themes and Ap* components (use `@uipath/apollo-wind` for new development)

## Installation

```bash
npm install @uipath/apollo-react
# or
pnpm add @uipath/apollo-react
# or
yarn add @uipath/apollo-react
```

## Quick Start

### Apollo Themes with Standard Material UI

```typescript
import { ThemeProvider } from '@mui/material';
import { Button, TextField } from '@mui/material';
import { apolloMaterialUiThemeDark } from '@uipath/apollo-react/material/theme';

function App() {
  return (
    <ThemeProvider theme={apolloMaterialUiThemeDark}>
      <Button variant="contained">Apollo-themed Button</Button>
      <TextField label="Apollo-themed Input" />
    </ThemeProvider>
  );
}
```

### Using Ap* Wrapper Components

```typescript
import { ApButton, ApTextField } from '@uipath/apollo-react/material/components';
import { ThemeProvider } from '@mui/material';
import { apolloMaterialUiThemeDark } from '@uipath/apollo-react/material/theme';

function App() {
  return (
    <ThemeProvider theme={apolloMaterialUiThemeDark}>
      <ApButton variant="primary">Click me</ApButton>
      <ApTextField label="Name" />
    </ThemeProvider>
  );
}
```

## Package Exports

### Main Entry Point

```typescript
// Re-exports from material, canvas, icons, core
import { ApButton, HierarchicalCanvas } from '@uipath/apollo-react';
```

### Material UI Components (⚠️ Maintenance Mode)

> **⚠️ Deprecation Notice:** Ap* components are Material UI wrappers maintained for legacy support. For new projects, use `@uipath/apollo-wind` or standard Material UI components with Apollo themes.

```typescript
// All components from single import
import { ApButton, ApTextField, ApModal } from '@uipath/apollo-react/material/components';

// Individual component imports (for smaller bundles)
import { ApButton } from '@uipath/apollo-react/material/components/ap-button';
```

**Recommended alternative:**
```typescript
// Use standard MUI components with Apollo theme instead
import { Button, TextField } from '@mui/material';
import { apolloMaterialUiThemeDark } from '@uipath/apollo-react/material/theme';
```

### Theme System

```typescript
import {
  apolloMaterialUiThemeDark,
  apolloMaterialUiThemeLight,
  apolloMaterialUiThemeDarkHC,
  apolloMaterialUiThemeLightHC
} from '@uipath/apollo-react/material/theme';
```

### Canvas Components

```typescript
// Main canvas components
import {
  HierarchicalCanvas,
  AgentCanvas,
  BaseCanvas,
  BaseNode,
  GroupNode
} from '@uipath/apollo-react/canvas';

// Canvas utilities and hooks
import { useCanvasStore } from '@uipath/apollo-react/canvas/hooks';
import { Breadcrumb } from '@uipath/apollo-react/canvas/controls';

// XYFlow re-exports
import { ReactFlow, Panel } from '@uipath/apollo-react/canvas/xyflow/react';
```

### ApChat Component

```typescript
import { ApChat } from '@uipath/apollo-react/ap-chat';
import {
  AutopilotChatService,
  AutopilotChatMode,
  type ApChatTheme
} from '@uipath/apollo-react/ap-chat/service';
```

### Icons

```typescript
// Import specific icons
import { AddCanvas, Close, ChevronDown } from '@uipath/apollo-react/icons';

// Icon types
import type { IconName } from '@uipath/apollo-react/icons';
```

### Design Tokens

```typescript
// Re-exported from @uipath/apollo-core
import {
  ColorPrimary500,
  SpacingMd,
  FontFamilyBase
} from '@uipath/apollo-react/core';
```

## Themes (⚠️ Maintenance Mode)

Four Material UI themes with Apollo design tokens. These themes work with all Material UI components, not just Ap* components.

| Theme | Description | Import |
|-------|-------------|--------|
| **Light** | Standard light theme | `apolloMaterialUiThemeLight` |
| **Dark** | Standard dark theme | `apolloMaterialUiThemeDark` |
| **Light High Contrast** | Accessibility-focused light | `apolloMaterialUiThemeLightHC` |
| **Dark High Contrast** | Accessibility-focused dark | `apolloMaterialUiThemeDarkHC` |

### Theme Usage with Standard Material UI Components

The Apollo themes apply to **all Material UI components**, allowing you to use the standard MUI library with Apollo design tokens:

```typescript
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Button, TextField, Card, AppBar } from '@mui/material';
import { apolloMaterialUiThemeDark } from '@uipath/apollo-react/material/theme';

function App() {
  return (
    <ThemeProvider theme={apolloMaterialUiThemeDark}>
      <CssBaseline />
      {/* Standard MUI components automatically use Apollo styling */}
      <AppBar>
        <Button variant="contained">Apollo-styled Button</Button>
        <TextField label="Apollo-styled Input" />
      </AppBar>
    </ThemeProvider>
  );
}
```

This approach allows you to integrate Apollo design tokens into existing Material UI applications without using Ap* wrapper components.

## Icons

Access to 1300+ Apollo icons as React components:

```typescript
import {
  AddCanvas,
  Close,
  ChevronDown,
  AlertError
} from '@uipath/apollo-react/icons';

function MyComponent() {
  return (
    <div>
      <AddCanvas />
      <ChevronDown />
    </div>
  );
}
```

Icons are auto-generated from `@uipath/apollo-core` with React wrappers. Icon names use PascalCase.

## Internationalization (i18n)

ApChat component includes built-in i18n support for chat-related features using Lingui. The `locale` prop accepts supported locales:

```typescript
import { ApChat } from '@uipath/apollo-react/ap-chat';
import type { SupportedLocale } from '@uipath/apollo-react/ap-chat';

// Supported locales: 'en', 'de', 'es', 'es-MX', 'fr', 'ja', 'ko', 'pt', 'pt-BR', 'ru', 'tr', 'zh-CN', 'zh-TW'
<ApChat service={chatService} locale="en" />
```

## Advanced Usage

### ApChat with Service

ApChat requires setting up a service instance. See the complete documentation in the package:

```typescript
import { ApChat } from '@uipath/apollo-react/ap-chat';
import {
  AutopilotChatService,
  AutopilotChatMode,
  AutopilotChatEvent
} from '@uipath/apollo-react/ap-chat/service';
import { useState, useEffect } from 'react';

function ChatInterface() {
  const [chatService, setChatService] = useState<AutopilotChatService | null>(null);

  useEffect(() => {
    // Initialize service
    const service = AutopilotChatService.Instantiate({
      instanceName: 'my-chat',
      config: {
        mode: AutopilotChatMode.SideBySide
      }
    });

    setChatService(service);

    // Subscribe to events using the AutopilotChatEvent enum
    const unsubscribeRequest = service.on(AutopilotChatEvent.Request, (data) => {
      console.log('User request:', data);
      // Handle user input
    });

    const unsubscribeFeedback = service.on(AutopilotChatEvent.Feedback, (data) => {
      console.log('User feedback:', data);
      // Handle feedback
    });

    return () => {
      unsubscribeRequest();
      unsubscribeFeedback();
      service.close();
    };
  }, []);

  if (!chatService) return null;

  return (
    <ApChat
      service={chatService}
      locale="en"
      theme="light"
    />
  );
}
```

**Note:** ApChat has extensive configuration options and events. Refer to the [complete API documentation](./src/material/components/ap-chat/DOCS.md) for all available events, methods, and configuration options.

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  ApButtonProps,
  ApTextFieldProps,
  AutopilotChatService,
  ApChatTheme,
  CanvasLevel
} from '@uipath/apollo-react';
```

## Directory Structure

```
apollo-react/
├── src/
│   ├── material/              # Material UI components
│   │   ├── components/        # Ap* components
│   │   └── theme/            # MUI theme overrides
│   ├── canvas/               # Canvas/workflow components
│   │   ├── components/       # Canvas components
│   │   ├── controls/         # Canvas controls
│   │   ├── hooks/           # Canvas hooks
│   │   ├── layouts/         # Layout algorithms
│   │   ├── stores/          # Zustand state stores
│   │   ├── xyflow/          # XYFlow re-exports
│   │   └── styles/          # Canvas styles
│   ├── icons/               # Icon React components
│   ├── core/                # Re-exported apollo-core
│   ├── i18n/               # Internationalization
│   └── types/              # TypeScript types
├── scripts/
│   └── icons-build.ts      # Icon generation
└── dist/                   # Built output
    ├── material/           # Material UI exports
    ├── canvas/            # Canvas exports
    ├── icons/             # Icon exports
    └── core/              # Token exports
```

## Peer Dependencies

```json
{
  "react": ">=18.3.0",
  "react-dom": ">=18.3.0"
}
```

Material UI packages and other dependencies are included.

## License

MIT
