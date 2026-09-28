# @uipath/apollo-core

Core design tokens and fonts for the Apollo Design System.

## Overview

Apollo Core provides the foundational design elements for the UiPath Apollo Design System:

- **Design Tokens**: Colors, typography, spacing, shadows, borders, and more
- **Fonts**: Typography assets

## Installation

```bash
npm install @uipath/apollo-core
# or
pnpm add @uipath/apollo-core
# or
yarn add @uipath/apollo-core
```

**Note:** This package is published to both npm and GitHub Package Registry. External users will automatically pull from npm. Internal UiPath users with `.npmrc` configured will automatically pull from GitHub Package Registry.

## Usage

### Design Tokens

```typescript
import * as ApolloCore from '@uipath/apollo-core';

// Use design tokens
const primaryColor = ApolloCore.ColorBrandPrimary; // #fa4616
const spacing = ApolloCore.SpacingMd;
const fontFamily = ApolloCore.FontFamilyBase;
```

### CSS Variables

```css
@import '@uipath/apollo-core/tokens/css/theme-variables.css';

.my-component {
  color: var(--color-primary);
  padding: var(--spacing-md);
  font-family: var(--font-family-base);
  background: var(--color-background);
}
```

## Scripts

```bash
pnpm build              # Build tokens and fonts, then bundle
pnpm build:tokens       # Build design tokens only
pnpm build:fonts        # Build font stylesheets only
```

## Package Exports

```typescript
// Main export - design tokens
import * as ApolloCore from '@uipath/apollo-core';

// Tokens only
import * as Tokens from '@uipath/apollo-core/tokens';

// CSS variables
import '@uipath/apollo-core/tokens/css/theme-variables.css';

// Deprecated - moved to @uipath/apollo-ui-icons, removed in the next major
import { iconNames } from '@uipath/apollo-core/icons';
import iconSvg from '@uipath/apollo-core/icons/svg/add.svg';
```

## Icons

The icon set lives in [`@uipath/apollo-ui-icons`](../apollo-ui-icons). Import from
it directly:

```typescript
import { Close, AddComment } from '@uipath/apollo-ui-icons';
import closeSvg from '@uipath/apollo-ui-icons/svg/close.svg';
import { type IconName, iconNames } from '@uipath/apollo-ui-icons/types';
```

`@uipath/apollo-core/icons` and `@uipath/apollo-core/icons/svg/*` still resolve,
re-exporting the package above, but they are **deprecated and will be removed in
the next major**. Migrate to the specifiers shown here.

## Framework Packages

Apollo Core is framework-agnostic. For framework-specific components:

- **React**: `@uipath/apollo-react`
- **Tailwind**: `@uipath/apollo-wind`
- **Icons**: `@uipath/apollo-ui-icons`

## Directory Structure

```
apollo-core/
├── src/
│   ├── tokens/           # Design tokens (colors, spacing, etc.)
│   └── fonts/            # Font assets
├── scripts/
│   └── build-tokens.js        # Token generation
└── dist/                 # Built output
    ├── tokens/           # Generated token files (CSS, JSS, LESS, SCSS)
    └── fonts/            # Font files
```

## License

MIT
