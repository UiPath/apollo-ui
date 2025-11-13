/**
 * Generate Theme CSS from Apollo Core Tokens
 *
 * This script generates `src/theme.css` containing @theme inline definitions
 * that reference apollo-core CSS variables. The @theme inline approach allows
 * Tailwind to generate utilities while preserving the CSS variable references.
 *
 * Usage: yarn generate:theme
 */

import * as fs from 'fs';
import * as path from 'path';
import { Colors, Spacing, Shadow, Padding, FontFamily, Border } from '@uipath/apollo-core';
import { pascalToKebab } from '../utils/naming-conventions';

/**
 * Generate @theme inline CSS that maps TypeScript tokens to CSS variable references
 */
function generateThemeCSS(): string {
  const lines: string[] = [];
  let tokenCount = 0;

  // Header comments
  lines.push('/**');
  lines.push(' * Apollo Wind Theme Definitions');
  lines.push(' * Generated from @uipath/apollo-core TypeScript tokens');
  lines.push(' *');
  lines.push(' * This file is AUTO-GENERATED. Do not edit manually.');
  lines.push(' * Run `yarn generate:theme` to regenerate.');
  lines.push(' *');
  lines.push(' * NOTE: This file is auto-generated but COMMITTED TO GIT for developer visibility.');
  lines.push(
    ' * Developers can read this file to understand Apollo token mappings without running the build.'
  );
  lines.push(' * Regenerate by running: yarn generate:theme');
  lines.push(' */');
  lines.push('');

  // Import directives
  lines.push('/* Import Tailwind base */');
  lines.push('@import "tailwindcss";');
  lines.push('');
  lines.push('/* Import Apollo Core CSS variables */');
  lines.push('@import "@uipath/apollo-core/src/css/variables.css";');
  lines.push('');

  // Start @theme inline block
  lines.push('/* Define Tailwind theme using apollo-core CSS variables */');
  lines.push('@theme inline {');

  // Generate color mappings
  lines.push('  /* ===== Colors ===== */');
  lines.push('');

  Object.keys(Colors).forEach((key) => {
    const cssVar = `--${pascalToKebab(key)}`;
    lines.push(`  ${cssVar}: var(${cssVar});`);
    tokenCount++;
  });

  lines.push('');

  // Generate spacing mappings
  lines.push('  /* ===== Spacing ===== */');
  lines.push('');

  Object.keys(Spacing).forEach((key) => {
    const cssVar = `--${pascalToKebab(key)}`;
    lines.push(`  ${cssVar}: var(${cssVar});`);
    tokenCount++;
  });

  lines.push('');

  // Map Apollo spacing tokens to Tailwind's numeric scale
  lines.push('  /* Map Apollo spacing to Tailwind numeric scale */');
  const spacingMappings = [
    { tw: '1', apollo: 'micro' },
    { tw: '2', apollo: 'xs' },
    { tw: '3', apollo: 's' },
    { tw: '4', apollo: 'base' },
    { tw: '5', apollo: 'm' },
    { tw: '6', apollo: 'l' },
    { tw: '8', apollo: 'xl' },
    { tw: '10', apollo: 'xxl' },
  ];

  spacingMappings.forEach(({ tw, apollo }) => {
    lines.push(`  --spacing-${tw}: var(--spacing-${apollo});`);
    tokenCount++;
  });

  lines.push('');

  // Generate padding mappings
  lines.push('  /* ===== Padding ===== */');
  lines.push('');

  Object.keys(Padding).forEach((key) => {
    const cssVar = `--${pascalToKebab(key)}`;
    lines.push(`  ${cssVar}: var(${cssVar});`);
    tokenCount++;
  });

  lines.push('');

  // Generate typography mappings (FontFamily)
  lines.push('  /* ===== Typography - Font Families ===== */');
  lines.push('');

  Object.keys(FontFamily).forEach((key) => {
    const cssVar = `--${pascalToKebab(key)}`;
    lines.push(`  ${cssVar}: var(${cssVar});`);
    tokenCount++;
  });

  lines.push('');

  // Generate shadow mappings
  lines.push('  /* ===== Shadows ===== */');
  lines.push('');

  Object.keys(Shadow).forEach((key) => {
    const cssVar = `--${pascalToKebab(key)}`;
    lines.push(`  ${cssVar}: var(${cssVar});`);
    tokenCount++;
  });

  lines.push('');

  // Generate border-radius mappings
  lines.push('  /* ===== Border Radius ===== */');
  lines.push('');

  Object.keys(Border).forEach((key) => {
    const cssVar = `--${pascalToKebab(key)}`;
    lines.push(`  ${cssVar}: var(${cssVar});`);
    tokenCount++;
  });

  // Map to Tailwind's radius scale
  lines.push('');
  lines.push('  /* Map to Tailwind radius scale */');
  lines.push('  --radius-none: var(--border-radius-none);');
  lines.push('  --radius-sm: var(--border-radius-s);');
  lines.push('  --radius: var(--border-radius-m);');
  lines.push('  --radius-md: var(--border-radius-m);');
  lines.push('  --radius-lg: var(--border-radius-l);');
  tokenCount += 5;

  lines.push('');

  // Map line-height tokens to Tailwind scale
  lines.push('  /* ===== Line Height Utilities ===== */');
  lines.push('');
  lines.push('  --line-height-micro: var(--font-micro-line-height);');
  lines.push('  --line-height-xs: var(--font-xs-line-height);');
  lines.push('  --line-height-s: var(--font-s-line-height);');
  lines.push('  --line-height-m: var(--font-m-line-height);');
  lines.push('  --line-height-l: var(--font-l-line-height);');
  lines.push('  --line-height-hero: var(--font-hero-line-height);');
  lines.push('  --line-height-h1: var(--font-header-1-line-height);');
  lines.push('  --line-height-h2: var(--font-header-2-line-height);');
  lines.push('  --line-height-h3: var(--font-header-3-line-height);');
  lines.push('  --line-height-h4: var(--font-header-4-line-height);');
  tokenCount += 10;

  lines.push('}');

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  console.log('🎨 Generating theme CSS from apollo-core tokens...');

  const css = generateThemeCSS();
  const outputPath = path.resolve(__dirname, '../generated/theme.css');

  // Write output file
  fs.writeFileSync(outputPath, css, 'utf-8');

  // Calculate stats
  const lines = css.split('\n').length;
  const sizeKB = (Buffer.byteLength(css, 'utf-8') / 1024).toFixed(2);

  console.log(`✅ Generated theme.css:`);
  console.log(`   - File: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`   - Lines: ${lines}`);
  console.log(`   - Size: ${sizeKB} KB`);
  console.log(`   - Contains: @theme inline definitions referencing apollo-core CSS variables`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateThemeCSS };
