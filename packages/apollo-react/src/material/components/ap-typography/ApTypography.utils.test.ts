import { describe, expect, it } from 'vitest';
import { FontVariantToken } from '@uipath/apollo-core';
import { getVariantMapping } from './ApTypography.utils';

describe('ApTypography Utils', () => {
  describe('getVariantMapping', () => {
    describe('Heading Variants', () => {
      it('maps H1 variants to h1 component and variant', () => {
        const result = getVariantMapping(FontVariantToken.fontSizeH1);
        expect(result).toEqual({
          muiVariant: 'h1',
          component: 'h1',
        });
      });

      it('maps H1 bold variant to h1', () => {
        const result = getVariantMapping(FontVariantToken.fontSizeH1Bold);
        expect(result).toEqual({
          muiVariant: 'h1',
          component: 'h1',
        });
      });

      it('maps hero variants to h1', () => {
        const heroResult = getVariantMapping(FontVariantToken.fontSizeHero);
        const heroBoldResult = getVariantMapping(FontVariantToken.fontSizeHeroBold);

        expect(heroResult).toEqual({
          muiVariant: 'h1',
          component: 'h1',
        });
        expect(heroBoldResult).toEqual({
          muiVariant: 'h1',
          component: 'h1',
        });
      });

      it('maps H2 variants to h2', () => {
        const result = getVariantMapping(FontVariantToken.fontSizeH2);
        const boldResult = getVariantMapping(FontVariantToken.fontSizeH2Bold);

        expect(result).toEqual({
          muiVariant: 'h2',
          component: 'h2',
        });
        expect(boldResult).toEqual({
          muiVariant: 'h2',
          component: 'h2',
        });
      });

      it('maps H3 variants to h3', () => {
        const result = getVariantMapping(FontVariantToken.fontSizeH3);
        const boldResult = getVariantMapping(FontVariantToken.fontSizeH3Bold);

        expect(result).toEqual({
          muiVariant: 'h3',
          component: 'h3',
        });
        expect(boldResult).toEqual({
          muiVariant: 'h3',
          component: 'h3',
        });
      });

      it('maps H4 variants to h4', () => {
        const result = getVariantMapping(FontVariantToken.fontSizeH4);
        const boldResult = getVariantMapping(FontVariantToken.fontSizeH4Bold);
        const brandResult = getVariantMapping(FontVariantToken.fontBrandH4);

        expect(result).toEqual({
          muiVariant: 'h4',
          component: 'h4',
        });
        expect(boldResult).toEqual({
          muiVariant: 'h4',
          component: 'h4',
        });
        expect(brandResult).toEqual({
          muiVariant: 'h4',
          component: 'h4',
        });
      });
    });

    describe('Body Text Variants', () => {
      it('maps large text variants to body1 and p', () => {
        const result = getVariantMapping(FontVariantToken.fontSizeL);
        const boldResult = getVariantMapping(FontVariantToken.fontSizeLBold);
        const brandResult = getVariantMapping(FontVariantToken.fontBrandL);

        expect(result).toEqual({
          muiVariant: 'body1',
          component: 'p',
        });
        expect(boldResult).toEqual({
          muiVariant: 'body1',
          component: 'p',
        });
        expect(brandResult).toEqual({
          muiVariant: 'body1',
          component: 'p',
        });
      });

      it('maps medium text variants to body2 and span', () => {
        const result = getVariantMapping(FontVariantToken.fontSizeM);
        const boldResult = getVariantMapping(FontVariantToken.fontSizeMBold);
        const brandResult = getVariantMapping(FontVariantToken.fontBrandM);
        const linkResult = getVariantMapping(FontVariantToken.fontSizeLink);

        expect(result).toEqual({
          muiVariant: 'body2',
          component: 'span',
        });
        expect(boldResult).toEqual({
          muiVariant: 'body2',
          component: 'span',
        });
        expect(brandResult).toEqual({
          muiVariant: 'body2',
          component: 'span',
        });
        expect(linkResult).toEqual({
          muiVariant: 'body2',
          component: 'span',
        });
      });

      it('maps small text variants to caption and span', () => {
        const sResult = getVariantMapping(FontVariantToken.fontSizeS);
        const sBoldResult = getVariantMapping(FontVariantToken.fontSizeSBold);
        const xsResult = getVariantMapping(FontVariantToken.fontSizeXs);
        const xsBoldResult = getVariantMapping(FontVariantToken.fontSizeXsBold);

        expect(sResult).toEqual({
          muiVariant: 'caption',
          component: 'span',
        });
        expect(sBoldResult).toEqual({
          muiVariant: 'caption',
          component: 'span',
        });
        expect(xsResult).toEqual({
          muiVariant: 'caption',
          component: 'span',
        });
        expect(xsBoldResult).toEqual({
          muiVariant: 'caption',
          component: 'span',
        });
      });
    });

    describe('Monospace Variants', () => {
      it('maps mono variants to body2 and code', () => {
        const monoM = getVariantMapping(FontVariantToken.fontMonoM);
        const monoMBold = getVariantMapping(FontVariantToken.fontMonoMBold);
        const monoS = getVariantMapping(FontVariantToken.fontMonoS);
        const monoSBold = getVariantMapping(FontVariantToken.fontMonoSBold);
        const monoXS = getVariantMapping(FontVariantToken.fontMonoXS);
        const monoXSBold = getVariantMapping(FontVariantToken.fontMonoXSBold);

        const expectedResult = {
          muiVariant: 'body2',
          component: 'code',
        };

        expect(monoM).toEqual(expectedResult);
        expect(monoMBold).toEqual(expectedResult);
        expect(monoS).toEqual(expectedResult);
        expect(monoSBold).toEqual(expectedResult);
        expect(monoXS).toEqual(expectedResult);
        expect(monoXSBold).toEqual(expectedResult);
      });
    });

    describe('Default Behavior', () => {
      it('returns default mapping for unknown variant', () => {
        // @ts-expect-error Testing invalid variant
        const result = getVariantMapping('unknownVariant');

        expect(result).toEqual({
          muiVariant: 'body1',
          component: 'span',
        });
      });
    });

    describe('String Variants', () => {
      it('handles string literal variants', () => {
        const result = getVariantMapping('header1Bold' as FontVariantToken);
        expect(result).toEqual({
          muiVariant: 'h1',
          component: 'h1',
        });
      });
    });
  });
});
