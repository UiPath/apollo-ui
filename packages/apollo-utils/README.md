# @uipath/apollo-utils

Shared utilities and helper functions for the Apollo Design System.

## Overview

`apollo-utils` provides framework-agnostic utility functions and helpers used across all Apollo packages.

## Installation

```bash
npm install @uipath/apollo-utils
# or
pnpm add @uipath/apollo-utils
# or
yarn add @uipath/apollo-utils
```

## Usage

### Formatting Utilities

```typescript
import { formatDate, formatNumber, formatCurrency } from '@uipath/apollo-utils';

const formattedDate = formatDate(new Date(), 'MM/DD/YYYY');
const formattedNumber = formatNumber(1234567.89);
const formattedCurrency = formatCurrency(99.99, 'USD');
```

### Accessibility Helpers

```typescript
import { generateId, getFocusableElements, trapFocus } from '@uipath/apollo-utils';

const uniqueId = generateId('button');
const focusableElements = getFocusableElements(containerElement);
```

### Common Helpers

```typescript
import { debounce, throttle, classNames } from '@uipath/apollo-utils';

const debouncedFn = debounce(() => console.log('Called!'), 300);
const throttledFn = throttle(() => console.log('Called!'), 300);
const classes = classNames('base', { active: isActive }, 'additional');
```

## Utility Categories

- **Formatting**: Date, number, and currency formatting
- **Accessibility**: ARIA helpers, focus management, keyboard navigation
- **Common**: Debounce, throttle, class name utilities

## License

MIT
