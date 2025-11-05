# @uipath/apollo-wind

Tailwind CSS and shadcn/ui implementation for the Apollo Design System.

## Overview

`apollo-wind` provides modern React components built with Tailwind CSS and shadcn/ui patterns, using Apollo design tokens.

## Installation

```bash
npm install @uipath/apollo-wind
# or
pnpm add @uipath/apollo-wind
# or
yarn add @uipath/apollo-wind
```

## Setup

### 1. Add Tailwind Config

Extend your `tailwind.config.js` with Apollo tokens:

```javascript
const apolloConfig = require('@uipath/apollo-wind/tailwind.config');

module.exports = {
  presets: [apolloConfig],
  content: ['./src/**/*.{js,ts,jsx,tsx}', './node_modules/@uipath/apollo-wind/dist/**/*.js'],
  // Your custom config
};
```

### 2. Import Global Styles

```typescript
import '@uipath/apollo-wind/styles.css';
```

## Usage

### Import Components

```typescript
import { Button, Card, Input } from '@uipath/apollo-wind';

function App() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Button variant="default">Submit</Button>
    </Card>
  );
}
```

### Utility Functions

```typescript
import { cn } from '@uipath/apollo-wind/lib/utils';

// Combine class names with Tailwind merge
const classes = cn('px-4 py-2', isActive && 'bg-primary');
```

## Features

- Built with Tailwind CSS utility classes
- shadcn/ui component patterns
- Apollo design tokens integration
- Fully typed with TypeScript
- Tree-shakeable components

## License

MIT
