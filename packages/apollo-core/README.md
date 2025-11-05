# @uipath/apollo-core

Core design tokens, icons, and fonts for the Apollo Design System.

## Overview

`apollo-core` is the foundation of the Apollo Design System. It provides framework-agnostic design tokens, icons, and font assets that are consumed by all other Apollo packages.

## Installation

```bash
npm install @uipath/apollo-core
# or
pnpm add @uipath/apollo-core
# or
yarn add @uipath/apollo-core
```

## Usage

### Import CSS Variables

```typescript
import '@uipath/apollo-core/theme.css';
```

### Import Design Tokens

```typescript
// Import all tokens
import { ColorPrimary500, SpacingMd, FontSizeBase } from '@uipath/apollo-core/tokens';

// Import specific token categories
import { colors } from '@uipath/apollo-core/tokens';
import { spacing } from '@uipath/apollo-core/tokens';
import { typography } from '@uipath/apollo-core/tokens';
```

### Import Icons

```typescript
import { IconClose, IconCheck, IconWarning } from '@uipath/apollo-core/icons';
```

### Import Fonts

```typescript
import '@uipath/apollo-core/fonts';
```

## Token Categories

- **Colors**: Semantic colors (primary, secondary, success, error, etc.)
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Consistent spacing scale (xs, sm, md, lg, xl, etc.)
- **Shadows**: Elevation system for depth
- **Borders**: Border radii and widths
- **Z-index**: Layering system
- **Icons**: SVG icon library

## Token Format

### CSS Custom Properties

```css
--color-primary-500
--spacing-md
--font-size-base
```

### TypeScript/JavaScript

```typescript
ColorPrimary500;
SpacingMd;
FontSizeBase;
```

### SCSS Variables

```scss
$color-primary-500
$spacing-md
$font-size-base
```

## License

MIT
