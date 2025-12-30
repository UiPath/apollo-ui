import { FontVariantToken, Typography } from '@uipath/apollo-core';

interface TypographyToken {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
}

export const fontByVariant = (variant: FontVariantToken): TypographyToken | undefined => {
  // Find the enum key whose value matches the given variant
  const enumKey = Object.keys(FontVariantToken).find(
    (key) => FontVariantToken[key as keyof typeof FontVariantToken] === variant
  );

  if (enumKey && Typography[enumKey as keyof typeof Typography]) {
    return Typography[enumKey as keyof typeof Typography] as TypographyToken;
  }

  return undefined;
};
