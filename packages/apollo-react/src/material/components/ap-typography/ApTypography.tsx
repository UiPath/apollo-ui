import Typography from '@mui/material/Typography';
import { FontVariantToken, Typography as TypographyTokens } from '@uipath/apollo-core';
import { forwardRef } from 'react';

import type { ApTypographyProps } from './ApTypography.types';
import { getVariantMapping } from './ApTypography.utils';

// Type definition for typography tokens
interface TypographyToken {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
}

/**
 * ApTypography component - Typography component with Apollo design tokens
 *
 * A thin wrapper around MUI Typography that applies Apollo design tokens.
 * Leverages MUI's built-in semantic HTML rendering and accessibility features.
 *
 * @example
 * ```tsx
 * // Simple text
 * <ApTypography variant={FontVariantToken.fontSizeM}>
 *   Regular text
 * </ApTypography>
 *
 * // Heading (automatically renders as h1)
 * <ApTypography variant={FontVariantToken.fontSizeH1}>
 *   Page Title
 * </ApTypography>
 *
 * // Custom color and alignment
 * <ApTypography
 *   variant={FontVariantToken.fontSizeLBold}
 *   color="#FF5722"
 *   align="center"
 * >
 *   Centered colored text
 * </ApTypography>
 * ```
 */
export const ApTypography = forwardRef<HTMLElement, ApTypographyProps>(
  (
    { variant = FontVariantToken.fontSizeM, color, display, align, children, sx, style, ...rest },
    ref
  ) => {
    const { muiVariant, component } = getVariantMapping(variant);
    const variantKey = Object.keys(FontVariantToken).find(
      (key) => FontVariantToken[key as keyof typeof FontVariantToken] === variant
    ) as keyof typeof TypographyTokens;

    const typographyToken = TypographyTokens[variantKey] as TypographyToken | undefined;

    return (
      <Typography
        ref={ref}
        variant={muiVariant}
        component={component}
        color={color}
        align={align}
        style={{
          ...(typographyToken && {
            fontFamily: typographyToken.fontFamily,
            fontSize: typographyToken.fontSize,
            lineHeight: typographyToken.lineHeight,
            fontWeight: typographyToken.fontWeight,
            ...(typographyToken.letterSpacing && {
              letterSpacing: typographyToken.letterSpacing,
            }),
          }),
          ...(display && { display }),
          ...style,
        }}
        sx={{
          margin: 0,
          ...sx,
        }}
        {...rest}
      >
        {children}
      </Typography>
    );
  }
);

ApTypography.displayName = 'ApTypography';
