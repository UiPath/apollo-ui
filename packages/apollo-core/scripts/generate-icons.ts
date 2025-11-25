#!/usr/bin/env tsx

/**
 * Generate Icon Exports and Types
 *
 * This script scans all SVG files and generates:
 * 1. src/icons/index.ts - Tree-shakeable exports for each icon
 * 2. TypeScript types for icon names
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.join(__dirname, '../src/icons');
const SVG_DIR = path.join(ICONS_DIR, 'svg');
const OUTPUT_FILE = path.join(ICONS_DIR, 'index.ts');

// ============================================================================
// Types
// ============================================================================

interface SvgFile {
  name: string;
  relativePath: string;
  dir: string;
}

interface IconExport {
  exportName: string;
  importPath: string;
  originalName: string;
}

// ============================================================================
// Utilities
// ============================================================================

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function getAllSvgFiles(dir: string, basePath = ''): SvgFile[] {
  const svgFiles: SvgFile[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      svgFiles.push(...getAllSvgFiles(fullPath, relativePath));
    } else if (entry.isFile() && entry.name.endsWith('.svg')) {
      svgFiles.push({
        name: entry.name,
        relativePath,
        dir: basePath,
      });
    }
  }

  return svgFiles;
}

// ============================================================================
// Generate index.ts with exports and types
// ============================================================================

function generateIconExports(svgFiles: SvgFile[]): void {
  const usedNames = new Map<string, string>();
  const exportsByDir = new Map<string, IconExport[]>();

  // Process each SVG file
  for (const file of svgFiles) {
    const nameWithoutExt = file.name.slice(0, -4); // Remove .svg
    let exportName = toPascalCase(nameWithoutExt);

    // Handle names starting with numbers (invalid JS identifiers)
    if (/^\d/.test(exportName)) {
      const dirName = file.dir ? file.dir.split(path.sep).pop() : 'Icon';
      exportName = toPascalCase(dirName ?? '') + exportName;
    }

    // Handle duplicate names
    if (usedNames.has(exportName)) {
      const dirName = file.dir ? file.dir.split(path.sep).pop() : 'Icon';
      exportName = toPascalCase(dirName ?? '') + exportName;
    }

    usedNames.set(exportName, file.relativePath);
    const importPath = './svg/' + file.relativePath.replace(/\\/g, '/');

    if (!exportsByDir.has(file.dir)) {
      exportsByDir.set(file.dir, []);
    }

    exportsByDir.get(file.dir)!.push({
      exportName,
      importPath,
      originalName: file.name,
    });
  }

  // Build output content
  const allIconNames = Array.from(usedNames.keys()).sort();

  let content = `// Apollo Core Icons
// Auto-generated exports for all SVG icons
//
// Usage:
//   import { Academy, AlertError, ArrowLeft } from '@uipath/apollo-core/icons';
//
// All exports are tree-shakeable - only imported icons will be bundled.

`;

  // Don't generate exports - just a comment file
  content += `// Apollo Core Icons
//
// NOTE: This file does not export actual icon components.
// Icon components are generated in the framework-specific packages:
// - For React: import from '@uipath/apollo-react/icons'
//
// Raw SVG files are available at:
// - import svg from '@uipath/apollo-core/icons/svg/academy.svg'

export type { IconName } from './types';
export { iconNames } from './types';
`;

  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
  console.log(
    `✅ Generated ${svgFiles.length} icon exports and types → ${OUTPUT_FILE}`
  );

  // Generate types file with iconNames array only
  generateTypesFile(allIconNames);
}

// ============================================================================
// Generate types.ts file with only TypeScript types and iconNames array
// ============================================================================

function generateTypesFile(iconNames: string[]): void {
  const TYPES_FILE = path.join(ICONS_DIR, 'types.ts');

  const typeUnion = iconNames.map((name) => `  | '${name}'`).join('\n');
  const namesArray = iconNames.map((name) => `  '${name}',`).join('\n');

  const fileContent = `// Auto-generated icon types and names
// This file contains only types and the iconNames array without importing SVG files
// For actual SVG imports, use index.ts directly

export type IconName =
${typeUnion};

export const iconNames: readonly IconName[] = [
${namesArray}
] as const;
`;

  fs.writeFileSync(TYPES_FILE, fileContent, 'utf8');
  console.log(`✅ Generated types file with ${iconNames.length} icon names (no SVG imports)`);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log('\n🎨 Generating icon exports and types...\n');

  if (!fs.existsSync(SVG_DIR)) {
    console.error(`❌ SVG directory not found: ${SVG_DIR}`);
    process.exit(1);
  }

  // Get all SVG files
  const svgFiles = getAllSvgFiles(SVG_DIR);
  console.log(`📊 Found ${svgFiles.length} SVG files`);

  // Sort files by name for consistent output
  svgFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  // Generate index.ts with exports and types
  generateIconExports(svgFiles);

  console.log('\n✨ Icon generation complete!\n');
}

main().catch((error) => {
  console.error('\n❌ Error during generation:', error);
  process.exit(1);
});
