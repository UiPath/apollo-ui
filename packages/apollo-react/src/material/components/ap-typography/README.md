# ApTypography

A lightweight wrapper around MUI Typography that applies Apollo design tokens.

## Overview

This component leverages MUI5's built-in Typography capabilities while applying Apollo design system tokens. It's a thin wrapper that:

- Maps Apollo `FontVariantToken` to appropriate MUI variants and semantic HTML elements
- Applies Apollo typography tokens (font-family, size, weight, line-height) via `sx` prop
- Passes through all MUI Typography props (color, align, sx, etc.)
- Lets MUI handle semantic HTML rendering and accessibility

## Usage

```tsx
import { ApTypography } from '@uipath/apollo-react/material/components';
import { FontVariantToken } from '@uipath/apollo-react/core';

// Heading (automatically renders as <h1>)
<ApTypography variant={FontVariantToken.fontSizeH1}>
  Page Title
</ApTypography>

// Body text with MUI props
<ApTypography
  variant={FontVariantToken.fontSizeM}
  color="primary"
  align="center"
>
  Centered text
</ApTypography>

// Custom styling with sx prop
<ApTypography
  variant={FontVariantToken.fontSizeLBold}
  sx={{ mt: 2, color: 'error.main' }}
>
  Custom styled text
</ApTypography>
```

## Variant Mapping

Apollo variants map to MUI variants and HTML elements:

| Apollo Variant                           | MUI Variant | HTML Element |
| ---------------------------------------- | ----------- | ------------ |
| fontSizeH1, fontSizeH1Bold, fontSizeHero | h1          | `<h1>`       |
| fontSizeH2, fontSizeH2Bold               | h2          | `<h2>`       |
| fontSizeH3, fontSizeH3Bold               | h3          | `<h3>`       |
| fontSizeH4, fontSizeH4Bold, fontBrandH4  | h4          | `<h4>`       |
| fontSizeL, fontSizeLBold, fontBrandL     | body1       | `<p>`        |
| fontSizeM, fontSizeMBold, fontSizeLink   | body2       | `<span>`     |
| fontSizeS, fontSizeXs (and Bold)         | caption     | `<span>`     |
| fontMono\*                               | body2       | `<code>`     |

## Props

Extends all [MUI Typography props](https://mui.com/material-ui/api/typography/) with:

- `variant`: Apollo `FontVariantToken` (required)
- `display`: 'inline' | 'block' | 'inline-block' (optional)

All other MUI props work as expected: `color`, `align`, `sx`, `component`, etc.

## Design Decision

This component is intentionally minimal to leverage MUI's robust Typography system. Apollo design tokens are applied via the `sx` prop, allowing them to override theme defaults while preserving MUI's functionality.
