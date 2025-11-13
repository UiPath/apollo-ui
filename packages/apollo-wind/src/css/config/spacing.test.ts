/**
 * Spacing Configuration Tests
 */

import { cssVars } from '../generated/css-vars';

import {
  namedSpacing,
  numericSpacing,
  padding,
  spacing,
  type NamedSpacing,
  type NumericSpacing,
  type Padding,
  type Spacing,
} from './spacing';

describe('Spacing Configuration', () => {
  describe('namedSpacing', () => {
    it('should export all 8 named spacing values', () => {
      const expectedNames = ['micro', 'xs', 's', 'base', 'm', 'l', 'xl', 'xxl'];

      const actualNames = Object.keys(namedSpacing);
      expect(actualNames).toHaveLength(8);
      expectedNames.forEach((name) => {
        expect(actualNames).toContain(name);
      });
    });

    it('should wrap all spacing values in var() syntax', () => {
      for (const spacingValue of Object.values(namedSpacing)) {
        expect(spacingValue).toMatch(/^var\(--spacing-[a-z]+\)$/);
      }
    });

    it('should map spacing values correctly', () => {
      expect(namedSpacing.micro).toBe(`var(${cssVars.spacing.SpacingMicro})`);
      expect(namedSpacing.xs).toBe(`var(${cssVars.spacing.SpacingXs})`);
      expect(namedSpacing.s).toBe(`var(${cssVars.spacing.SpacingS})`);
      expect(namedSpacing.base).toBe(`var(${cssVars.spacing.SpacingBase})`);
      expect(namedSpacing.m).toBe(`var(${cssVars.spacing.SpacingM})`);
      expect(namedSpacing.l).toBe(`var(${cssVars.spacing.SpacingL})`);
      expect(namedSpacing.xl).toBe(`var(${cssVars.spacing.SpacingXl})`);
      expect(namedSpacing.xxl).toBe(`var(${cssVars.spacing.SpacingXxl})`);
    });

    it('should follow kebab-case naming convention', () => {
      const allKeysKebabCase = Object.keys(namedSpacing).every((key) => /^[a-z]+$/.test(key));
      expect(allKeysKebabCase).toBe(true);
    });

    it('should have progressive scale from micro to xxl', () => {
      const scaleOrder = ['micro', 'xs', 's', 'base', 'm', 'l', 'xl', 'xxl'];
      const actualOrder = Object.keys(namedSpacing);
      expect(actualOrder).toEqual(scaleOrder);
    });
  });

  describe('numericSpacing', () => {
    it('should export all 9 numeric spacing values', () => {
      const expectedKeys = ['0', '1', '2', '3', '4', '5', '6', '8', '10'];

      const actualKeys = Object.keys(numericSpacing);
      expect(actualKeys).toHaveLength(9);
      expectedKeys.forEach((key) => {
        expect(actualKeys).toContain(key);
      });
    });

    it('should have 0 as literal "0"', () => {
      expect(numericSpacing[0]).toBe('0');
    });

    it('should wrap non-zero values in var() syntax', () => {
      const nonZeroKeys = Object.keys(numericSpacing).filter((k) => k !== '0');

      nonZeroKeys.forEach((key) => {
        const value = numericSpacing[key as keyof typeof numericSpacing];
        expect(value).toMatch(/^var\(--spacing-[a-z]+\)$/);
      });
    });

    it('should align numeric values with named scale', () => {
      expect(numericSpacing[1]).toBe(namedSpacing.micro); // 4px
      expect(numericSpacing[2]).toBe(namedSpacing.xs); // 8px
      expect(numericSpacing[3]).toBe(namedSpacing.s); // 12px
      expect(numericSpacing[4]).toBe(namedSpacing.base); // 16px
      expect(numericSpacing[5]).toBe(namedSpacing.m); // 20px
      expect(numericSpacing[6]).toBe(namedSpacing.l); // 24px
      expect(numericSpacing[8]).toBe(namedSpacing.xl); // 32px
      expect(numericSpacing[10]).toBe(namedSpacing.xxl); // 40px
    });

    it('should skip 7 and 9 to match Apollo scale', () => {
      expect(numericSpacing).not.toHaveProperty('7');
      expect(numericSpacing).not.toHaveProperty('9');
    });

    it('should reference same CSS variables as named scale', () => {
      expect(numericSpacing[1]).toBe(`var(${cssVars.spacing.SpacingMicro})`);
      expect(numericSpacing[4]).toBe(`var(${cssVars.spacing.SpacingBase})`);
      expect(numericSpacing[10]).toBe(`var(${cssVars.spacing.SpacingXxl})`);
    });
  });

  describe('padding', () => {
    it('should export all 7 padding values', () => {
      const expectedKeys = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];

      const actualKeys = Object.keys(padding);
      expect(actualKeys).toHaveLength(7);
      expectedKeys.forEach((key) => {
        expect(actualKeys).toContain(key);
      });
    });

    it('should wrap all padding values in var() syntax', () => {
      for (const paddingValue of Object.values(padding)) {
        expect(paddingValue).toMatch(/^var\(--pad-[a-z]+\)$/);
      }
    });

    it('should map padding values correctly', () => {
      expect(padding.xs).toBe(`var(${cssVars.padding.PadXs})`);
      expect(padding.s).toBe(`var(${cssVars.padding.PadS})`);
      expect(padding.m).toBe(`var(${cssVars.padding.PadM})`);
      expect(padding.l).toBe(`var(${cssVars.padding.PadL})`);
      expect(padding.xl).toBe(`var(${cssVars.padding.PadXl})`);
      expect(padding.xxl).toBe(`var(${cssVars.padding.PadXxl})`);
      expect(padding.xxxl).toBe(`var(${cssVars.padding.PadXxxl})`);
    });

    it('should follow kebab-case naming convention', () => {
      const allKeysKebabCase = Object.keys(padding).every((key) => /^[a-z]+$/.test(key));
      expect(allKeysKebabCase).toBe(true);
    });

    it('should have progressive scale from xs to xxxl', () => {
      const scaleOrder = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];
      const actualOrder = Object.keys(padding);
      expect(actualOrder).toEqual(scaleOrder);
    });

    it('should use distinct CSS variables from spacing', () => {
      // Padding should use --pad-* not --spacing-*
      for (const value of Object.values(padding)) {
        expect(value).toMatch(/^var\(--pad-/);
        expect(value).not.toMatch(/--spacing-/);
      }
    });
  });

  describe('spacing (combined export)', () => {
    it('should export 17 total spacing values (8 named + 9 numeric)', () => {
      const totalKeys = Object.keys(spacing).length;
      expect(totalKeys).toBe(17);
    });

    it('should include all named spacing values', () => {
      expect(spacing).toHaveProperty('micro');
      expect(spacing).toHaveProperty('base');
      expect(spacing).toHaveProperty('xxl');
    });

    it('should include all numeric spacing values', () => {
      expect(spacing).toHaveProperty('0');
      expect(spacing).toHaveProperty('4');
      expect(spacing).toHaveProperty('10');
    });

    it('should not have key conflicts between named and numeric', () => {
      const namedKeys = Object.keys(namedSpacing);
      const numericKeys = Object.keys(numericSpacing);

      const duplicates = namedKeys.filter((key) => numericKeys.includes(key));

      expect(duplicates).toHaveLength(0);
    });

    it('should combine named and numeric spacing correctly', () => {
      // Test a few named values
      expect(spacing.micro).toBe(namedSpacing.micro);
      expect(spacing.base).toBe(namedSpacing.base);

      // Test a few numeric values
      expect(spacing[0]).toBe(numericSpacing[0]);
      expect(spacing[4]).toBe(numericSpacing[4]);
    });
  });

  describe('TypeScript types', () => {
    it('should export NamedSpacing type', () => {
      const namedType: NamedSpacing = namedSpacing;
      expect(namedType).toBeDefined();
    });

    it('should export NumericSpacing type', () => {
      const numericType: NumericSpacing = numericSpacing;
      expect(numericType).toBeDefined();
    });

    it('should export Padding type', () => {
      const paddingType: Padding = padding;
      expect(paddingType).toBeDefined();
    });

    it('should export Spacing type', () => {
      const spacingType: Spacing = spacing;
      expect(spacingType).toBeDefined();
    });
  });
});
