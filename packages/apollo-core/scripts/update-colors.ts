#!/usr/bin/env tsx

/**
 * Update Colors Script
 *
 * Replaces hardcoded colors in SVG files with CSS variables and currentColor.
 * This allows icons to inherit colors from their parent elements and support theming.
 *
 * Special handling:
 * - BPMN canvas icons: white → var(--color-background)
 * - alert-trace-log-levels: white → var(--color-background)
 * - All other icons: white → var(--color-foreground)
 *
 * Uses async file I/O with batching for better performance.
 */

import {
  readdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import {
  dirname,
  join,
  resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COLORS_TO_REPLACE = [
  { color: '#526069', replacement: 'currentColor' }, // Default icon color
  { color: '#526069ff', replacement: 'currentColor' }, // With alpha channel
  { color: '#CFD8DD', replacement: 'var(--color-icon)' }, // Icon default color (CSS variable)
  { color: '#cfd8dd', replacement: 'var(--color-icon)' }, // Lowercase variant
  { color: '#CFD8DDff', replacement: 'var(--color-icon)' }, // With alpha channel
  { color: '#cfd8ddff', replacement: 'var(--color-icon)' }, // Lowercase with alpha
  { color: 'white', replacement: 'var(--color-foreground)' }, // White color
  { color: '#fff', replacement: 'var(--color-foreground)' }, // White hex (short)
  { color: '#ffffff', replacement: 'var(--color-foreground)' }, // White hex (full)
  { color: '#FFF', replacement: 'var(--color-foreground)' }, // White hex uppercase (short)
  { color: '#FFFFFF', replacement: 'var(--color-foreground)' }, // White hex uppercase (full)
];

const MAX_DEPTH = 10; // Maximum directory nesting depth to prevent infinite recursion
const DRY_RUN = process.argv.includes('--dry-run');

interface Stats {
  totalFiles: number;
  filesChanged: number;
  replacements: number;
}

/**
 * Sanitize SVG content to remove potentially malicious elements
 * Removes: <script>, <foreignObject>, event handlers (onclick, onload, etc.)
 */
function sanitizeSvg(content: string): string {
  let sanitized = content;

  // Remove <script> tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove <foreignObject> tags (can contain HTML/scripts)
  sanitized = sanitized.replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '');

  // Remove event handler attributes (onclick, onload, onmouseover, etc.)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');

  // Remove javascript: protocol in href/xlink:href
  sanitized = sanitized.replace(/(xlink:)?href\s*=\s*["']javascript:[^"']*["']/gi, '');

  // Remove data: URLs that could contain scripts (except safe image types)
  sanitized = sanitized.replace(/(xlink:)?href\s*=\s*["']data:(?!image\/(png|jpg|jpeg|gif|svg\+xml|webp))[^"']*["']/gi, '');

  return sanitized;
}

async function getAllSvgFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function traverse(currentDir: string, depth: number = 0): Promise<void> {
    // Prevent infinite recursion from symlink loops or malformed directory structures
    if (depth > MAX_DEPTH) {
      throw new Error(`Maximum directory depth (${MAX_DEPTH}) exceeded at: ${currentDir}`);
    }

    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch (error) {
      console.error(`❌ Error reading directory ${currentDir}:`, (error as Error).message);
      return;
    }

    // Process entries concurrently for better performance
    const results = await Promise.allSettled(
      entries.map(async (entry) => {
        const fullPath = join(currentDir, entry.name);

        if (entry.isDirectory()) {
          // Skip third-party directory - preserve original brand colors
          if (entry.name === 'third-party') {
            console.log(`⏭️  Skipping third-party directory: ${fullPath}`);
            return;
          }
          await traverse(fullPath, depth + 1);
        } else if (entry.name.endsWith('.svg')) {
          files.push(fullPath);
        }
      })
    );

    // Log any errors that occurred
    results.forEach((result) => {
      if (result.status === 'rejected') {
        console.error(`❌ Error processing entry:`, result.reason);
      }
    });
  }

  await traverse(dir);
  return files;
}

function replaceColorsInSvg(content: string, filePath: string): { content: string; replacements: number } {
  let newContent = content;
  let replacements = 0;

  // Check if this is a BPMN canvas icon
  const isBpmnCanvas = filePath.includes('ui-bpmn-canvas');
  // Check if this is the alert-trace-log-levels icon
  const isAlertTraceLogLevels = filePath.includes('alert-trace-log-levels');
  const isUnarchive = filePath.includes('unarchive');

  for (const { color, replacement } of COLORS_TO_REPLACE) {
    // For BPMN canvas icons, apply special replacements
    let actualReplacement = replacement;

    if (isBpmnCanvas) {
      // In BPMN canvas: #526069 -> currentColor (already default)
      // In BPMN canvas: white -> var(--color-background) instead of var(--color-foreground)
      if (color === 'white' || color === '#fff' || color === '#ffffff' ||
          color === '#FFF' || color === '#FFFFFF') {
        actualReplacement = 'var(--color-background)';
      }
    }

    // Special case for alert-trace-log-levels icon
    if (isAlertTraceLogLevels) {
      if (color === 'white' || color === '#fff' || color === '#ffffff' ||
          color === '#FFF' || color === '#FFFFFF') {
        actualReplacement = 'var(--color-background)';
      }
    }

    if (isUnarchive) {
      if (color === 'white' || color === '#fff' || color === '#ffffff' ||
          color === '#FFF' || color === '#FFFFFF') {
        actualReplacement = 'var(--color-background)';
      }
    }

    // Replace in fill attributes
    const fillRegex = new RegExp(`fill="${color}"`, 'gi');
    const fillMatches = newContent.match(fillRegex);
    if (fillMatches) {
      replacements += fillMatches.length;
      newContent = newContent.replace(fillRegex, `fill="${actualReplacement}"`);
    }

    // Replace in stroke attributes
    const strokeRegex = new RegExp(`stroke="${color}"`, 'gi');
    const strokeMatches = newContent.match(strokeRegex);
    if (strokeMatches) {
      replacements += strokeMatches.length;
      newContent = newContent.replace(strokeRegex, `stroke="${actualReplacement}"`);
    }

    // Replace in style attributes (e.g., style="fill:#526069")
    const styleFillRegex = new RegExp(`fill:${color}`, 'gi');
    const styleFillMatches = newContent.match(styleFillRegex);
    if (styleFillMatches) {
      replacements += styleFillMatches.length;
      newContent = newContent.replace(styleFillRegex, `fill:${actualReplacement}`);
    }

    const styleStrokeRegex = new RegExp(`stroke:${color}`, 'gi');
    const styleStrokeMatches = newContent.match(styleStrokeRegex);
    if (styleStrokeMatches) {
      replacements += styleStrokeMatches.length;
      newContent = newContent.replace(styleStrokeRegex, `stroke:${actualReplacement}`);
    }
  }

  return { content: newContent, replacements };
}

async function main() {
  // Validate script execution context to prevent directory traversal attacks
  if (!__dirname.includes('/apollo-core/scripts') && !__dirname.includes('\\apollo-core\\scripts')) {
    throw new Error('Invalid script execution context: must be run from apollo-core/scripts directory');
  }

  const svgDir = resolve(__dirname, '../src/icons/svg');

  // Validate paths contain no null bytes
  if (svgDir.includes('\0')) {
    throw new Error('Invalid path: contains null byte');
  }

  // Validate that the base directory itself is in the expected location
  if (!svgDir.includes('apollo-core/src/icons/svg') && !svgDir.includes('apollo-core\\src\\icons\\svg')) {
    throw new Error(`Invalid base directory: ${svgDir}`);
  }

  console.log('\n🎨 Removing hardcoded colors from SVG files...\n');
  console.log(`Mode: ${DRY_RUN ? '🧪 DRY RUN (no changes will be made)' : '✏️  PROCESSING'}\n`);

  const svgFiles = await getAllSvgFiles(svgDir);
  const stats: Stats = {
    totalFiles: svgFiles.length,
    filesChanged: 0,
    replacements: 0,
  };

  console.log(`📋 Found ${svgFiles.length} SVG files\n`);

  // Process files in batches for better performance
  const BATCH_SIZE = 50;
  for (let i = 0; i < svgFiles.length; i += BATCH_SIZE) {
    const batch = svgFiles.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (filePath) => {
        try {
          const content = await readFile(filePath, 'utf-8');

          // Sanitize SVG to remove potentially malicious content
          const sanitizedContent = sanitizeSvg(content);

          // Check if sanitization removed anything
          if (sanitizedContent !== content) {
            console.log(`🛡️  Sanitized: ${filePath.replace(svgDir + '/', '')}`);
          }

          const { content: newContent, replacements } = replaceColorsInSvg(sanitizedContent, filePath);

          if (replacements > 0 || sanitizedContent !== content) {
            stats.filesChanged++;
            stats.replacements += replacements;

            const relativePath = filePath.replace(svgDir + '/', '');
            console.log(`✏️  ${relativePath}: ${replacements} replacement(s)`);

            if (!DRY_RUN) {
              await writeFile(filePath, newContent, 'utf-8');
            }
          }
        } catch (error) {
          console.error(`❌ Error processing ${filePath}:`, (error as Error).message);
        }
      })
    );

    // Log any rejected promises
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`❌ Batch processing error:`, result.reason);
      }
    });
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total files scanned: ${stats.totalFiles}`);
  console.log(`   Files changed: ${stats.filesChanged}`);
  console.log(`   Total replacements: ${stats.replacements}`);

  if (DRY_RUN) {
    console.log(`\n💡 Run without --dry-run to apply changes\n`);
  } else {
    console.log(`\n✅ Color replacement complete!\n`);
  }
}

main().catch((error) => {
  console.error('\n❌ Error during processing:', error);
  process.exit(1);
});
