# React Playground - Development Guide

This document captures the patterns, conventions, and best practices for developing the Apollo React Playground application.

## Project Overview

The React Playground is a showcase application for the Apollo Design System, demonstrating design tokens (colors, typography, spacing, shadows, borders, icons, breakpoints) through interactive visualizations.

## Technology Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Styled-Components 6** - CSS-in-JS styling solution
- **React Router DOM 7** - Client-side routing
- **Rsbuild** - Build tool
- **@uipath/apollo-react** - Apollo Design System tokens

## Architecture & File Structure

```
src/
├── components/
│   └── SharedStyles.tsx          # Shared styled components across pages
├── pages/
│   ├── MainHome.tsx              # Main landing page
│   ├── MainHome.styles.tsx       # Styles for MainHome
│   ├── CoreHome.tsx              # Core tokens landing page
│   ├── CoreHome.styles.tsx       # Styles for CoreHome
│   ├── Colors.tsx                # Colors showcase
│   ├── Colors.styles.tsx         # Styles for Colors
│   ├── Fonts.tsx                 # Typography showcase
│   ├── Fonts.styles.tsx          # Styles for Fonts
│   ├── Spacing.tsx               # Spacing/Padding showcase
│   ├── Spacing.styles.tsx        # Styles for Spacing
│   ├── Shadows.tsx               # Shadows showcase
│   ├── Shadows.styles.tsx        # Styles for Shadows
│   ├── Borders.tsx               # Borders/Strokes showcase
│   ├── Borders.styles.tsx        # Styles for Borders
│   ├── Icons.tsx                 # Icons showcase
│   ├── Icons.styles.tsx          # Styles for Icons
│   ├── Screens.tsx               # Breakpoints showcase
│   └── Screens.styles.tsx        # Styles for Screens
├── App.tsx                       # Main app with routing
└── index.css                     # Global CSS reset
```

## Styling Patterns

### Component-Specific .styles.tsx Pattern

**All page components follow this pattern:**

1. **Create a separate `.styles.tsx` file** alongside each component
2. **Export all styled components** from the styles file
3. **Import and use** styled components in the main component file

**Example Structure:**

```typescript
// MyPage.styles.tsx
import styled from 'styled-components';
import * as ApolloCore from '@uipath/apollo-react/core';

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
`;

export const Card = styled.div<{ $isDark?: boolean }>`
  background: ${props => props.$isDark ? '#333' : 'white'};
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
`;

// MyPage.tsx
import { PageContainer, PageTitle } from '../components/SharedStyles';
import { Grid, Card } from './MyPage.styles';

export function MyPage() {
  return (
    <PageContainer>
      <PageTitle>My Page</PageTitle>
      <Grid>
        <Card>Content</Card>
      </Grid>
    </PageContainer>
  );
}
```

### Transient Props ($-prefix)

**Always use the `$` prefix for props that should NOT be passed to the DOM:**

```typescript
// ✅ CORRECT - Using transient props
export const Box = styled.div<{ $color: string; $size: string }>`
  background: ${props => props.$color};
  width: ${props => props.$size};
  height: ${props => props.$size};
`;

// Usage
<Box $color="#fa4616" $size="50px" />

// ❌ INCORRECT - Will cause React warnings
export const Box = styled.div<{ color: string; size: string }>`
  background: ${props => props.color};
  width: ${props => props.size};
`;

// This will pass 'color' and 'size' to DOM, causing warnings
<Box color="#fa4616" size="50px" />
```

### Shared Styles

Import common components from `SharedStyles.tsx`:

```typescript
import {
  PageContainer, // Main page wrapper
  PageTitle, // Page title (h1)
  PageDescription, // Page description
  SectionHeader, // Section header (h2)
  SectionDescription, // Section description
  Card, // Basic card component
  TokenName, // Token name styling
  TokenValue, // Token value styling
} from '../components/SharedStyles';
```

### Hover Effects

**Prefer CSS hover effects over JavaScript event handlers:**

```typescript
// ✅ CORRECT - CSS hover
export const Card = styled.div`
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: ${ApolloCore.ColorPrimaryLight};
  }
`;

// ❌ AVOID - JavaScript hover handlers for simple hover effects
<div
  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)' }}
  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
>
```

**Exception:** Use JavaScript handlers when you need dynamic behavior based on state or conditions.

### Apollo Design Tokens & CSS Variables

Always use CSS variables for theme-aware styling and design tokens from `@uipath/apollo-react/core` for TypeScript access:

#### CSS Variables (Preferred for Styling)

**Theme-Agnostic Variables** - These automatically adapt to light/dark mode:

```typescript
// ✅ CORRECT - Use theme-agnostic CSS variables
export const Card = styled.div`
  background: var(--color-background);
  color: var(--color-foreground-emp);
  border: 2px solid var(--color-border);
`;

// ❌ INCORRECT - Don't use suffixed variables
export const Card = styled.div`
  background: var(--color-background-light);
  color: var(--color-foreground-emp-light);

  body.dark-theme & {
    background: var(--color-background-dark);
    color: var(--color-foreground-emp-dark);
  }
`;
```

**Common CSS Variables:**

```css
/* Backgrounds */
--color-background           /* Main background */
--color-background-inverse   /* Inverse of background (for contrast) */
--color-background-hover     /* Hover state background */
--color-background-selected  /* Selected state background */

/* Foreground/Text */
--color-foreground-emp       /* Emphasized text */
--color-foreground-de-emp    /* De-emphasized text */
--color-foreground           /* Regular text */

/* Brand Colors */
--color-brand-primary        /* UiPath orange (#fa4616) - FIXED, doesn't change with theme */
--color-primary              /* Theme-aware primary color */
--color-secondary            /* Purple (#764ba2) - custom variable */

/* Borders */
--color-border               /* Standard border color */

/* Special Colors */
--color-white                /* Pure white - FIXED */
--color-black                /* Pure black - FIXED */

/* Shadows */
--shadow-xs, --shadow-sm, --shadow-md, --shadow-lg, --shadow-xl
--shadow-hover-primary, --shadow-hover-md
```

#### TypeScript Tokens (For JS Logic)

```typescript
import * as ApolloCore from '@uipath/apollo-react/core';

// Use for JavaScript logic, not for styling
const primaryColor = ApolloCore.ColorBrandPrimary; // #fa4616

// Spacing
ApolloCore.SpacingMd;
ApolloCore.PaddingLg;

// Typography
ApolloCore.FontFamilyBase;
ApolloCore.FontSizeH1;
ApolloCore.FontWeightBold;
```

#### Color Usage Guidelines

**When to use `--color-brand-primary` vs `--color-primary`:**

```typescript
// ✅ Use --color-brand-primary ONLY for:
// 1. Main page titles (MainHome, CoreHome)
export const MainTitle = styled.h1`
  background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

// ✅ Use --color-primary for everything else:
// - Section headers
// - Borders on hover
// - Icon colors
// - Focus states
// - Accent colors
export const SectionHeader = styled.h2`
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-border);
`;

export const Card = styled.div`
  &:hover {
    border-color: var(--color-primary);
  }
`;
```

#### Fixed vs Theme-Aware Colors

**Fixed colors** (don't change with theme):

- `--color-brand-primary` - Always UiPath orange
- `--color-white` - Always white (#ffffff)
- `--color-black` - Always black (#000000)
- `--color-secondary` - Always purple (#764ba2)

**Theme-aware colors** (adapt to light/dark mode):

- `--color-primary` - Changes based on theme
- `--color-background` - Light in light mode, dark in dark mode
- `--color-foreground-*` - Text colors that adapt
- `--color-border` - Border colors that adapt

#### Custom Variables File

Custom CSS variables that aren't in Apollo tokens are defined in `src/custom-variables.css`:

```css
/* Custom CSS variables for shadows and other rgba values not in Apollo tokens */
:root {
  --color-secondary: #764ba2;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  /* ... more custom variables */
}
```

Import in `src/index.css`:

```css
@import '@uipath/apollo-react/core/tokens/css/theme-variables.css';
@import './custom-variables.css';
```

## Page Structure Pattern

All showcase pages follow this consistent structure:

```typescript
import * as ApolloCore from '@uipath/apollo-react/core';
import { PageContainer, PageTitle, PageDescription } from '../components/SharedStyles';
import { /* page-specific styles */ } from './MyPage.styles';

export function MyPage() {
  // 1. Data extraction from ApolloCore
  const tokens = Object.entries(ApolloCore)
    .filter(([key]) => key.startsWith('TokenPrefix'))
    .map(([name, value]) => ({ name, value: value as string }));

  // 2. Data processing/sorting if needed
  const sortedTokens = tokens.sort((a, b) => /* sorting logic */);

  // 3. Render
  return (
    <PageContainer>
      <PageTitle>Page Title</PageTitle>
      <PageDescription>
        Description ({tokens.length} tokens)
      </PageDescription>

      {/* Content sections */}
    </PageContainer>
  );
}
```

## Consistent Header Styling

All section headers follow this pattern:

```typescript
<SectionHeader>Section Title</SectionHeader>
<SectionDescription>Section description text</SectionDescription>
```

**Shared header styles** (from SharedStyles.tsx):

- Section headers: 24px font, bottom border, 12px padding bottom
- Section descriptions: 14px font, 666 color, 24px bottom margin

## Responsive Grid Patterns

Use consistent grid layouts:

```typescript
// Flexible grid with minimum widths
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
`;

// Adaptive grid
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
`;
```

## Color Gradients

Use consistent gradient patterns for Apollo branding:

```typescript
// Main brand gradient (for main page titles)
background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-secondary) 100%);

// For text gradients (main page titles only)
background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-secondary) 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;

// For decorative elements (shadows, icons, etc.)
background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-secondary) 100%);
```

## Special Component Patterns

### Color Swatches (Colors Page)

When displaying color swatches, use fixed colors for text to ensure visibility:

```typescript
// ✅ CORRECT - Use fixed colors for text on color swatches
const textColor = isLight ? "var(--color-black)" : "var(--color-white)";

// The color swatch background uses the actual token value
<ColorCard $bgColor={colorValue}>
  <ColorName $textColor={textColor}>{name}</ColorName>
  <ColorValue $textColor={textColor}>{colorValue}</ColorValue>
</ColorCard>

// ❌ INCORRECT - Don't use theme-aware colors on swatches
const textColor = isLight
  ? "var(--color-foreground-emp)"  // Wrong! Will be dark in dark mode
  : "var(--color-background)";     // Wrong! Will match background
```

### Shadow Demonstrations (Shadows Page)

Use contrasting backgrounds to make shadows visible:

```typescript
// ✅ CORRECT - Use gradient for contrast
export const ShadowBox = styled.div<{ $shadowValue: string }>`
  background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-secondary) 100%);
  box-shadow: ${(props) => props.$shadowValue};
`;

// ❌ INCORRECT - Theme colors may not show shadows well
export const ShadowBox = styled.div<{ $shadowValue: string }>`
  background: var(--color-background); // Poor contrast in dark mode
  box-shadow: ${(props) => props.$shadowValue};
`;
```

### Search Inputs

Ensure search inputs have proper theme support:

```typescript
// ✅ CORRECT - Include background and color
<input
  style={{
    background: "var(--color-background)",
    color: "var(--color-foreground-emp)",
    border: "2px solid var(--color-border)",
    // ... other styles
  }}
/>

// Or use styled component
export const SearchInput = styled.input`
  background: var(--color-background);
  color: var(--color-foreground-emp);
  border: 2px solid var(--color-border);

  &:focus {
    border-color: var(--color-primary);
  }
`;
```

## React Router Integration

For styled Link components:

```typescript
import { Link } from 'react-router-dom';
import styled from 'styled-components';

export const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;

  &:hover {
    /* hover styles */
  }
`;
```

## TypeScript Conventions

### Type Definitions

```typescript
// Font token example
type FontToken = {
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  fontWeight?: number | string;
  letterSpacing?: string;
};

// Styled component props
type CardProps = {
  $isDark?: boolean;
  $color?: string;
};
```

### Token Extraction Pattern

```typescript
const tokens = Object.entries(ApolloCore)
  .filter(([key]) => key.startsWith('Prefix'))
  .map(([name, value]) => ({
    name,
    value: value as string, // or appropriate type
  }));
```

## Search & Filter Patterns

For searchable pages (like Colors):

```typescript
const [searchTerm, setSearchTerm] = useState('');

// Filter logic
const filteredItems = !searchTerm
  ? items
  : items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

// Render search input
<SearchInput
  type="text"
  placeholder="Search..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

## Interactive Features

### Copy to Clipboard

```typescript
<ColorCard
  onClick={() => {
    navigator.clipboard.writeText(colorValue);
    alert(`Copied ${colorValue} to clipboard!`);
  }}
  title={`Click to copy: ${colorValue}`}
>
  {/* content */}
</ColorCard>
```

### Conditional Rendering

```typescript
{items.length > 0 && (
  <section>
    <SectionHeader>Title</SectionHeader>
    <SectionDescription>Description</SectionDescription>
    {/* content */}
  </section>
)}
```

## Best Practices

### DO's

✅ **Use separate .styles.tsx files** for all components
✅ **Use transient props ($prefix)** for dynamic styled component props
✅ **Import shared styles** from SharedStyles.tsx where applicable
✅ **Use theme-agnostic CSS variables** (e.g., `var(--color-background)`) instead of suffixed ones
✅ **Use `--color-primary` for most UI elements**, reserve `--color-brand-primary` for main page titles only
✅ **Use fixed colors** (`--color-white`, `--color-black`) for text on color swatches
✅ **Include background and color** properties on all input elements for theme support
✅ **Maintain consistent header styling** across all pages
✅ **Use CSS hover effects** for simple interactions
✅ **Follow TypeScript best practices** with proper typing
✅ **Keep component logic clean** - separate data processing from rendering
✅ **Use semantic component names** (Grid, Card, TokenName, etc.)
✅ **Use gradients** (brand-primary → secondary) for visual elements needing high contrast

### DON'Ts

❌ **Don't use inline styles** in component JSX (except for inline search inputs with proper theme support)
❌ **Don't use non-transient props** for dynamic styling
❌ **Don't hard-code colors, spacing, fonts** - use CSS variables or design tokens
❌ **Don't use suffixed CSS variables** (e.g., `--color-background-light`) - use theme-agnostic ones
❌ **Don't use theme-aware colors** for text on color swatches (they won't be visible in dark mode)
❌ **Don't use `--color-brand-primary`** everywhere - it's ONLY for main page titles
❌ **Don't forget background/color** properties on input elements
❌ **Don't mix styling approaches** - stick to styled-components
❌ **Don't pass DOM-invalid props** without the $ prefix
❌ **Don't use JavaScript for simple hover effects** - use CSS
❌ **Don't create components without proper TypeScript types**
❌ **Don't duplicate shared styles** - use SharedStyles.tsx
❌ **Don't use custom variables** that already exist in Apollo tokens

## Common Components Reference

### From SharedStyles.tsx

- `PageContainer` - Main page wrapper (40px padding, 1400px max-width)
- `PageTitle` - H1 title (36px font)
- `PageDescription` - Subtitle (16px font, #666 color)
- `SectionHeader` - H2 header (24px font, bottom border)
- `SectionDescription` - Section subtitle (14px font)
- `Card` - Basic card with hover effect
- `TokenName` - Token name styling (bold, primary color)
- `TokenValue` - Token value styling (code, gray color)

## File Naming Conventions

- Component files: `PascalCase.tsx` (e.g., `CoreHome.tsx`)
- Style files: `PascalCase.styles.tsx` (e.g., `CoreHome.styles.tsx`)
- Shared utilities: `camelCase.ts`

## Git Commit Messages

Follow semantic commit conventions:

```
feat: add new Typography showcase page
fix: correct hover effect on color cards
refactor: extract shared styles to SharedStyles.tsx
style: update spacing in Icons page
docs: update CLAUDE.md with new patterns
```

## Development Workflow

1. Create `.styles.tsx` file first
2. Define all styled components
3. Create/update main `.tsx` component
4. Import and use styled components
5. Test in browser
6. Ensure responsive behavior
7. Commit with descriptive message

## Performance Considerations

- Styled-components are automatically optimized
- Use React.memo() for expensive renders
- Avoid inline functions in render when possible
- Use transient props to avoid unnecessary re-renders

## Future Contributions

When adding new pages or components:

1. **Follow the `.styles.tsx` pattern** - Always create a separate styles file
2. **Use shared components** - Check SharedStyles.tsx first
3. **Use transient props** - Prefix with `$` for dynamic props
4. **Maintain consistency** - Follow existing header/section patterns
5. **Use design tokens** - Import from ApolloCore
6. **Add TypeScript types** - Properly type all props and data
7. **Test responsiveness** - Ensure mobile/tablet/desktop compatibility
8. **Update this guide** - Document new patterns or conventions

## Resources

- [Styled-Components Docs](https://styled-components.com/)
- [React Router Docs](https://reactrouter.com/)
- [TypeScript Docs](https://www.typescriptlang.org/)
- [Apollo Design System](https://github.com/UiPath/apollo-ui)

---

**Last Updated:** 2025-01-20

For questions or suggestions, please open an issue in the repository.
