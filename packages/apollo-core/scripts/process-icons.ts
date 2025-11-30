#!/usr/bin/env tsx

/**
 * Process Icons - All-in-one icon processing script
 *
 * This script:
 * 1. Normalizes folder and file names from Figma (removes emojis, fixes casing, handles nested folders)
 * 2. Scans all SVG files in src/icons/svg/
 * 3. Generates short, consistent names based on folder structure
 * 4. Renames SVG files to their short names
 * 5. Generates TypeScript exports
 *
 * Usage:
 *   pnpm process-icons           # Process and rename icons
 *   pnpm process-icons --dry-run # Preview changes without renaming
 */

import {
  existsSync,
} from 'node:fs';
import {
  readdir,
  rename,
} from 'node:fs/promises';
import {
  dirname,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import { iconMappingConfig } from './icon-mappings.config.js';

// Validate script execution context to prevent directory traversal attacks
if (!__dirname.includes('/apollo-core/scripts') && !__dirname.includes('\\apollo-core\\scripts')) {
  throw new Error('Invalid script execution context: must be run from apollo-core/scripts directory');
}

const ICONS_DIR = resolve(__dirname, '../src/icons/svg');
const MAX_DEPTH = 10; // Maximum directory nesting depth to prevent infinite recursion

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Validates that a path is within the icons directory to prevent directory traversal
 * Uses path.resolve() to properly handle .. components and path.sep to prevent partial matches
 * Also checks for null bytes which can be used to bypass path validation
 */
function validatePath(targetPath: string): boolean {
  // Check for null bytes which can bypass security checks
  if (targetPath.includes('\0')) {
    return false;
  }

  const normalizedTarget = resolve(targetPath);
  const normalizedBase = resolve(ICONS_DIR);

  // Validate that the base directory itself is in the expected location
  if (!normalizedBase.includes('apollo-core/src/icons/svg') && !normalizedBase.includes('apollo-core\\src\\icons\\svg')) {
    throw new Error(`Invalid base directory: ${normalizedBase}`);
  }

  // Add path.sep to ensure we're checking for a directory boundary
  // This prevents /app/icons-evil from matching /app/icons
  return normalizedTarget.startsWith(normalizedBase + sep);
}

interface IconFile {
  fullPath: string;
  relativePath: string;
  fileName: string;
  folder: string | null;
  depth: number;
}

interface RenameOperation {
  oldPath: string;
  newPath: string;
  oldName: string;
  newName: string;
  shortName: string;
  relativeDir: string;
}

// ============================================================================
// Normalization (Step 1: Figma format → kebab-case)
// ============================================================================

function toKebabCase(str: string): string {
  return str
    .replace(/^.*,\s*[^=]+=/, '') // Remove "Category=X, Icon=" patterns
    .replace(/^[^=]+=/, '') // Remove remaining "Key=" at start
    .replace(/⚠️/g, '') // Remove warning emoji
    .replace(/‼️/g, '') // Remove double exclamation emoji
    .replace(/[^\x00-\x7F]/g, '') // eslint-disable-line no-control-regex
    .replace(/:/g, '-')
    .replace(/&/g, 'and')
    .replace(/\+/g, '-')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface NormalizeOperation {
  oldPath: string;
  newPath: string;
  type: 'file' | 'folder';
  depth: number;
}

async function getAllNormalizeOps(dir: string, operations: NormalizeOperation[] = [], depth: number = 0): Promise<NormalizeOperation[]> {
  // Prevent infinite recursion from symlink loops or malformed directory structures
  if (depth > MAX_DEPTH) {
    throw new Error(`Maximum directory depth (${MAX_DEPTH}) exceeded at: ${dir}`);
  }

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}:`, (error as Error).message);
    return operations;
  }

  const folders: string[] = [];
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      folders.push(entry.name);
    } else if (entry.isFile() && entry.name.endsWith('.svg')) {
      files.push(entry.name);
    }
  }

  // Process subfolders FIRST (depth-first) concurrently
  await Promise.allSettled(
    folders.map(async (folder) => {
      const fullPath = join(dir, folder);
      try {
        await getAllNormalizeOps(fullPath, operations, depth + 1);
      } catch (error) {
        console.error(`❌ Error processing folder ${folder}:`, (error as Error).message);
      }
    })
  );

  // Then add folder rename operations (after processing children)
  for (const folder of folders) {
    const fullPath = join(dir, folder);
    const newName = toKebabCase(folder);
    if (newName !== folder) {
      operations.push({
        oldPath: fullPath,
        newPath: join(dirname(fullPath), newName),
        type: 'folder',
        depth,
      });
    }
  }

  // Process files
  for (const file of files) {
    const fullPath = join(dir, file);
    const nameWithoutExt = file.slice(0, -4);
    const newName = toKebabCase(nameWithoutExt) + '.svg';
    if (newName !== file) {
      operations.push({
        oldPath: fullPath,
        newPath: join(dir, newName),
        type: 'file',
        depth,
      });
    }
  }

  return operations;
}

async function normalizeStructure(): Promise<void> {
  console.log('📋 Step 1: Normalizing folder and file structure...\n');

  const operations = await getAllNormalizeOps(ICONS_DIR);

  if (operations.length === 0) {
    console.log('✅ Structure already normalized!\n');
    return;
  }

  console.log(`Found ${operations.length} items to normalize\n`);

  // Sort by depth (deepest first) to avoid conflicts
  operations.sort((a, b) => b.depth - a.depth);

  if (DRY_RUN) {
    // Show preview
    const byType = { folder: 0, file: 0 };
    for (const op of operations) {
      byType[op.type]++;
    }
    console.log(`  Will normalize: ${byType.folder} folders, ${byType.file} files`);
    console.log('  Examples:');
    for (const op of operations.slice(0, 5)) {
      const relPath = relative(ICONS_DIR, op.oldPath);
      const newRelPath = relative(ICONS_DIR, op.newPath);
      console.log(`    ${op.type === 'folder' ? '📁' : '📄'} ${relPath} → ${newRelPath}`);
    }
    if (operations.length > 5) {
      console.log(`    ... and ${operations.length - 5} more`);
    }
    console.log('\n  ⚠️  In dry-run mode, continuing with current (un-normalized) structure...\n');
    return;
  }

  // Perform renames in batches (sequentially for folders to avoid conflicts)
  const BATCH_SIZE = 50;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    const batch = operations.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (op) => {
        // Validate paths to prevent directory traversal
        if (!validatePath(op.oldPath) || !validatePath(op.newPath)) {
          console.error(`❌ Invalid path detected - path traversal prevented`);
          failed++;
          return;
        }

        try {
          await rename(op.oldPath, op.newPath);
          success++;
        } catch (error) {
          console.error(`❌ Failed to rename ${relative(ICONS_DIR, op.oldPath)}:`, (error as Error).message);
          failed++;
        }
      })
    );
  }

  console.log(`✅ Normalized ${success} items`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed} items`);
  }
  console.log('');
}

// ============================================================================
// Utilities
// ============================================================================

function normalizeFilename(filename: string): string {
  return filename
    .trim()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .replace(/[⚠️‼️]/g, '') // eslint-disable-line no-control-regex, no-misleading-character-class
    .replace(/[^\x00-\x7F]/g, '') // eslint-disable-line no-control-regex
    .replace(/=/g, '-')
    .replace(/,/g, '')
    .replace(/\./g, '-')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

async function getAllSvgFiles(dir: string, basePath = '', depth = 0): Promise<IconFile[]> {
  const files: IconFile[] = [];
  let entries;

  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}:`, (error as Error).message);
    return files;
  }

  // Process entries concurrently for better performance
  const results = await Promise.allSettled(
    entries.map(async (entry) => {
      const fullPath = join(dir, entry.name);
      const relativePath = basePath ? join(basePath, entry.name) : entry.name;

      if (entry.isDirectory()) {
        const subFiles = await getAllSvgFiles(fullPath, relativePath, depth + 1);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.svg')) {
        const parts = relativePath.replace('.svg', '').split('/');
        files.push({
          fullPath,
          relativePath,
          fileName: entry.name,
          folder: parts.length > 1 ? parts[parts.length - 2] ?? null : null,
          depth,
        });
      }
    })
  );

  // Log any errors that occurred
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`❌ Error processing entry in ${dir}:`, result.reason);
    }
  });

  return files;
}

// ============================================================================
// Helper Functions for Name Generation
// ============================================================================

/**
 * Get the mapped prefix for a folder based on configuration
 */
function getMappedPrefix(folder: string): string {
  const { folderPrefixMap, activityFolderMap, classicIconsMap } = iconMappingConfig;

  // Check direct folder mapping first
  if (folderPrefixMap[folder]) {
    return folderPrefixMap[folder];
  }

  // Handle activities folders (plural)
  if (folder.startsWith('activities-')) {
    const folderSuffix = folder.substring('activities-'.length);
    return activityFolderMap[folderSuffix] ?? folderSuffix;
  }

  // Handle activity-activity-* folders (double activity prefix)
  if (folder === 'activity-activity-input-direction') {
    return 'activity-input-direction';
  }

  // Handle activity folders (singular)
  if (folder.startsWith('activity-')) {
    return folder.substring('activity-'.length);
  }

  // Handle classic-icons folders
  if (folder.startsWith('classic-icons-')) {
    const folderSuffix = folder.substring('classic-icons-'.length);
    return classicIconsMap[folderSuffix] ?? folderSuffix;
  }

  return folder;
}

/**
 * Remove common prefixes from filename
 */
function removeCommonPrefixes(filename: string): string {
  const { commonPrefixes } = iconMappingConfig;

  for (const prefix of commonPrefixes) {
    if (filename.startsWith(prefix)) {
      filename = filename.substring(prefix.length);
    }
  }

  return filename;
}

// ============================================================================
// Generate Short Name
// ============================================================================

function generateShortName(relativePath: string): string {
  const withoutExt = relativePath.replace('.svg', '');
  const parts = withoutExt.split('/');
  let filename = parts[parts.length - 1];
  const folder = parts.length > 1 ? parts[parts.length - 2] : null;

  // Special handling for activity sets
  if (parts[0] === 'studio-activities-icon-sets') {
    const categoryMatch = folder?.match(/Activities\s*:\s*(.+)/);
    if (categoryMatch) {
      const category = normalizeFilename(categoryMatch[1] ?? '');
      const action = normalizeFilename(filename ?? '');
      return `${category}-${action}`;
    }
  }

  // Normalize the filename
  filename = normalizeFilename(filename ?? '');

  // Remove folder prefix if it exists in the filename (from previous renames)
  if (folder) {
    const mappedPrefix = getMappedPrefix(folder);
    const folderPrefix = `${folder}-`;
    const mappedFolderPrefix = `${mappedPrefix}-`;

    if (filename.startsWith(mappedFolderPrefix)) {
      filename = filename.substring(mappedFolderPrefix.length);
    } else if (filename.startsWith(folderPrefix)) {
      filename = filename.substring(folderPrefix.length);
    }
  }

  // Remove common prefixes
  filename = removeCommonPrefixes(filename);

  // Handle special cases
  if (iconMappingConfig.specialCases[filename]) {
    filename = iconMappingConfig.specialCases[filename];
  }

  // Rule: If icon is more than 2 folders deep, add parent folder prefix
  const shouldAddPrefix = folder && parts.length > 2;

  if (shouldAddPrefix) {
    const prefix = getMappedPrefix(folder);

    // Only add prefix if filename doesn't already start with it
    if (filename.startsWith(`${prefix}-`)) {
      return filename;
    }

    return `${prefix}-${filename}`;
  }

  return filename;
}

// ============================================================================
// Main Processing
// ============================================================================

async function main(): Promise<void> {
  console.log('\n🎨 Processing icons...\n');
  console.log(`Mode: ${DRY_RUN ? '🧪 DRY RUN (no changes will be made)' : '✏️  PROCESSING'}\n`);

  if (!existsSync(ICONS_DIR)) {
    console.error(`❌ Icons directory not found: ${ICONS_DIR}`);
    process.exit(1);
  }

  // Step 1: Normalize folder/file structure from Figma
  await normalizeStructure();

  // Step 2: Scan all SVG files
  console.log('📋 Step 2: Scanning for SVG icons...');
  const svgFiles = await getAllSvgFiles(ICONS_DIR);
  console.log(`✅ Found ${svgFiles.length} icons\n`);

  // Generate short names and build rename operations
  const nameMapping = new Map<string, string>();
  const renameOps: RenameOperation[] = [];
  const warnings: string[] = [];
  const usedNames = new Map<string, string>();

  // First pass: generate all short names
  for (const file of svgFiles) {
    const shortName = generateShortName(file.relativePath);
    nameMapping.set(file.relativePath, shortName);
  }

  // Second pass: detect duplicates and resolve conflicts
  const nameCounts = new Map<string, number>();
  for (const shortName of nameMapping.values()) {
    nameCounts.set(shortName, (nameCounts.get(shortName) || 0) + 1);
  }

  // Third pass: handle duplicates by adding folder context
  // Group duplicates by short name
  const duplicateGroups = new Map<string, IconFile[]>();
  for (const file of svgFiles) {
    const shortName = nameMapping.get(file.relativePath)!;
    const count = nameCounts.get(shortName) || 0;
    if (count > 1) {
      if (!duplicateGroups.has(shortName)) {
        duplicateGroups.set(shortName, []);
      }
      duplicateGroups.get(shortName)!.push(file);
    }
  }

  // Resolve duplicates: prioritize shorter folder names to keep without prefix
  for (const [shortName, files] of duplicateGroups) {
    // Sort by folder name length (shorter first), then alphabetically
    files.sort((a, b) => {
      const aLen = a.folder?.length ?? 0;
      const bLen = b.folder?.length ?? 0;
      if (aLen !== bLen) return aLen - bLen;
      return (a.folder ?? '').localeCompare(b.folder ?? '');
    });

    // First file keeps the base name, others get folder prefix
    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      let finalName = shortName;

      if (i > 0) {
        // Add folder prefix for non-first files
        if (file.folder) {
          let folderPrefix = file.folder;

          // Use mapped prefix for activities folders
          if (file.folder.startsWith('activities-')) {
            const folderSuffix = file.folder.substring('activities-'.length);
            const activityFolderMap: Record<string, string> = {
              'office365-excel-activities': 'office365-excel',
              'microsoft-office365-apps': 'office365-apps',
              'oracle-netsuite-activities': 'oracle-netsuite',
              'slack-activities': 'slack',
              'vmware-activities': 'vmware',
            };
            folderPrefix = activityFolderMap[folderSuffix] ?? folderSuffix;
          }
          if (file.folder === 'activity-activity-input-direction') {
            folderPrefix = 'activity-input-direction';
          }
          else if (file.folder.startsWith('activity-')) {
            const folderSuffix = file.folder.substring('activity-'.length);
            folderPrefix = folderSuffix;
          }
          if (file.folder.startsWith('classic-icons-')) {
            const folderSuffix = file.folder.substring('classic-icons-'.length);
            const classicIconsMap: Record<string, string> = {
              'gsuite-apps': 'gsuite',
              'google-cloud-platform': 'google-cloud-platform',
              'configuration-panel': 'configuration-panel',
            };
            folderPrefix = classicIconsMap[folderSuffix] ?? folderSuffix;
          }

          finalName = `${folderPrefix}-${shortName}`;

          // If still duplicate, add number suffix
          while (usedNames.has(finalName)) {
            const match = finalName.match(/-(\d+)$/);
            const num = match ? parseInt(match[1]!) + 1 : 2;
            finalName = finalName.replace(/-\d+$/, '') + `-${num}`;
            if (!match) finalName = `${folderPrefix}-${shortName}-${num}`;
          }
        }
      }

      usedNames.set(finalName, file.relativePath);
      nameMapping.set(file.relativePath, finalName);
    }
  }

  // Fourth pass: build rename operations
  for (const file of svgFiles) {
    const shortName = nameMapping.get(file.relativePath)!;

    // For non-duplicates, just use them
    if (!duplicateGroups.has(shortName)) {
      usedNames.set(shortName, file.relativePath);
    }

    const newFileName = `${shortName}.svg`;
    const oldDir = dirname(file.fullPath);
    const newPath = join(oldDir, newFileName);

    if (file.fullPath !== newPath) {
      // Check if target already exists
      if (existsSync(newPath)) {
        warnings.push(`⚠️  Target already exists: ${newFileName} in ${relative(ICONS_DIR, oldDir)}`);
        continue;
      }

      renameOps.push({
        oldPath: file.fullPath,
        newPath,
        oldName: file.fileName,
        newName: newFileName,
        shortName,
        relativeDir: relative(ICONS_DIR, oldDir),
      });
    }
  }

  // Display warnings
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    warnings.forEach((w) => console.log(`  ${w}`));
    console.log('');
  }

  // Display rename operations
  if (renameOps.length === 0) {
    console.log('✅ All icons already have their short names!\n');
    console.log(`📊 Total icons: ${svgFiles.length}`);
    console.log(`📊 Unique names: ${usedNames.size}\n`);
    process.exit(0);
  }

  console.log(`Found ${renameOps.length} icons to rename:\n`);

  // Group by directory
  const byDir = new Map<string, RenameOperation[]>();
  for (const op of renameOps) {
    const dir = op.relativeDir || 'root';
    if (!byDir.has(dir)) {
      byDir.set(dir, []);
    }
    byDir.get(dir)!.push(op);
  }

  // Show summary by directory
  for (const [dir, ops] of byDir) {
    console.log(`📁 ${dir} (${ops.length} files)`);
    const examples = ops.slice(0, 5);
    for (const op of examples) {
      console.log(`  ${op.oldName} → ${op.newName}`);
    }
    if (ops.length > 5) {
      console.log(`  ... and ${ops.length - 5} more`);
    }
    console.log('');
  }

  if (DRY_RUN) {
    console.log('🧪 This was a dry run. No changes were made.\n');
    console.log('💡 Run without --dry-run to actually rename:');
    console.log('   pnpm process-icons\n');
    process.exit(0);
  }

  // Perform renames
  console.log('🚀 Renaming icons...\n');

  let success = 0;
  let failed = 0;

  // Process renames in batches for better performance
  const BATCH_SIZE = 50;
  for (let i = 0; i < renameOps.length; i += BATCH_SIZE) {
    const batch = renameOps.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (op) => {
        // Validate paths to prevent directory traversal
        if (!validatePath(op.oldPath) || !validatePath(op.newPath)) {
          console.error(`❌ Invalid path detected for ${op.oldName} - path traversal prevented`);
          failed++;
          return;
        }

        try {
          await rename(op.oldPath, op.newPath);
          success++;
        } catch (error) {
          console.error(`❌ Failed to rename ${op.oldName}:`, (error as Error).message);
          failed++;
        }
      })
    );
  }

  console.log('\n✨ Done!');
  console.log(`✅ Successfully renamed: ${success} files`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed} files`);
  }

  console.log(`\n📊 Total icons: ${svgFiles.length}`);
  console.log(`📊 Unique names: ${usedNames.size}`);

  console.log('\n💡 Next steps:');
  console.log('   1. Run: pnpm build:icons');
  console.log('   2. Run: pnpm build\n');
}

main().catch((error) => {
  console.error('\n❌ Error during processing:', error);
  process.exit(1);
});
