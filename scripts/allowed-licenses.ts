#!/usr/bin/env tsx
/**
 * Outputs comma-separated SPDX license IDs that match UiPath FOSS license standard.
 * Source: https://uipath.atlassian.net/wiki/spaces/LEG/pages/2861433455/FOSS+license+standard
 * Policy: GO (Permissive Licenses) - approved for use and distribution without legal approval
 */

// Static list of approved licenses from UiPath FOSS license standard (GO section)
const approvedLicenses: string[] = [
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
  'CC0-1.0', 'Crossword', 'CrystalStacker', 'Cube', 'curl', 'diffmark',
  'WTFPL', 'DOC', 'DSDP', 'ECL-1.0', 'ECL-2.0', 'eGenix', 'EFL-1.0', 'EFL-2.0',
  'MIT-advertising', 'MIT-enna', 'Entessa', 'Fair', 'MIT-feh', 'FTL',
  'Giftware', 'HPND', 'IBM-pibs', 'ICU', 'ImageMagick', 'IJG', 'Info-ZIP',
  'Intel', 'ISC', 'JasPer-2.0', 'LPPL-1.3c', 'BSD-3-Clause-LBNL', 'Leptonica',
  'Libpng', 'libtiff', 'Linux-OpenIB', 'LPL-1.02', 'LPL-1.0', 'MTLL', 'MS-PL',
  'MirOS', 'MITNFA', 'MIT', 'MIT-0', 'mpich2', 'Multics', 'Mup', 'NASA-1.3',
  'Naumen', 'NBPL-1.0', 'Net-SNMP', 'NetCDF', 'Newsletr', 'NLPL', 'NRL', 'NTP',
  'OGTSL', 'OLDAP-2.2.2', 'OLDAP-1.1', 'OLDAP-1.2', 'OLDAP-1.3', 'OLDAP-1.4',
  'OLDAP-2.0', 'OLDAP-2.0.1', 'OLDAP-2.1', 'OLDAP-2.2', 'OLDAP-2.2.1',
  'OLDAP-2.3', 'OLDAP-2.4', 'OLDAP-2.5', 'OLDAP-2.6', 'OLDAP-2.7', 'OLDAP-2.8',
  'OML', 'OpenSSL', 'PHP-3.0', 'PHP-3.01', 'Plexus', 'PostgreSQL', 'psutils',
  'Python-2.0', 'Qhull', 'Rdisc', 'RSA-MD', 'Ruby', 'Saxpath', 'SWL',
  'SGI-B-2.0', 'Spencer-86', 'Spencer-94', 'Spencer-99', 'SMLNJ', 'TCL',
  'TCP-wrappers', 'TU-Berlin-1.0', 'TU-Berlin-2.0', 'Unlicense',
  'Unicode-DFS-2015', 'Unicode-DFS-2016', 'UPL-1.0', 'NCSA', 'VSL-1.0',
  'W3C-20150513', 'W3C-19980720', 'W3C', 'Wsuipa', 'Xnet', 'X11', 'Xerox',
  'XFree86-1.1', 'xinetd', 'xpp', 'Zed', 'Zend-2.0', 'Zlib',
  'zlib-acknowledgement', 'ZPL-1.1', 'ZPL-2.0', 'ZPL-2.1',
  'BlueOak-1.0.0', 'BSD-2-Clause-Views', 'JSON'
];

// Note: BouncyCastle and nvidia-gov from the GO list are not valid SPDX identifiers
// and cannot be used with dependency-review-action. They may require manual review if detected.

process.stdout.write(approvedLicenses.join(', '));
