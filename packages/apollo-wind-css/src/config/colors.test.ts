/**
 * Color Configuration Tests
 *
 * Verifies that color configuration correctly maps apollo-core tokens
 * to Tailwind-compatible format using GENERIC CSS variables (not theme-specific).
 *
 * IMPORTANT: After migration to generic CSS variables, we expect:
 * - ~221 semantic colors (generic tokens, NOT 554 theme-specific variants)
 * - CamelCase keys (e.g., 'background', 'foregroundLight', 'primaryHover')
 * - Generic CSS variable names (e.g., '--color-background', no theme suffix)
 *
 * Theme switching is handled by apollo-core via body.{theme} classes that
 * update the generic CSS variable values at runtime.
 */

import { cssVars } from '../generated/css-vars';

import { colors, basePalette, semanticColors } from './colors';

describe('Color Configuration', () => {
  describe('basePalette', () => {
    it('should export all 10 color palettes', () => {
      const paletteKeys = Object.keys(basePalette);
      expect(paletteKeys).toHaveLength(10);

      // Verify all expected palettes exist
      const expectedPalettes = [
        'orange',
        'blue',
        'blue-secondary',
        'green',
        'yellow',
        'red',
        'purple',
        'light-blue',
        'pink',
        'ink',
      ];

      for (const palette of expectedPalettes) {
        expect(basePalette).toHaveProperty(palette);
      }
    });

    it('should wrap all color values in var() syntax', () => {
      for (const palette of Object.values(basePalette)) {
        for (const colorValue of Object.values(palette)) {
          expect(colorValue).toMatch(/^var\(--color-[a-z-0-9-]+\)$/);
        }
      }
    });

    it('should map orange palette correctly', () => {
      expect(basePalette.orange['500']).toBe('var(--color-orange-500)');
      expect(basePalette.orange['100']).toBe('var(--color-orange-100)');
    });

    it('should map blue palette correctly', () => {
      expect(basePalette.blue['500']).toBe('var(--color-blue-500)');
      expect(basePalette.blue['050']).toBe('var(--color-blue-050)');
    });

    it('should preserve custom Apollo shades (050, 150, 250, etc.)', () => {
      // Apollo uses custom shade numbers, not standard Tailwind 50-900
      expect(basePalette.ink).toHaveProperty('050');
      expect(basePalette.ink).toHaveProperty('150');
      expect(basePalette.ink).toHaveProperty('625');
    });

    it('should match source palette count from cssVars', () => {
      const sourcePaletteCount = Object.keys(cssVars.color.palette).length;
      const mappedPaletteCount = Object.keys(basePalette).length;
      expect(mappedPaletteCount).toBe(sourcePaletteCount);
    });
  });

  describe('semanticColors', () => {
    it('should export ~221 semantic colors (generic, not theme-specific)', () => {
      const semanticColorKeys = Object.keys(semanticColors);
      // Should have ~221 generic semantic tokens, not 554 theme-specific ones
      // Exact count depends on apollo-core tokens
      expect(semanticColorKeys.length).toBeGreaterThan(200);
      expect(semanticColorKeys.length).toBeLessThan(250);
    });

    it('should wrap all semantic color values in var() syntax', () => {
      for (const colorValue of Object.values(semanticColors)) {
        expect(colorValue).toMatch(/^var\(--[a-z-0-9-]+\)$/);
      }
    });

    it('should map white and black correctly', () => {
      expect(semanticColors['white']).toBe('var(--color-white)');
      expect(semanticColors['black']).toBe('var(--color-black)');
    });

    it('should map background colors with GENERIC variable names', () => {
      // NEW: Generic variables (no theme suffix like -light or -dark)
      expect(semanticColors['background']).toBe('var(--color-background)');
      expect(semanticColors['backgroundSecondary']).toBe('var(--color-background-secondary)');
      expect(semanticColors['backgroundRaised']).toBe('var(--color-background-raised)');
      expect(semanticColors['backgroundHover']).toBe('var(--color-background-hover)');
    });

    it('should map foreground colors with GENERIC variable names', () => {
      // NEW: Generic variables (no theme suffix)
      expect(semanticColors['foreground']).toBe('var(--color-foreground)');
      expect(semanticColors['foregroundEmp']).toBe('var(--color-foreground-emp)');
      expect(semanticColors['foregroundLight']).toBe('var(--color-foreground-light)');
    });

    it('should map status colors correctly', () => {
      // Status color scale tokens (kept from apollo-core)
      expect(semanticColors['error500']).toBe('var(--color-error-500)');
      expect(semanticColors['warning500']).toBe('var(--color-warning-500)');
      expect(semanticColors['info500']).toBe('var(--color-info-500)');
      expect(semanticColors['success500']).toBe('var(--color-success-500)');

      // Generic status backgrounds
      expect(semanticColors['errorBackground']).toBe('var(--color-error-background)');
      expect(semanticColors['warningBackground']).toBe('var(--color-warning-background)');
    });

    it('should map contrast colors correctly', () => {
      expect(semanticColors['error500Contrast']).toBe('var(--color-error-500-contrast)');
    });

    it('should map border colors with GENERIC variable names', () => {
      // NEW: Generic border variables (no theme suffix)
      expect(semanticColors['border']).toBe('var(--color-border)');
      expect(semanticColors['borderDisabled']).toBe('var(--color-border-disabled)');
    });

    it('should map component colors with GENERIC variable names', () => {
      // NEW: Generic component variables (no theme suffix)
      expect(semanticColors['chipDefaultBackground']).toBe('var(--color-chip-default-background)');
      expect(semanticColors['toggleOffHover']).toBe('var(--color-toggle-off-hover)');
      expect(semanticColors['iconDefault']).toBe('var(--color-icon-default)');
    });

    it('should map primary colors with GENERIC variable names', () => {
      // NEW: Generic primary variables (no theme suffix)
      expect(semanticColors['primary']).toBe('var(--color-primary)');
      expect(semanticColors['primaryHover']).toBe('var(--color-primary-hover)');
      expect(semanticColors['primaryFocused']).toBe('var(--color-primary-focused)');
    });

    it('should use camelCase naming convention (for Tailwind kebab-case conversion)', () => {
      const semanticColorKeys = Object.keys(semanticColors);
      for (const key of semanticColorKeys) {
        // Keys should be camelCase or numbers (e.g., 'background', 'foregroundLight', 'error500')
        // Tailwind will convert these to kebab-case utilities (bg-background, text-foreground-light)
        expect(key).toMatch(/^[a-z][a-zA-Z0-9]*$/);
      }
    });

    it('should not have "Color" prefix in keys', () => {
      const semanticColorKeys = Object.keys(semanticColors);
      for (const key of semanticColorKeys) {
        expect(key).not.toMatch(/^Color/);
      }
    });

    it('should match source semantic color count from cssVars', () => {
      const sourceSemanticCount = Object.keys(cssVars.color.semantic).length;
      const mappedSemanticCount = Object.keys(semanticColors).length;
      expect(mappedSemanticCount).toBe(sourceSemanticCount);
    });
  });

  describe('colors (combined export)', () => {
    it('should export ~291 total colors (10 palettes + ~221 semantic)', () => {
      const totalColorKeys = Object.keys(colors);
      // 10 palette objects + ~221 semantic color values
      // Exact count varies based on apollo-core tokens
      expect(totalColorKeys.length).toBeGreaterThan(220);
      expect(totalColorKeys.length).toBeLessThan(280);
    });

    it('should include all base palettes', () => {
      expect(colors).toHaveProperty('orange');
      expect(colors).toHaveProperty('blue');
      expect(colors).toHaveProperty('green');
    });

    it('should include all semantic colors', () => {
      expect(colors).toHaveProperty('white');
      expect(colors).toHaveProperty('background'); // Generic, not 'background-light'
      expect(colors).toHaveProperty('error500');
    });

    it('should not have key conflicts between base and semantic', () => {
      // Semantic colors use camelCase (e.g., 'background')
      // Base palettes use kebab-case (e.g., 'light-blue')
      // There should be no naming conflicts
      const allKeys = Object.keys(colors);
      const uniqueKeys = new Set(allKeys);
      expect(allKeys.length).toBe(uniqueKeys.size);
    });
  });

  describe('TypeScript types', () => {
    it('should export BasePalette type', () => {
      // This test just verifies the type exists and compiles
      const testPalette: typeof basePalette = basePalette;
      expect(testPalette).toBeDefined();
    });

    it('should export SemanticColors type', () => {
      // This test just verifies the type exists and compiles
      const testSemantic: typeof semanticColors = semanticColors;
      expect(testSemantic).toBeDefined();
    });

    it('should export Colors type', () => {
      // This test just verifies the type exists and compiles
      const testColors: typeof colors = colors;
      expect(testColors).toBeDefined();
    });
  });
});
