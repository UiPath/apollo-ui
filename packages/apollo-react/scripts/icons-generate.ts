#!/usr/bin/env tsx

/**
 * Generate React Icon Components
 *
 * This script generates React components for each SVG icon from apollo-core
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read icon names from apollo-core
const APOLLO_CORE_PATH = path.join(__dirname, '../../apollo-core');
const ICONS_SVG_DIR = path.join(APOLLO_CORE_PATH, 'src/icons/svg');
const OUTPUT_DIR = path.join(__dirname, '../src/icons');

// ============================================================================
// Utilities
// ============================================================================

function toPascalCase(str: string): string {
  // Known acronyms and proper capitalizations that should be preserved
  const knownWords: Record<string, string> = {
    'api': 'API',
    'ui': 'UI',
    'url': 'URL',
    'html': 'HTML',
    'xml': 'XML',
    'json': 'JSON',
    'http': 'HTTP',
    'https': 'HTTPS',
    'sql': 'SQL',
    'id': 'ID',
    'uuid': 'UUID',
    'pdf': 'PDF',
    'csv': 'CSV',
    'ai': 'AI',
    'ml': 'ML',
    'crm': 'CRM',
    'sap': 'SAP',
    'aws': 'AWS',
    'sdk': 'SDK',
    'sso': 'SSO',
    'oauth': 'OAuth',
    'jwt': 'JWT',
    'vpn': 'VPN',
    'dns': 'DNS',
    'ssh': 'SSH',
    'ftp': 'FTP',
    'smtp': 'SMTP',
    'imap': 'IMAP',
    'pop3': 'POP3',
    'xpath': 'XPath',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'linkedin': 'LinkedIn',
    'youtube': 'YouTube',
    'onedrive': 'OneDrive',
    'sharepoint': 'SharePoint',
    'powerpoint': 'PowerPoint',
    'onenote': 'OneNote',
    'uipath': 'UiPath',
  };

  // Compound words that should be split (before general processing)
  const compoundWords: Record<string, string> = {
    'gridlist': 'grid-list',
  };

  // Replace compound words with hyphenated versions
  let processedStr = str;
  for (const [compound, replacement] of Object.entries(compoundWords)) {
    const regex = new RegExp(compound, 'gi');
    processedStr = processedStr.replace(regex, replacement);
  }

  return processedStr
    .split(/[-\s]+/) // Split on hyphens AND spaces
    .map((word) => {
      const lowerWord = word.toLowerCase();
      // Check if it's a known acronym/word
      if (knownWords[lowerWord]) {
        return knownWords[lowerWord];
      }
      // Otherwise, capitalize first letter and keep the rest as-is (don't force lowercase)
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}

function getAllSvgFiles(dir: string, basePath = ''): Array<{ name: string; relativePath: string; dir: string }> {
  const svgFiles: Array<{ name: string; relativePath: string; dir: string }> = [];
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

function transformSvgToReact(svgContent: string): string {
  let content = svgContent
    // Remove xmlns:xlink (React doesn't support it)
    .replace(/\s*xmlns:xlink="[^"]*"/g, '');

  // First pass: Handle namespace attributes (e.g., xlink:href -> xlinkHref)
  content = content.replace(/\s(\w+):(\w+)=/g, (_match, namespace, attr) => {
    // Convert to camelCase (e.g., xlink:href -> xlinkHref)
    return ` ${namespace}${attr.charAt(0).toUpperCase()}${attr.slice(1)}=`;
  });

  // Second pass: Convert kebab-case attributes to camelCase
  content = content.replace(/\s([\w]+-[\w-]+)=/g, (_match, attrName) => {
    // Convert kebab-case to camelCase
    const camelCase = attrName.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
    return ` ${camelCase}=`;
  });

  // Transform style attributes from string to object
  content = content.replace(/style="([^"]*)"/g, (_match, styleStr) => {
    const styles = styleStr
      .split(';')
      .filter((s: string) => s.trim())
      .map((s: string) => {
        const [prop, value] = s.split(':').map((p: string) => p.trim());
        const camelProp = prop.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
        return `${camelProp}:"${value}"`;
      })
      .join(',');
    return `style={{${styles}}}`;
  });

  return content;
}

// ============================================================================
// Generate React Components
// ============================================================================

async function generateIconComponents(): Promise<void> {
  console.log('\n🎨 Generating React icon components...\n');

  if (!fs.existsSync(ICONS_SVG_DIR)) {
    console.error(`❌ SVG directory not found: ${ICONS_SVG_DIR}`);
    process.exit(1);
  }

  // Get all SVG files
  const svgFiles = getAllSvgFiles(ICONS_SVG_DIR);
  console.log(`📊 Found ${svgFiles.length} SVG files`);

  // Clean and recreate output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const usedNames = new Map<string, string>();
  const components: string[] = [];

  // Generate a React component for each icon
  for (const file of svgFiles) {
    const nameWithoutExt = file.name.slice(0, -4);
    let componentName = toPascalCase(nameWithoutExt);

    // Handle names starting with numbers
    if (/^\d/.test(componentName)) {
      const dirName = file.dir ? file.dir.split(path.sep).pop() : 'Icon';
      componentName = toPascalCase(dirName ?? '') + componentName;
    }

    // Handle duplicates
    if (usedNames.has(componentName)) {
      const dirName = file.dir ? file.dir.split(path.sep).pop() : 'Icon';
      componentName = toPascalCase(dirName ?? '') + componentName;
    }

    usedNames.set(componentName, file.relativePath);

    // Read SVG content
    const svgPath = path.join(ICONS_SVG_DIR, file.relativePath);
    let svgContent = fs.readFileSync(svgPath, 'utf8');

    // Remove XML declaration and comments
    svgContent = svgContent
      .replace(/<\?xml[^>]*\?>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();

    // Transform SVG to React-compatible format
    svgContent = transformSvgToReact(svgContent);

    // Extract SVG attributes and inner content
    const svgMatch = svgContent.match(/<svg([^>]*)>([\s\S]*)<\/svg>/);
    if (!svgMatch) {
      console.warn(`⚠️  Could not parse SVG: ${file.name}`);
      continue;
    }

    const [, svgAttrs, innerSvg] = svgMatch;

    // Generate React component
    const componentContent = `// Auto-generated from ${file.relativePath}
import React from 'react';

export interface ${componentName}Props extends React.SVGProps<SVGSVGElement> {}

export const ${componentName} = React.forwardRef<SVGSVGElement, ${componentName}Props>(
  (props, ref) => (
    <svg${svgAttrs} ref={ref} {...props}>
      ${innerSvg.trim()}
    </svg>
  )
);

${componentName}.displayName = '${componentName}';

export default ${componentName};
`;

    const outputPath = path.join(OUTPUT_DIR, `${componentName}.tsx`);
    fs.writeFileSync(outputPath, componentContent, 'utf8');
    components.push(componentName);
  }

  // Generate index file
  const indexContent = `// Auto-generated React icon components
// Export all icons for tree-shaking

${components.sort().map(name => `export { ${name}, default as ${name}Icon } from './${name}';`).join('\n')}
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent, 'utf8');

  console.log(`✅ Generated ${components.length} React icon components → ${OUTPUT_DIR}`);
  console.log('\n✨ Icon generation complete!\n');
}

generateIconComponents().catch((error) => {
  console.error('\n❌ Error during generation:', error);
  process.exit(1);
});
