#!/usr/bin/env tsx
/**
 * Typography Token Explorer
 *
 * This script explores and documents the typography token structure available
 * in apollo-core. Use this to understand what typography tokens are available
 * and how they're structured.
 *
 * Usage:
 *   tsx scripts/explore-typography.ts
 *   or
 *   yarn tsx scripts/explore-typography.ts
 */

import * as Apollo from '@uipath/apollo-core';

console.log('=== Apollo Core Typography Token Explorer ===\n');

// Check all available exports
const allKeys = Object.keys(Apollo);
console.log('Total apollo-core exports:', allKeys.length);
console.log('Available exports:', allKeys.join(', '));
console.log();

// Explore FontVariantToken
if (Apollo.FontVariantToken) {
  console.log('=== FontVariantToken Structure ===');
  const fontVariantKeys = Object.keys(Apollo.FontVariantToken);
  console.log('Available font variants:', fontVariantKeys.length);
  console.log('Variants:', fontVariantKeys.join(', '));
  console.log();

  // Show detailed structure for first few variants
  console.log('=== Sample Font Variant Details ===');
  fontVariantKeys.slice(0, 5).forEach((key) => {
    console.log(`\n${key}:`);
    const variant = (Apollo.FontVariantToken as Record<string, unknown>)[key];
    console.log(JSON.stringify(variant, null, 2));
  });
}

// Explore FontFamily
if (Apollo.FontFamily) {
  console.log('\n=== FontFamily Structure ===');
  const fontFamilyKeys = Object.keys(Apollo.FontFamily);
  console.log('Available font family tokens:', fontFamilyKeys.length);
  console.log();

  // Show all font family values
  fontFamilyKeys.forEach((key) => {
    const value = (Apollo.FontFamily as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.includes(',')) {
      // Font family stack
      console.log(`${key}: ${value.split(',').length} fonts`);
      console.log(`  ${value}`);
    } else {
      // Single value (weight, size, etc.)
      console.log(`${key}: ${value}`);
    }
  });
}

console.log('\n=== Typography Token Categories ===');
const fontFamilyKeys = Object.keys(Apollo.FontFamily);

// Group by category
const categories = {
  families: fontFamilyKeys.filter((k) => k.includes('Family')),
  sizes: fontFamilyKeys.filter((k) => k.includes('Size')),
  weights: fontFamilyKeys.filter((k) => k.includes('Weight')),
  lineHeights: fontFamilyKeys.filter((k) => k.includes('LineHeight')),
  letterSpacing: fontFamilyKeys.filter((k) => k.includes('LetterSpacing')),
  other: fontFamilyKeys.filter(
    (k) =>
      !k.includes('Family') &&
      !k.includes('Size') &&
      !k.includes('Weight') &&
      !k.includes('LineHeight') &&
      !k.includes('LetterSpacing')
  ),
};

Object.entries(categories).forEach(([category, keys]) => {
  if (keys.length > 0) {
    console.log(`\n${category} (${keys.length} tokens):`);
    keys.forEach((key) => console.log(`  - ${key}`));
  }
});

console.log('\n=== Font Size Scales ===');
const sizeKeys = categories.sizes;
const scales = ['Micro', 'Xs', 'S', 'M', 'L', 'Hero', 'Header1', 'Header2', 'Header3', 'Header4'];

const fontFamilyRecord = Apollo.FontFamily as Record<string, unknown>;

scales.forEach((scale) => {
  const sizeKey = sizeKeys.find((k) => k.includes(scale) && k.includes('Size'));
  const lineHeightKey = categories.lineHeights.find(
    (k) => k.includes(scale) && k.includes('LineHeight')
  );
  const weightKey = categories.weights.find((k) => k.includes(scale) && k.includes('Weight'));

  if (sizeKey) {
    console.log(`\n${scale}:`);
    console.log(`  fontSize: ${fontFamilyRecord[sizeKey]}`);
    if (lineHeightKey) {
      console.log(`  lineHeight: ${fontFamilyRecord[lineHeightKey]}`);
    }
    if (weightKey) {
      console.log(`  fontWeight: ${fontFamilyRecord[weightKey]}`);
    }
  }
});

console.log('\n=== Exploration Complete ===');
