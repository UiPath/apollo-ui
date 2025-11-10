#!/usr/bin/env tsx
/**
 * Registry Generation Script
 *
 * Automatically generates shadcn/ui registry JSON files from component source.
 * This ensures npm package and registry stay in sync.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { RegistryItem } from '../schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPONENTS_DIR = path.join(__dirname, '../../src/components/ui');
const REGISTRY_OUTPUT_DIR = path.join(__dirname, '../r');
const REGISTRY_FILE = path.join(__dirname, '../registry.json');

/**
 * Component metadata: dependencies and descriptions
 */
const componentMetadata: Record<
  string,
  {
    title: string;
    description: string;
    dependencies?: string[];
    registryDependencies?: string[];
  }
> = {
  button: {
    title: 'Button',
    description: 'Displays a button or a component that looks like a button.',
    dependencies: ['@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge'],
  },
  card: {
    title: 'Card',
    description: 'Displays a card with header, content, and footer.',
    dependencies: [],
  },
  input: {
    title: 'Input',
    description: 'Displays a form input field.',
    dependencies: [],
  },
  label: {
    title: 'Label',
    description: 'Renders an accessible label associated with controls.',
    dependencies: ['@radix-ui/react-label', 'class-variance-authority'],
  },
  select: {
    title: 'Select',
    description: 'Displays a list of options for the user to pick from—triggered by a button.',
    dependencies: ['@radix-ui/react-select'],
  },
  dialog: {
    title: 'Dialog',
    description:
      'A window overlaid on either the primary window or another dialog window, rendering the content underneath inert.',
    dependencies: ['@radix-ui/react-dialog'],
  },
  'dropdown-menu': {
    title: 'Dropdown Menu',
    description:
      'Displays a menu to the user — such as a set of actions or functions — triggered by a button.',
    dependencies: ['@radix-ui/react-dropdown-menu'],
  },
  tooltip: {
    title: 'Tooltip',
    description:
      'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
    dependencies: ['@radix-ui/react-tooltip'],
  },
  popover: {
    title: 'Popover',
    description: 'Displays rich content in a portal, triggered by a button.',
    dependencies: ['@radix-ui/react-popover'],
  },
  tabs: {
    title: 'Tabs',
    description:
      'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
    dependencies: ['@radix-ui/react-tabs'],
  },
};

/**
 * Generate registry item for a single component
 */
function generateComponentRegistry(componentName: string): RegistryItem {
  const componentPath = path.join(COMPONENTS_DIR, `${componentName}.tsx`);

  if (!fs.existsSync(componentPath)) {
    throw new Error(`Component file not found: ${componentPath}`);
  }

  const content = fs.readFileSync(componentPath, 'utf-8');
  const metadata = componentMetadata[componentName];

  if (!metadata) {
    throw new Error(`Metadata not found for component: ${componentName}`);
  }

  return {
    name: componentName,
    type: 'registry:ui',
    title: metadata.title,
    description: metadata.description,
    dependencies: metadata.dependencies,
    registryDependencies: metadata.registryDependencies,
    files: [
      {
        path: `components/ui/${componentName}.tsx`,
        type: 'registry:ui',
        content,
      },
    ],
  };
}

/**
 * Main generation function
 */
function main() {
  console.log('🚀 Generating shadcn/ui registry...\n');

  // Ensure output directory exists
  if (!fs.existsSync(REGISTRY_OUTPUT_DIR)) {
    fs.mkdirSync(REGISTRY_OUTPUT_DIR, { recursive: true });
  }

  const components = Object.keys(componentMetadata);
  let successCount = 0;
  let errorCount = 0;

  // Generate registry for each component
  components.forEach((componentName) => {
    try {
      const registry = generateComponentRegistry(componentName);
      const outputPath = path.join(REGISTRY_OUTPUT_DIR, `${componentName}.json`);

      fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2), 'utf-8');

      console.log(`✓ ${componentName.padEnd(15)} → ${path.relative(process.cwd(), outputPath)}`);
      successCount++;
    } catch (error) {
      console.error(
        `✗ ${componentName.padEnd(15)} → Error: ${error instanceof Error ? error.message : String(error)}`
      );
      errorCount++;
    }
  });

  // Read and update main registry.json
  const registryData = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));

  console.log(`\n📄 Registry manifest: ${path.relative(process.cwd(), REGISTRY_FILE)}`);
  console.log(`   - ${registryData.items.length} components registered`);
  console.log(`   - Name: ${registryData.name}`);
  console.log(`   - Homepage: ${registryData.homepage}`);

  // Summary
  console.log(`\n✅ Registry generation complete!`);
  console.log(`   - ${successCount} components generated`);
  if (errorCount > 0) {
    console.log(`   - ${errorCount} errors`);
    process.exit(1);
  }
}

main();
