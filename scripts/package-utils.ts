/**
 * Shared utilities for package scripts.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const rootDir = resolve(__dirname, '..');

export interface PackageJson {
  name: string;
  version: string;
  [key: string]: unknown;
}

export interface PackageInfo {
  path: string;
  version: string;
}

export function getPackageDirs(): string[] {
  return ['packages', 'web-packages'];
}

export function getSubdirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

export function findPackagePath(packageName: string): string | null {
  for (const dir of getPackageDirs()) {
    const packagesDir = join(rootDir, dir);
    const subdirs = getSubdirs(packagesDir);

    for (const subdir of subdirs) {
      const packageJsonPath = join(packagesDir, subdir, 'package.json');
      if (existsSync(packageJsonPath)) {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
        if (pkg.name === packageName) {
          return join(packagesDir, subdir);
        }
      }
    }
  }
  return null;
}

export function findPackageInfo(packageName: string): PackageInfo | null {
  for (const dir of getPackageDirs()) {
    const packagesDir = join(rootDir, dir);
    const subdirs = getSubdirs(packagesDir);

    for (const subdir of subdirs) {
      const packageJsonPath = join(packagesDir, subdir, 'package.json');
      if (existsSync(packageJsonPath)) {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
        if (pkg.name === packageName) {
          return { path: join(packagesDir, subdir), version: pkg.version };
        }
      }
    }
  }
  return null;
}

export function getAllPackageNames(): string[] {
  const names: string[] = [];
  for (const dir of getPackageDirs()) {
    const packagesDir = join(rootDir, dir);
    const subdirs = getSubdirs(packagesDir);

    for (const subdir of subdirs) {
      const packageJsonPath = join(packagesDir, subdir, 'package.json');
      if (existsSync(packageJsonPath)) {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
        if (pkg.name && !pkg.name.includes('playground') && !pkg.name.includes('storybook')) {
          names.push(pkg.name);
        }
      }
    }
  }
  return names;
}
