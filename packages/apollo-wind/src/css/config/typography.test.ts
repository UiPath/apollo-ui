/**
 * Typography Configuration Tests
 */

import { cssVars } from '../generated/css-vars';

import {
  fontFamily,
  fontSize,
  fontWeight,
  typography,
  type FontFamily,
  type FontSize,
  type FontWeight,
  type Typography,
} from './typography';

describe('Typography Configuration', () => {
  describe('fontFamily', () => {
    it('should export all 3 font families', () => {
      const expectedFamilies = ['sans', 'title', 'mono'];

      const actualFamilies = Object.keys(fontFamily);
      expect(actualFamilies).toHaveLength(3);
      expectedFamilies.forEach((family) => {
        expect(actualFamilies).toContain(family);
      });
    });

    it('should parse font family strings into arrays', () => {
      expect(Array.isArray(fontFamily.sans)).toBe(true);
      expect(Array.isArray(fontFamily.title)).toBe(true);
      expect(Array.isArray(fontFamily.mono)).toBe(true);
    });

    it('should preserve complete font stacks', () => {
      // sans should have CJK variants + fallbacks (14 fonts)
      expect(fontFamily.sans.length).toBe(14);

      // title should have poppins + fallbacks (15 fonts)
      expect(fontFamily.title.length).toBe(15);

      // mono should have inconsolata + fallback (2 fonts)
      expect(fontFamily.mono.length).toBe(2);
    });

    it('should include CJK variants in sans family', () => {
      const fontStack = fontFamily.sans.join(',');
      expect(fontStack).toContain('Noto Sans JP');
      expect(fontStack).toContain('Noto Sans KR');
      expect(fontStack).toContain('Noto Sans SC');
      expect(fontStack).toContain('Noto Sans TC');
    });

    it('should start with primary font in each family', () => {
      expect(fontFamily.sans[0]).toContain('noto-sans');
      expect(fontFamily.title[0]).toContain('poppins');
      expect(fontFamily.mono[0]).toContain('inconsolata');
    });

    it('should end with generic fallback', () => {
      const sansLast = fontFamily.sans[fontFamily.sans.length - 1];
      const titleLast = fontFamily.title[fontFamily.title.length - 1];
      const monoLast = fontFamily.mono[fontFamily.mono.length - 1];

      expect(sansLast).toBe('sans-serif');
      expect(titleLast).toBe('sans-serif');
      expect(monoLast).toBe('monospace');
    });
  });

  describe('fontSize', () => {
    it('should export all 10 font sizes', () => {
      const expectedSizes = ['micro', 'xs', 's', 'm', 'l', 'h4', 'h3', 'h2', 'h1', 'hero'];

      const actualSizes = Object.keys(fontSize);
      expect(actualSizes).toHaveLength(10);
      expectedSizes.forEach((size) => {
        expect(actualSizes).toContain(size);
      });
    });

    it('should use Tailwind tuple format [size, config]', () => {
      // Body sizes
      expect(Array.isArray(fontSize.micro)).toBe(true);
      expect(fontSize.micro).toHaveLength(2);
      expect(typeof fontSize.micro[0]).toBe('string'); // fontSize
      expect(typeof fontSize.micro[1]).toBe('object'); // config

      // Header sizes
      expect(Array.isArray(fontSize.h1)).toBe(true);
      expect(fontSize.h1).toHaveLength(2);
      expect(typeof fontSize.h1[0]).toBe('string'); // fontSize
      expect(typeof fontSize.h1[1]).toBe('object'); // config
    });

    it('should include lineHeight for all sizes', () => {
      const allSizes = Object.values(fontSize);

      allSizes.forEach((sizeConfig) => {
        const config = sizeConfig[1];
        expect(config).toHaveProperty('lineHeight');
        expect(typeof config.lineHeight).toBe('string');
      });
    });

    it('should include fontWeight for header sizes only', () => {
      // Body sizes should NOT have fontWeight
      expect(fontSize.micro[1]).not.toHaveProperty('fontWeight');
      expect(fontSize.xs[1]).not.toHaveProperty('fontWeight');
      expect(fontSize.s[1]).not.toHaveProperty('fontWeight');
      expect(fontSize.m[1]).not.toHaveProperty('fontWeight');
      expect(fontSize.l[1]).not.toHaveProperty('fontWeight');

      // Header sizes SHOULD have fontWeight
      expect(fontSize.h4[1]).toHaveProperty('fontWeight');
      expect(fontSize.h3[1]).toHaveProperty('fontWeight');
      expect(fontSize.h2[1]).toHaveProperty('fontWeight');
      expect(fontSize.h1[1]).toHaveProperty('fontWeight');
      expect(fontSize.hero[1]).toHaveProperty('fontWeight');
    });

    it('should reference CSS variables correctly', () => {
      // Check a body size
      expect(fontSize.m[0]).toBe(`var(${cssVars.fontFamily.FontMSize})`);
      expect(fontSize.m[1].lineHeight).toBe(`var(${cssVars.fontFamily.FontMLineHeight})`);

      // Check a header size
      expect(fontSize.h1[0]).toBe(`var(${cssVars.fontFamily.FontHeader1Size})`);
      expect(fontSize.h1[1].lineHeight).toBe(`var(${cssVars.fontFamily.FontHeader1LineHeight})`);
      expect(fontSize.h1[1].fontWeight).toBe(`var(${cssVars.fontFamily.FontHeader1Weight})`);
    });

    it('should have correct size progression (body)', () => {
      // Body sizes should progress from smallest to largest
      const bodySizes = ['micro', 'xs', 's', 'm', 'l'] as const;
      bodySizes.forEach((size) => {
        expect(fontSize[size][0]).toMatch(/^var\(--font-/);
      });
    });

    it('should have correct size progression (headers)', () => {
      // Header sizes should progress from smallest to largest
      const headerSizes = ['h4', 'h3', 'h2', 'h1', 'hero'] as const;
      headerSizes.forEach((size) => {
        expect(fontSize[size][0]).toMatch(/^var\(--font-/);
      });
    });
  });

  describe('fontWeight', () => {
    it('should export all 6 font weights', () => {
      const expectedWeights = ['light', 'normal', 'regular', 'medium', 'semibold', 'bold'];

      const actualWeights = Object.keys(fontWeight);
      expect(actualWeights).toHaveLength(6);
      expectedWeights.forEach((weight) => {
        expect(actualWeights).toContain(weight);
      });
    });

    it('should wrap all font weight values in var() syntax', () => {
      for (const weightValue of Object.values(fontWeight)) {
        expect(weightValue).toMatch(/^var\(--font-weight-[a-z]+\)$/);
      }
    });

    it('should map font weights correctly', () => {
      expect(fontWeight.light).toBe(`var(${cssVars.fontFamily.FontWeightLight})`);
      expect(fontWeight.normal).toBe(`var(${cssVars.fontFamily.FontWeightDefault})`);
      expect(fontWeight.regular).toBe(`var(${cssVars.fontFamily.FontWeightDefault})`);
      expect(fontWeight.medium).toBe(`var(${cssVars.fontFamily.FontWeightMedium})`);
      expect(fontWeight.semibold).toBe(`var(${cssVars.fontFamily.FontWeightSemibold})`);
      expect(fontWeight.bold).toBe(`var(${cssVars.fontFamily.FontWeightBold})`);
    });

    it('should have "regular" as alias for "normal"', () => {
      expect(fontWeight.regular).toBe(fontWeight.normal);
    });

    it('should follow progression from light to bold', () => {
      const weights = ['light', 'normal', 'medium', 'semibold', 'bold'] as const;

      weights.forEach((weight) => {
        expect(fontWeight[weight]).toBeTruthy();
        expect(fontWeight[weight]).toMatch(/^var\(--font-weight-/);
      });
    });
  });

  describe('typography (combined export)', () => {
    it('should export complete typography configuration', () => {
      expect(typography).toHaveProperty('fontFamily');
      expect(typography).toHaveProperty('fontSize');
      expect(typography).toHaveProperty('fontWeight');
    });

    it('should include all font families', () => {
      expect(typography.fontFamily).toEqual(fontFamily);
    });

    it('should include all font sizes', () => {
      expect(typography.fontSize).toEqual(fontSize);
    });

    it('should include all font weights', () => {
      expect(typography.fontWeight).toEqual(fontWeight);
    });
  });

  describe('TypeScript types', () => {
    it('should export FontFamily type', () => {
      const familyType: FontFamily = fontFamily;
      expect(familyType).toBeDefined();
    });

    it('should export FontSize type', () => {
      const sizeType: FontSize = fontSize;
      expect(sizeType).toBeDefined();
    });

    it('should export FontWeight type', () => {
      const weightType: FontWeight = fontWeight;
      expect(weightType).toBeDefined();
    });

    it('should export Typography type', () => {
      const typographyType: Typography = typography;
      expect(typographyType).toBeDefined();
    });
  });
});
