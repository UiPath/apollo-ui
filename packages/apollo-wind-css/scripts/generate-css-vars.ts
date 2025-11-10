#!/usr/bin/env tsx
/**
 * CSS Variable Generation Script
 *
 * Generates type-safe CSS variable mappings from apollo-core tokens.
 * This script transforms PascalCase token names to kebab-case CSS variable names.
 *
 * Usage:
 *   tsx scripts/generate-css-vars.ts
 *   or
 *   yarn generate:css-vars
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  Colors,
  Spacing,
  Typography,
  Shadow,
  Border,
  Icon,
  Padding,
  FontFamily,
} from '@uipath/apollo-core';
import { pascalToKebab } from '../src/utils/naming-conventions.js';

/**
 * Generate CSS variable name from token name
 */
function generateCssVarName(tokenName: string): string {
  return `--${pascalToKebab(tokenName)}`;
}

/**
 * Transform token object to CSS variable mappings
 */
function transformTokens(tokens: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(tokens)) {
    // Only process string and number values (actual tokens)
    if (typeof value === 'string' || typeof value === 'number') {
      result[key] = generateCssVarName(key);
    }
  }

  return result;
}

/**
 * Group color tokens by category
 *
 * IMPORTANT: This function generates GENERIC CSS variable names (--color-background)
 * not theme-specific ones (--color-background-light).
 *
 * At runtime, apollo-core provides generic variables scoped under theme classes:
 *   body.light { --color-background: #ffffff; }
 *   body.dark { --color-background: #182027; }
 *
 * Consumers should reference the generic names, and theme switching updates the values.
 */
function groupColorTokens(colors: Record<string, unknown>) {
  const grouped: {
    palette: Record<string, Record<string, string>>;
    semantic: Record<string, string>;
  } = {
    palette: {},
    semantic: {},
  };

  // Color scale names (base palettes)
  const paletteNames = [
    'Orange',
    'Blue',
    'Green',
    'Yellow',
    'Red',
    'Purple',
    'LightBlue',
    'Pink',
    'Ink',
    'BlueSecondary',
  ];

  // Track which semantic tokens we've already added (to avoid duplicates)
  const addedSemanticTokens = new Set<string>();

  for (const [key, value] of Object.entries(colors)) {
    if (typeof value !== 'string') continue;

    // Check if it's a palette color (has a shade number)
    const isPaletteColor = paletteNames.some((palette) => key.startsWith(`Color${palette}`));

    if (isPaletteColor) {
      // Extract palette name and shade
      // e.g., ColorOrange500 -> orange, 500
      const match = key.match(/^Color([A-Z][a-zA-Z]+)(\d+)$/);
      if (match && match[1] && match[2]) {
        const paletteName = pascalToKebab(match[1]);
        const shade = match[2];

        if (!grouped.palette[paletteName]) {
          grouped.palette[paletteName] = {};
        }
        grouped.palette[paletteName][shade] = generateCssVarName(key);
      }
    } else {
      // Semantic color - check if theme-specific
      // Pattern: ColorBackgroundLight, ColorBackgroundDark, ColorBackgroundLightHc, ColorBackgroundDarkHc
      const themeMatch = key.match(/^Color(.+?)(Light|Dark|LightHc|DarkHc)$/);

      if (themeMatch && themeMatch[1]) {
        const baseName = themeMatch[1]; // e.g., "Background", "Foreground", "Primary"

        // Skip if we've already added this semantic token
        if (addedSemanticTokens.has(baseName)) {
          continue;
        }

        // Generate generic CSS variable name (WITHOUT theme suffix)
        // e.g., ColorBackgroundLight -> --color-background (not --color-background-light)
        const genericVarName = `--color-${pascalToKebab(baseName)}`;

        // Create camelCase key for JavaScript access
        // e.g., "Background" -> "background", "ForegroundLight" -> "foregroundLight"
        const camelCaseKey = baseName.charAt(0).toLowerCase() + baseName.slice(1);

        grouped.semantic[camelCaseKey] = genericVarName;
        addedSemanticTokens.add(baseName);
      } else {
        // Non-theme-specific semantic colors (e.g., ColorWhite, ColorBlack)
        // Remove "Color" prefix and convert to camelCase
        const nameWithoutPrefix = key.replace(/^Color/, '');
        const camelCaseKey = nameWithoutPrefix.charAt(0).toLowerCase() + nameWithoutPrefix.slice(1);

        // Generate generic variable name
        grouped.semantic[camelCaseKey] = generateCssVarName(key);
      }
    }
  }

  return grouped;
}

/**
 * Generate TypeScript file content
 */
function generateFileContent(): string {
  // Transform all token categories
  const colorTokens = groupColorTokens(Colors);
  const spacingTokens = transformTokens(Spacing);
  const typographyTokens = transformTokens(Typography);
  const shadowTokens = transformTokens(Shadow);
  const borderTokens = transformTokens(Border);
  const iconTokens = transformTokens(Icon);
  const paddingTokens = transformTokens(Padding);
  const fontFamilyTokens = transformTokens(FontFamily);

  // Generate file content
  const content = `/**
 * CSS Variable Mappings
 *
 * Auto-generated type-safe CSS variable name mappings from apollo-core tokens.
 * DO NOT EDIT THIS FILE MANUALLY - it is generated by scripts/generate-css-vars.ts
 *
 * NOTE: This file is auto-generated but COMMITTED TO GIT for developer visibility.
 * Developers can read this file to understand Apollo token mappings without running the build.
 * Regenerate by running: yarn generate:css-vars
 *
 * Usage:
 * import { cssVars } from './generated/css-vars';
 * const colorVar = cssVars.color.palette.orange['500']; // '--color-orange-500'
 */

export const cssVars = {
  color: {
    palette: ${JSON.stringify(colorTokens.palette, null, 2)},
    semantic: ${JSON.stringify(colorTokens.semantic, null, 2)},
  },
  spacing: ${JSON.stringify(spacingTokens, null, 2)},
  typography: ${JSON.stringify(typographyTokens, null, 2)},
  shadow: ${JSON.stringify(shadowTokens, null, 2)},
  border: ${JSON.stringify(borderTokens, null, 2)},
  icon: ${JSON.stringify(iconTokens, null, 2)},
  padding: ${JSON.stringify(paddingTokens, null, 2)},
  fontFamily: ${JSON.stringify(fontFamilyTokens, null, 2)},
} as const;

/**
 * Type helpers for accessing CSS variable names
 */
export type CssVars = typeof cssVars;
export type ColorPalette = keyof CssVars['color']['palette'];
export type ColorShade = keyof CssVars['color']['palette'][ColorPalette];
export type SemanticColor = keyof CssVars['color']['semantic'];
`;

  return content;
}

/**
 * Main execution
 */
function main() {
  try {
    console.log('🚀 Generating CSS variable mappings...');

    // Generate content
    const content = generateFileContent();

    // Ensure output directory exists
    const outputDir = path.join(__dirname, '..', 'src', 'generated');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log('📁 Created directory:', outputDir);
    }

    // Write file
    const outputPath = path.join(outputDir, 'css-vars.ts');
    fs.writeFileSync(outputPath, content, 'utf-8');

    console.log('✅ Successfully generated:', outputPath);
    console.log('');
    console.log('📊 Token counts:');
    console.log(`   Colors: ${Object.keys(Colors).length} tokens`);
    console.log(`   Spacing: ${Object.keys(Spacing).length} tokens`);
    console.log(`   Typography: ${Object.keys(Typography).length} tokens`);
    console.log(`   Shadow: ${Object.keys(Shadow).length} tokens`);
    console.log(`   Border: ${Object.keys(Border).length} tokens`);
    console.log(`   Icon: ${Object.keys(Icon).length} tokens`);
    console.log(`   Padding: ${Object.keys(Padding).length} tokens`);
    console.log(`   FontFamily: ${Object.keys(FontFamily).length} tokens`);
    console.log('');
    console.log('🎉 CSS variable generation complete!');
  } catch (error) {
    console.error('❌ Error generating CSS variables:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main as generateCssVars };
