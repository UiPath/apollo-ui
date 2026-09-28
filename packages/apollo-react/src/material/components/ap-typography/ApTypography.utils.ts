import type { Variant } from '@mui/material/styles/createTypography';
import { FontVariantToken } from '@uipath/apollo-core';
import type { ElementType } from 'react';

import type { ApTypographyVariant } from './ApTypography.types';

/**
 * Maps Apollo FontVariantToken to MUI variant and component
 */
export function getVariantMapping(variant: ApTypographyVariant): {
  muiVariant: Variant;
  component: ElementType;
} {
  // Map heading variants to MUI h1-h4
  switch (variant) {
    case FontVariantToken.fontSizeHero:
    case FontVariantToken.fontSizeHeroBold:
    case FontVariantToken.fontSizeH1:
    case FontVariantToken.fontSizeH1Bold:
      return { muiVariant: 'h1', component: 'h1' };

    case FontVariantToken.fontSizeH2:
    case FontVariantToken.fontSizeH2Bold:
      return { muiVariant: 'h2', component: 'h2' };

    case FontVariantToken.fontSizeH3:
    case FontVariantToken.fontSizeH3Bold:
      return { muiVariant: 'h3', component: 'h3' };

    case FontVariantToken.fontSizeH4:
    case FontVariantToken.fontSizeH4Bold:
    case FontVariantToken.fontBrandH4:
      return { muiVariant: 'h4', component: 'h4' };

    // Body text variants
    case FontVariantToken.fontSizeL:
    case FontVariantToken.fontSizeLBold:
    case FontVariantToken.fontBrandL:
      return { muiVariant: 'body1', component: 'p' };

    case FontVariantToken.fontSizeM:
    case FontVariantToken.fontSizeMBold:
    case FontVariantToken.fontBrandM:
    case FontVariantToken.fontSizeLink:
      return { muiVariant: 'body2', component: 'span' };

    // Small text variants
    case FontVariantToken.fontSizeS:
    case FontVariantToken.fontSizeSBold:
    case FontVariantToken.fontSizeXs:
    case FontVariantToken.fontSizeXsBold:
      return { muiVariant: 'caption', component: 'span' };

    // Monospace variants - use body2 but component will apply font
    case FontVariantToken.fontMonoM:
    case FontVariantToken.fontMonoMBold:
    case FontVariantToken.fontMonoS:
    case FontVariantToken.fontMonoSBold:
    case FontVariantToken.fontMonoXS:
    case FontVariantToken.fontMonoXSBold:
      return { muiVariant: 'body2', component: 'code' };

    default:
      return { muiVariant: 'body1', component: 'span' };
  }
}
