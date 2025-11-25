# ApIcon Component

A type-safe icon component for the Apollo Design System that renders SVG icons from `@uipath/apollo-core/icons`.

## Features

- **Fully typed icon names** - TypeScript autocomplete for all 1,094+ icons
- **Lazy loaded** - Icons are loaded on-demand using dynamic imports
- **Optimized bundle** - Only used icons are loaded (99%+ bundle size reduction)
- **Customizable** - Control size, color, and styles
- **Accessible** - Built-in ARIA attributes and screen reader support
- **Flexible sizing** - Accept pixel values or CSS units
- **Interactive** - Optional click handlers with proper role assignment
- **Suspense support** - Show loading states while icons load

## Basic Usage

```tsx
import { ApIcon } from '@uipath/apollo-react/components';

// Simple icon
<ApIcon name="AlertError" />

// Custom size and color
<ApIcon name="ArrowLeft" size={32} color="#FF0000" />

// With CSS color variables
<ApIcon name="Academy" color="var(--color-primary-500)" />

// Custom size units
<ApIcon name="Settings" size="2rem" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `IconName` | **required** | Name of the icon from apollo-core (fully typed) |
| `size` | `number \| string` | `24` | Size in pixels (number) or CSS unit (string) |
| `color` | `string` | `'currentColor'` | Icon color (any valid CSS color) |
| `className` | `string` | - | CSS class for custom styling |
| `style` | `React.CSSProperties` | - | Inline styles |
| `ariaLabel` | `string` | - | Accessible label for screen readers |
| `decorative` | `boolean` | `false` | If true, hides icon from screen readers |
| `title` | `string` | - | Tooltip text on hover |
| `onClick` | `(event) => void` | - | Click handler (adds pointer cursor & button role) |
| `testId` | `string` | - | Test ID for testing |
| `fallback` | `React.ReactNode` | `null` | Fallback UI while icon is loading |

## Examples

### Responsive Sizing

```tsx
<ApIcon name="Menu" size={16} />  {/* Small */}
<ApIcon name="Menu" size={24} />  {/* Default */}
<ApIcon name="Menu" size={32} />  {/* Large */}
<ApIcon name="Menu" size="3em" /> {/* Relative to font size */}
```

### Color Options

```tsx
{/* Current text color */}
<ApIcon name="AlertSuccess" color="currentColor" />

{/* Hex color */}
<ApIcon name="AlertError" color="#E53935" />

{/* CSS variable */}
<ApIcon name="AlertWarning" color="var(--color-warning-500)" />

{/* Named color */}
<ApIcon name="AlertInfo" color="blue" />
```

### Interactive Icons

```tsx
<ApIcon
  name="Settings"
  size={24}
  onClick={() => console.log('Settings clicked')}
  title="Open settings"
  ariaLabel="Settings button"
/>
```

### Decorative Icons

```tsx
{/* Icon next to text - hide from screen readers */}
<button>
  <ApIcon name="Save" decorative />
  <span>Save Changes</span>
</button>
```

### Custom Styling

```tsx
<ApIcon
  name="Home"
  className="custom-icon"
  style={{
    margin: '0 8px',
    transition: 'color 0.2s',
  }}
/>
```

### Using with Material UI

```tsx
import { IconButton } from '@mui/material';
import { ApIcon } from '@uipath/apollo-react/components';

<IconButton>
  <ApIcon name="Delete" color="error.main" />
</IconButton>
```

## TypeScript Support

The `IconName` type provides autocomplete for all available icons:

```tsx
import type { IconName } from '@uipath/apollo-react/components';

// Type-safe icon name
const iconName: IconName = 'AlertError'; // ✓
const invalid: IconName = 'NotAnIcon';   // ✗ TypeScript error

// Use in your components
interface MyComponentProps {
  icon: IconName;
}

function MyComponent({ icon }: MyComponentProps) {
  return <ApIcon name={icon} />;
}
```

## Available Icons

All icons from `@uipath/apollo-core/icons` are available. The icon names are automatically generated from the icon files and kept in sync.

To see all available icons, import the `iconNames` array:

```tsx
import { iconNames } from '@uipath/apollo-react/components';

console.log(iconNames); // Array of all icon names
```

## Accessibility

ApIcon includes built-in accessibility features:

```tsx
{/* Decorative icon - hidden from screen readers */}
<ApIcon name="Star" decorative />

{/* Meaningful icon - includes aria-label */}
<ApIcon name="Save" ariaLabel="Save document" />

{/* Interactive icon - includes button role and label */}
<ApIcon
  name="Close"
  onClick={handleClose}
  ariaLabel="Close dialog"
/>
```

## Performance

- **Lazy loaded**: Icons are loaded on-demand using dynamic imports
- **Drastically smaller bundles**: 99%+ reduction (2.7 KB vs 10+ MB)
- **Code splitting**: Each icon becomes a separate chunk
- **Browser caching**: Individual icon chunks are cached efficiently
- **Optimized SVG**: Icons are loaded as inline SVG for best performance

### Loading Behavior

Icons load asynchronously when first rendered. You can provide a fallback:

```tsx
<ApIcon
  name="AlertError"
  fallback={<div style={{ width: 24, height: 24 }} />}
/>
```

Or wrap multiple icons in a Suspense boundary:

```tsx
<Suspense fallback={<div>Loading icons...</div>}>
  <ApIcon name="Home" />
  <ApIcon name="Settings" />
  <ApIcon name="User" />
</Suspense>
```

## Notes

- Icons default to `currentColor`, so they inherit text color by default
- Size can be a number (treated as pixels) or a string with units
- The component uses `dangerouslySetInnerHTML` to render SVG content - this is safe as icons come from the trusted apollo-core package
- When using onClick, the component automatically adds `role="button"` and `cursor: pointer`
