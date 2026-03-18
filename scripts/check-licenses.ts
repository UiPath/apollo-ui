#!/usr/bin/env tsx
/**
 * Validates all dependency licenses against UiPath FOSS license standard.
 * Uses `license-checker` to read package.json license fields directly,
 * covering the full transitive dependency tree from node_modules.
 *
 * Source: https://uipath.atlassian.net/wiki/spaces/LEG/pages/2861433455/FOSS+license+standard
 * Policy: GO (Permissive Licenses) - approved for use and distribution without legal approval
 */

import { execSync } from 'node:child_process';
import { appendFileSync, writeFileSync } from 'node:fs';

const approvedLicenses = new Set([
  'AFL-1.1', 'AFL-1.2', 'AFL-2.0', 'AFL-2.1', 'AMPAS', 'APAFML', 'Adobe-2006',
  'Afmparse', 'ADSL', 'AMDPLPA', 'ANTLR-PD', 'Apache-1.0', 'Apache-1.1',
  'Apache-2.0', 'AML', 'Artistic-1.0', 'Artistic-1.0-Perl', 'Artistic-1.0-cl8',
  'Artistic-2.0', 'AAL', 'Bahyph', 'Barr', 'Beerware', 'BSL-1.0', 'Borceux',
  'BSD-1-Clause', 'BSD-2-Clause', 'BSD-2-Clause-FreeBSD', 'BSD-2-Clause-NetBSD',
  'BSD-3-Clause', 'BSD-3-Clause-Clear', 'BSD-3-Clause-No-Nuclear-License-2014',
  'BSD-3-Clause-No-Nuclear-Warranty', 'BSD-4-Clause', 'BSD-Source-Code',
  'BSD-3-Clause-Attribution', '0BSD', 'BSD-2-Clause-Patent', 'BSD-4-Clause-UC',
  'bzip2-1.0.5', 'bzip2-1.0.6', 'CECILL-B', 'ClArtistic', 'MIT-CMU',
  'CNRI-Jython', 'CNRI-Python', 'CNRI-Python-GPL-Compatible', 'Condor-1.1',
  'CC0-1.0', 'CC-BY-3.0', 'CC-BY-4.0', 'Crossword', 'CrystalStacker', 'Cube',
  'curl', 'diffmark', 'WTFPL', 'DOC', 'DSDP', 'ECL-1.0', 'ECL-2.0', 'eGenix',
  'EFL-1.0', 'EFL-2.0', 'MIT-advertising', 'MIT-enna', 'Entessa', 'Fair',
  'MIT-feh', 'FTL', 'Giftware', 'HPND', 'IBM-pibs', 'ICU', 'ImageMagick', 'IJG',
  'Info-ZIP', 'Intel', 'ISC', 'JasPer-2.0', 'LPPL-1.3c', 'BSD-3-Clause-LBNL',
  'Leptonica', 'Libpng', 'libtiff', 'Linux-OpenIB', 'LPL-1.02', 'LPL-1.0',
  'MTLL', 'MPL-2.0', 'MS-PL', 'MirOS', 'MITNFA', 'MIT', 'MIT-0', 'mpich2',
  'Multics', 'Mup', 'NASA-1.3', 'Naumen', 'NBPL-1.0', 'Net-SNMP', 'NetCDF',
  'Newsletr', 'NLPL', 'NRL', 'NTP', 'OGTSL', 'OLDAP-2.2.2', 'OLDAP-1.1',
  'OLDAP-1.2', 'OLDAP-1.3', 'OLDAP-1.4', 'OLDAP-2.0', 'OLDAP-2.0.1', 'OLDAP-2.1',
  'OLDAP-2.2', 'OLDAP-2.2.1', 'OLDAP-2.3', 'OLDAP-2.4', 'OLDAP-2.5', 'OLDAP-2.6',
  'OLDAP-2.7', 'OLDAP-2.8', 'OML', 'OpenSSL', 'PHP-3.0', 'PHP-3.01', 'Plexus',
  'PostgreSQL', 'psutils', 'Python-2.0', 'Qhull', 'Rdisc', 'RSA-MD', 'Ruby',
  'Saxpath', 'SWL', 'SGI-B-2.0', 'Spencer-86', 'Spencer-94', 'Spencer-99',
  'SMLNJ', 'TCL', 'TCP-wrappers', 'TU-Berlin-1.0', 'TU-Berlin-2.0', 'Unlicense',
  'Unicode-DFS-2015', 'Unicode-DFS-2016', 'UPL-1.0', 'NCSA', 'VSL-1.0',
  'W3C-20150513', 'W3C-19980720', 'W3C', 'Wsuipa', 'Xnet', 'X11', 'Xerox',
  'XFree86-1.1', 'xinetd', 'xpp', 'Zed', 'Zend-2.0', 'Zlib',
  'zlib-acknowledgement', 'ZPL-1.1', 'ZPL-2.0', 'ZPL-2.1',
  'BlueOak-1.0.0', 'BSD-2-Clause-Views', 'JSON',
]);

// Note: BouncyCastle and nvidia-gov from the GO list are not valid SPDX identifiers.
// They may require manual review if detected.

// Packages excluded from license checks with documented reasons.
// Each entry must have a justification — do not add packages without one.
const excludedPackages: Record<string, string> = {
  // Platform-specific native binary for sharp image processing.
  // Licensed as LGPL-3.0-or-later but used only as a pre-built binary (not linked),
  // which is permitted under LGPL. Only installed on matching OS/arch.
  '@img/sharp-libvips-darwin-arm64': 'LGPL pre-built binary, not linked',
  '@img/sharp-libvips-darwin-x64': 'LGPL pre-built binary, not linked',
  '@img/sharp-libvips-linux-arm64': 'LGPL pre-built binary, not linked',
  '@img/sharp-libvips-linux-x64': 'LGPL pre-built binary, not linked',
  '@img/sharp-libvips-linuxmusl-arm64': 'LGPL pre-built binary, not linked',
  '@img/sharp-libvips-linuxmusl-x64': 'LGPL pre-built binary, not linked',
  '@img/sharp-libvips-win32-ia32': 'LGPL pre-built binary, not linked',
  '@img/sharp-libvips-win32-x64': 'LGPL pre-built binary, not linked',
  // Missing license field in package.json. Actual license is MIT per GitHub repo
  // (https://github.com/fabiospampinato/khroma). Transitive dep of mermaid.
  'khroma': 'MIT per GitHub repo, missing license field in package.json',
};

/**
 * Checks if a SPDX license expression is approved.
 * Handles OR (any branch approved = pass) and AND (all parts must be approved).
 */
function isApproved(spdx: string): boolean {
  const normalized = spdx.replace(/[()]/g, '');
  const branches = normalized.split(/\s+OR\s+/);
  return branches.some((branch) => {
    const parts = branch.split(/\s+AND\s+/);
    return parts.every((part) => approvedLicenses.has(part.trim()));
  });
}

interface PackageInfo {
  name: string;
  versions: string[];
  paths: string[];
  license: string;
}

function writeReport(markdown: string) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  }
  if (process.env.GITHUB_ACTIONS) {
    writeFileSync('/tmp/license-report.md', markdown);
  }
}

try {
  const json = execSync('npx -y license-checker --json --excludePrivatePackages', { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  const rawData: Record<string, { licenses: string; repository?: string; path?: string }> = JSON.parse(json);

  // Transform license-checker format (keyed by pkg@version) to group-by-license format
  const data: Record<string, PackageInfo[]> = {};
  for (const [pkgAtVersion, info] of Object.entries(rawData)) {
    const lastAt = pkgAtVersion.lastIndexOf('@');
    const name = lastAt > 0 ? pkgAtVersion.substring(0, lastAt) : pkgAtVersion;
    const version = lastAt > 0 ? pkgAtVersion.substring(lastAt + 1) : 'unknown';
    const license = String(info.licenses || 'Unknown');

    if (!data[license]) data[license] = [];
    const existing = data[license].find(p => p.name === name);
    if (existing) {
      existing.versions.push(version);
      if (info.path) existing.paths.push(info.path);
    } else {
      data[license].push({ name, versions: [version], paths: info.path ? [info.path] : [], license });
    }
  }

  const total = Object.values(data).reduce((sum, pkgs) => sum + pkgs.length, 0);
  const violations: { name: string; version: string; license: string }[] = [];
  const excluded: { name: string; version: string; license: string; reason: string }[] = [];
  const licenseCounts: Record<string, number> = {};

  for (const [license, packages] of Object.entries(data)) {
    licenseCounts[license] = (licenseCounts[license] || 0) + packages.length;

    if (!isApproved(license)) {
      for (const pkg of packages) {
        if (excludedPackages[pkg.name]) {
          excluded.push({ name: pkg.name, version: pkg.versions.join(', '), license, reason: excludedPackages[pkg.name] });
          continue;
        }
        violations.push({ name: pkg.name, version: pkg.versions.join(', '), license });
      }
    }
  }

  // Build summary markdown
  const lines: string[] = [];
  lines.push('# Dependency License Review');
  lines.push('');

  lines.push(`- :white_check_mark: **${total}** package(s) scanned`);

  if (violations.length === 0) {
    lines.push(`- :white_check_mark: No license issues found`);
  } else {
    lines.push(`- :x: **${violations.length}** package(s) with incompatible licenses`);
  }

  if (excluded.length > 0) {
    lines.push(`- :warning: **${excluded.length}** package(s) excluded (see details below)`);
  }

  // License distribution
  const sorted = Object.entries(licenseCounts).sort((a, b) => b[1] - a[1]);
  lines.push('');
  lines.push('<details>');
  lines.push('<summary>License distribution</summary>');
  lines.push('');
  lines.push('| License | Packages |');
  lines.push('|---------|----------|');
  for (const [license, count] of sorted) {
    lines.push(`| ${license} | ${count} |`);
  }
  lines.push('');
  lines.push('</details>');

  if (violations.length > 0) {
    lines.push('');
    lines.push('## Incompatible Licenses');
    lines.push('');
    lines.push('| Package | Version | License |');
    lines.push('|---------|---------|---------|');
    for (const v of violations) {
      lines.push(`| ${v.name} | ${v.version} | ${v.license} |`);
    }
    lines.push('');
    lines.push('> Approved licenses are defined in `scripts/check-licenses.ts`');
    lines.push('> Source: [UiPath FOSS License Standard](https://uipath.atlassian.net/wiki/spaces/LEG/pages/2861433455/FOSS+license+standard)');
  }

  if (excluded.length > 0) {
    lines.push('');
    lines.push('<details>');
    lines.push('<summary>Excluded packages</summary>');
    lines.push('');
    lines.push('| Package | Version | License | Reason |');
    lines.push('|---------|---------|---------|--------|');
    for (const e of excluded) {
      lines.push(`| ${e.name} | ${e.version} | ${e.license} | ${e.reason} |`);
    }
    lines.push('');
    lines.push('</details>');
  }

  const markdown = lines.join('\n');
  writeReport(markdown);

  // Console output
  if (violations.length > 0) {
    console.error(`\nFound ${violations.length} package(s) with unapproved licenses:\n`);
    console.error('| Package | Version | License |');
    console.error('|---------|---------|---------|');
    for (const v of violations) {
      console.error(`| ${v.name} | ${v.version} | ${v.license} |`);
    }
    console.error('\nApproved licenses are defined in scripts/check-licenses.ts');
    console.error('Source: https://uipath.atlassian.net/wiki/spaces/LEG/pages/2861433455/FOSS+license+standard\n');
    process.exit(1);
  } else {
    console.log(`All ${total} packages have approved licenses.`);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`License check failed unexpectedly: ${message}`);
  writeReport(`# Dependency License Review\n\n:x: License check failed unexpectedly:\n\n\`\`\`\n${message}\n\`\`\``);
  process.exit(1);
}
