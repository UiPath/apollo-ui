# @uipath/apollo-core

Core design tokens, icons, and fonts for the Apollo Design System.

## Overview

Apollo Core provides the foundational design elements for the UiPath Apollo Design System:

- **Design Tokens**: Colors, typography, spacing, shadows, borders, and more
- **Icons**: 1300+ SVG icons for UI and activities
- **Fonts**: Typography assets

## Installation

```bash
npm install @uipath/apollo-core
# or
pnpm add @uipath/apollo-core
# or
yarn add @uipath/apollo-core
```

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

### Icons

Icons are available as raw SVG files:

```typescript
import iconSvg from '@uipath/apollo-core/icons/svg/action/add.svg';
```

For React components, use `@uipath/apollo-react`:

```typescript
import { ActionAdd } from '@uipath/apollo-react/icons';
```

## Icons

### ⚠️ **IMPORTANT: TEMPORARY ICON NAMES**

> **🚨 WARNING: Icon names are subject to change!**
>
> The current icon naming structure is **TEMPORARY** and auto-generated from the Figma export. These names will change once the design team provides the official, standardized icon names and structure.
>
> **DO NOT rely on current icon names in production code.** Use at your own risk, as breaking changes to icon names are expected.
>
> **What's changing:**
> - Icon file names
> - Icon component names (e.g., `<Close />`, `<AlertError />`)
> - Folder structure (currently nested, might become flat)
> - Icon categorization
>
> **Timeline:** Pending design team's Figma restructure and naming standards

---

### Source

All icons are exported from the official Apollo Icons Figma file:

**[Apollo Icons - Figma Design](https://www.figma.com/design/ejTd2JOd1BOEXTIp2TCtpr/Apollo--Icons-?node-id=2-1045&m=dev)**

### Current Structure (TEMPORARY)

The icon library contains **1,317 icons** organized into categories:

- `action/` - Action icons (add, delete, edit, etc.)
- `editor/` - Editor-specific icons
- `indicator-and-alert/` - Status and notification icons
- `logic/` - Workflow and logic icons
- `navigation/` - Navigation controls
- `object/` - Object representations
- `social/` - Social media icons
- `studio-icons/` - UiPath Studio-specific icons
- `toggle/` - Toggle and selection controls
- `third-party/` - Third-party service logos
- `ui-bpmn-canvas/` - BPMN diagram elements
- `studio-activities-icon-sets/` - Activity icons for automation

### Naming Convention (TEMPORARY)

All icon files and folders follow **kebab-case** naming:

- Files: `alert-error.svg`, `close.svg`, `add-comment.svg`
- Folders: `indicator-and-alert/`, `ui-bpmn-canvas/`

Icon names are automatically shortened from their original Figma export names:
- `action/close-clear-cancel-event-cancel-throwing-remove.svg` → `close`
- `action/add-comment-annotate.svg` → `add-comment`
- `navigation/chevron/down.svg` → `chevron-down`

**Nested Folder Prefix Rule**: Icons in subfolders (more than 2 levels deep) automatically get their immediate parent folder as a prefix for consistency:
- Files directly in top-level folders have NO prefix: `action/close.svg` → `close`
- Files in subfolders get their parent prefix: `editor/layout-align/horizontal-center.svg` → `layout-align-horizontal-center`
- Examples:
  - `action/add-comment.svg` → `add-comment` (no prefix)
  - `editor/blur.svg` → `blur` (no prefix)
  - `editor/layout-align/horizontal-center.svg` → `layout-align-horizontal-center` (has prefix)
  - `navigation/chevron/down.svg` → `chevron-down` (has prefix)
  - `toggle/visibility/off.svg` → `visibility-off` (has prefix)
- Exception: `studio-activities-icon-sets/` uses special category-based naming

This structure was auto-resolved from the Figma export to ensure:
- URL-safe paths
- Valid JavaScript identifiers when converted to components
- Consistent, readable naming throughout
- No duplicate names (1,317 unique names for 1,317 icons)
- Organized structure with logical parent-child relationships

### Export Process

**Current Workflow** (TEMPORARY):
1. Manual export from Figma
2. Place SVG files in `src/icons/svg/`
3. Run `pnpm process:icons` - Complete processing pipeline:
   - Normalizes filenames (removes emojis, fixes casing, handles nested folders)
   - Generates path mappings
   - Creates short, intuitive names
   - Renames SVG files to short names
   - Regenerates path mappings with new names
4. Run `pnpm build:icons` - Creates TypeScript components

**Simplified**: Use `pnpm process:icons:dry-run` to preview changes before running `pnpm process:icons`

**Future Workflow** (waiting on design team):
1. Export from Figma with proper names
2. Simple build process - no normalization needed

**In Progress**: Design team is working on:
- ✅ Flat icon list (no nested directories)
- ✅ Improved, standardized icon names at the source
- ✅ Simplified export workflow
- ✅ Proper icon categorization and naming standards

Once the Figma restructure is complete, the current temporary naming and normalization process will be replaced with the official design system standards.

## Scripts

### Build

```bash
pnpm build              # Build all tokens and icons
pnpm build:tokens       # Build design tokens only
pnpm build:icons        # Generate icon exports and types
```

### Icon Management

```bash
# 🎯 RECOMMENDED: Complete icon processing workflow
pnpm process-icons            # Process icons: scan → generate short names → rename files
pnpm process-icons:dry-run    # Preview all changes without making them
```

**Complete workflow after Figma export**:
```bash
cd packages/apollo-core

# 1. Preview changes (recommended first step)
pnpm process-icons:dry-run

# 2. Process icons (scan, generate names, rename files)
pnpm process-icons

# 3. Build icon TypeScript exports
pnpm build:icons

# 4. Build the package
pnpm build
```

## Package Exports

```typescript
// Main export - design tokens
import * as ApolloCore from '@uipath/apollo-core';

// Tokens only
import * as Tokens from '@uipath/apollo-core/tokens';

// Icon types and names
import { IconName, iconNames } from '@uipath/apollo-core/icons';

// Raw SVG files
import iconSvg from '@uipath/apollo-core/icons/svg/action/add.svg';

// CSS variables
import '@uipath/apollo-core/tokens/css/theme-variables.css';
```

## Framework Packages

Apollo Core is framework-agnostic. For framework-specific components:

- **React**: `@uipath/apollo-react`
- **Angular**: `@uipath/apollo-angular`
- **Tailwind**: `@uipath/apollo-wind`

## Directory Structure

```
apollo-core/
├── src/
│   ├── tokens/           # Design tokens (colors, spacing, etc.)
│   ├── icons/
│   │   ├── svg/          # Raw SVG icon files
│   │   ├── index.ts      # Icon exports
│   │   └── types.ts      # Icon type definitions
│   └── fonts/            # Font assets
├── scripts/
│   ├── build-tokens.js              # Token generation
│   ├── generate-icons.ts            # Icon export generation
│   └── rename-icon-structure.ts    # Icon naming normalization
└── dist/                 # Built output
    ├── tokens/           # Generated token files
    ├── icons/            # Icon types and SVG files
    └── fonts/            # Font files
```

## Contributing

### Adding or Updating Icons (TEMPORARY WORKFLOW)

> **Note:** This workflow is temporary and will be simplified once the design team finalizes the icon naming standards in Figma.

1. Export from the [official Figma file](https://www.figma.com/design/ejTd2JOd1BOEXTIp2TCtpr/Apollo--Icons-?node-id=2-1045&m=dev)
2. Place SVG files in `src/icons/svg/`
3. Process the icons:
   ```bash
   cd packages/apollo-core

   # Preview all changes first (recommended)
   pnpm process-icons:dry-run

   # Process icons (scan, generate names, rename files)
   pnpm process-icons

   # Build icon TypeScript exports
   pnpm build:icons
   ```
4. Verify the changes:
   - Check that SVG files have been renamed to short names
   - Review the generated `src/icons/index.ts` exports
5. Commit changes with updated icon exports

### ⚠️ Remember

- Icon names generated by this workflow are **TEMPORARY**
- Icon names **will change** when official naming is provided
- Document any icon name changes in your commit messages
- Test icon usage in dependent packages after updates

## License

MIT
