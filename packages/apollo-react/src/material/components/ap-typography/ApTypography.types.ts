import { FontVariantToken } from '@uipath/apollo-core';
import { TypographyProps as MuiTypographyProps } from '@mui/material/Typography';

export type ApTypographyVariant = FontVariantToken | `${FontVariantToken}`;

export interface ApTypographyProps extends Omit<MuiTypographyProps, 'variant'> {
  /**
   * Apollo typography variant to apply
   * Maps to Apollo design tokens and determines the semantic HTML element
   * @default FontVariantToken.fontSizeM
   */
  variant?: ApTypographyVariant;

  /**
   * Display CSS property
   * @default determined by component type (block for headings/p, inline for span)
   */
  display?: 'inline' | 'block' | 'inline-block';
}
