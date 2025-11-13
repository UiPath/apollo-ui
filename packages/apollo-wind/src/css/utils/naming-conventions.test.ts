/**
 * Tests for Naming Convention Utilities
 */

import { pascalToKebab } from './naming-conventions';

describe('pascalToKebab', () => {
  describe('basic PascalCase conversions', () => {
    it('should convert simple PascalCase', () => {
      expect(pascalToKebab('ColorOrange')).toBe('color-orange');
      expect(pascalToKebab('Spacing')).toBe('spacing');
      expect(pascalToKebab('FontFamily')).toBe('font-family');
    });

    it('should convert PascalCase with numbers', () => {
      expect(pascalToKebab('ColorOrange500')).toBe('color-orange-500');
      expect(pascalToKebab('ColorBlue050')).toBe('color-blue-050');
      expect(pascalToKebab('ColorRed800')).toBe('color-red-800');
    });

    it('should convert multi-word PascalCase', () => {
      expect(pascalToKebab('FontWeightLight')).toBe('font-weight-light');
      expect(pascalToKebab('BorderRadiusM')).toBe('border-radius-m');
      expect(pascalToKebab('ShadowCardElevation')).toBe('shadow-card-elevation');
    });
  });

  describe('consecutive capital letters', () => {
    it('should keep consecutive capitals together when followed by end of string', () => {
      expect(pascalToKebab('SpacingXXL')).toBe('spacing-xxl');
      expect(pascalToKebab('PaddingXL')).toBe('padding-xl');
      expect(pascalToKebab('FontXS')).toBe('font-xs');
    });

    it('should split consecutive capitals when followed by lowercase', () => {
      expect(pascalToKebab('HTMLElement')).toBe('html-element');
      expect(pascalToKebab('XMLParser')).toBe('xml-parser');
    });
  });

  describe('numbers in token names', () => {
    it('should handle numbers after letters', () => {
      expect(pascalToKebab('ShadowDp24')).toBe('shadow-dp-24');
      expect(pascalToKebab('ShadowDp8')).toBe('shadow-dp-8');
      expect(pascalToKebab('ShadowDp1')).toBe('shadow-dp-1');
    });

    it('should handle numbers in middle of string', () => {
      expect(pascalToKebab('FontH1Bold')).toBe('font-h1-bold');
      expect(pascalToKebab('FontH2Size')).toBe('font-h2-size');
      expect(pascalToKebab('TypographyH3LineHeight')).toBe('typography-h3-line-height');
    });

    it('should handle multiple numbers', () => {
      expect(pascalToKebab('Color123Test456')).toBe('color-123-test-456');
    });
  });

  describe('edge cases', () => {
    it('should handle single character', () => {
      expect(pascalToKebab('A')).toBe('a');
      expect(pascalToKebab('X')).toBe('x');
    });

    it('should handle already lowercase', () => {
      expect(pascalToKebab('lowercase')).toBe('lowercase');
    });

    it('should handle empty string', () => {
      expect(pascalToKebab('')).toBe('');
    });

    it('should handle string with only capitals', () => {
      expect(pascalToKebab('XXL')).toBe('xxl');
      expect(pascalToKebab('HTML')).toBe('html');
    });
  });

  describe('real apollo-core token examples', () => {
    it('should handle color tokens', () => {
      expect(pascalToKebab('ColorOrange500')).toBe('color-orange-500');
      expect(pascalToKebab('ColorBlueSecondary600')).toBe('color-blue-secondary-600');
      expect(pascalToKebab('ColorBackground')).toBe('color-background');
      expect(pascalToKebab('ColorForegroundLight')).toBe('color-foreground-light');
    });

    it('should handle spacing tokens', () => {
      expect(pascalToKebab('SpacingMicro')).toBe('spacing-micro');
      expect(pascalToKebab('SpacingXs')).toBe('spacing-xs');
      expect(pascalToKebab('SpacingBase')).toBe('spacing-base');
      expect(pascalToKebab('SpacingXxl')).toBe('spacing-xxl');
    });

    it('should handle shadow tokens', () => {
      expect(pascalToKebab('ShadowDp1')).toBe('shadow-dp-1');
      expect(pascalToKebab('ShadowDp24')).toBe('shadow-dp-24');
      expect(pascalToKebab('ShadowCardElevation')).toBe('shadow-card-elevation');
      expect(pascalToKebab('ShadowHighlightLight')).toBe('shadow-highlight-light');
    });

    it('should handle typography tokens', () => {
      expect(pascalToKebab('FontHeader1Size')).toBe('font-header-1-size');
      expect(pascalToKebab('FontH1Bold')).toBe('font-h1-bold');
      expect(pascalToKebab('FontMicroSize')).toBe('font-micro-size');
      expect(pascalToKebab('TypographyMFontSize')).toBe('typography-m-font-size');
    });

    it('should handle border tokens', () => {
      expect(pascalToKebab('BorderRadiusS')).toBe('border-radius-s');
      expect(pascalToKebab('BorderThickM')).toBe('border-thick-m');
    });

    it('should handle icon tokens', () => {
      expect(pascalToKebab('IconXxs')).toBe('icon-xxs');
      expect(pascalToKebab('IconM')).toBe('icon-m');
      expect(pascalToKebab('IconXxl')).toBe('icon-xxl');
    });

    it('should handle padding tokens', () => {
      expect(pascalToKebab('PadXs')).toBe('pad-xs');
      expect(pascalToKebab('PadXxl')).toBe('pad-xxl');
      expect(pascalToKebab('PadXxxl')).toBe('pad-xxxl');
    });
  });
});
