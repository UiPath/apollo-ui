#!/usr/bin/env tsx

/**
 * Generate React Icon Components with Caching
 * Only regenerates when apollo-core icons change
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APOLLO_CORE_PATH = path.join(__dirname, '../../apollo-core');
const ICONS_SVG_DIR = path.join(APOLLO_CORE_PATH, 'src/icons/svg');
const OUTPUT_DIR = path.join(__dirname, '../src/icons');
const CACHE_FILE = path.join(OUTPUT_DIR, '.cache');

// Get all SVG files recursively
function getAllSvgFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllSvgFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.svg')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Compute hash of all SVG files (based on content and timestamps)
function computeSourceHash(): string {
  if (!fs.existsSync(ICONS_SVG_DIR)) {
    return '';
  }

  const hash = crypto.createHash('sha256');
  const svgFiles = getAllSvgFiles(ICONS_SVG_DIR).sort(); // Sort for consistency

  for (const file of svgFiles) {
    const stats = fs.statSync(file);
    // Hash: file path + modification time + size
    hash.update(`${file}:${stats.mtimeMs}:${stats.size}`);
  }

  return hash.digest('hex');
}

// Check if regeneration is needed
function needsRegeneration(): boolean {
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log('📁 Output directory missing - generating icons...');
    return true;
  }

  if (!fs.existsSync(CACHE_FILE)) {
    console.log('📝 No cache found - generating icons...');
    return true;
  }

  const currentHash = computeSourceHash();
  const cachedHash = fs.readFileSync(CACHE_FILE, 'utf8').trim();

  if (currentHash !== cachedHash) {
    console.log('🔄 Source files changed - regenerating icons...');
    return true;
  }

  console.log('✨ Icons are up to date (using cache)');
  return false;
}

// Main
async function main() {
  if (!needsRegeneration()) {
    return;
  }

  // Run the generator
  execSync('tsx scripts/icons-generate.ts', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });

  // Save cache
  const hash = computeSourceHash();
  fs.writeFileSync(CACHE_FILE, hash, 'utf8');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
