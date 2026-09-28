import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

interface RegistryFile {
  path: string;
}

interface CssVars {
  theme?: Record<string, string>;
  light?: Record<string, string>;
  dark?: Record<string, string>;
}

interface RegistryItem {
  name: string;
  type: string;
  files?: RegistryFile[];
  registryDependencies?: string[];
  cssVars?: CssVars;
}

interface Registry {
  items: RegistryItem[];
}

interface RequiredCssVars {
  theme: Set<string>;
  runtime: Map<string, Set<'light' | 'dark'>>;
}

interface AvailableCssVars {
  theme: Set<string>;
  light: Set<string>;
  dark: Set<string>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../../..');
const vertexRoot = join(repoRoot, 'apps/apollo-vertex');
const registryPath = join(vertexRoot, 'registry.json');

const baseRuntimeVars = new Set([
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
  'font-sans',
  'font-serif',
  'font-mono',
  'radius',
  'spacing',
]);

const baseThemeVars = new Set([
  ...Array.from(baseRuntimeVars, (name) => `color-${name}`),
  'radius-sm',
  'radius-md',
  'radius-lg',
  'radius-xl',
  'font-sans',
]);

const cssVarReferencePattern = /var\(\s*--([a-zA-Z0-9_-]+)/g;
const tailwindColorUtilityPattern =
  /(?:^|[^a-zA-Z0-9_-])(?:bg|text|border|ring|outline|fill|stroke|caret|decoration|accent|divide|from|via|to)-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)(?=\/|[^a-zA-Z0-9_-]|$)/g;

function readRegistry(): Registry {
  return JSON.parse(readFileSync(registryPath, 'utf-8')) as Registry;
}

function normalizeRegistryDependencyName(dependency: string): string {
  return dependency.startsWith('@uipath/') ? dependency.slice('@uipath/'.length) : dependency;
}

function collectCssVarReferences(value: string): string[] {
  return Array.from(value.matchAll(cssVarReferencePattern), (match) => match[1]);
}

function getRuntimeVarForThemeKey(theme: CssVars, themeKey: string): string | undefined {
  const value = theme.theme?.[themeKey];

  if (!value) {
    return undefined;
  }

  return collectCssVarReferences(value)[0];
}

function addRuntimeRequirement(
  required: RequiredCssVars,
  runtimeVar: string,
  modes: Array<'light' | 'dark'>
): void {
  const existing = required.runtime.get(runtimeVar) ?? new Set<'light' | 'dark'>();

  for (const mode of modes) {
    existing.add(mode);
  }

  required.runtime.set(runtimeVar, existing);
}

function addCssVars(target: AvailableCssVars, cssVars?: CssVars): void {
  for (const key of Object.keys(cssVars?.theme ?? {})) {
    target.theme.add(key);
  }

  for (const key of Object.keys(cssVars?.light ?? {})) {
    target.light.add(key);
  }

  for (const key of Object.keys(cssVars?.dark ?? {})) {
    target.dark.add(key);
  }
}

function collectAvailableCssVars(
  item: RegistryItem,
  itemsByName: Map<string, RegistryItem>,
  seen = new Set<string>()
): AvailableCssVars {
  const available: AvailableCssVars = {
    theme: new Set(),
    light: new Set(),
    dark: new Set(),
  };

  if (seen.has(item.name)) {
    return available;
  }

  seen.add(item.name);
  addCssVars(available, item.cssVars);

  for (const dependency of item.registryDependencies ?? []) {
    const dependencyItem = itemsByName.get(normalizeRegistryDependencyName(dependency));

    if (!dependencyItem) {
      continue;
    }

    const dependencyCssVars = collectAvailableCssVars(dependencyItem, itemsByName, seen);

    for (const key of dependencyCssVars.theme) {
      available.theme.add(key);
    }

    for (const key of dependencyCssVars.light) {
      available.light.add(key);
    }

    for (const key of dependencyCssVars.dark) {
      available.dark.add(key);
    }
  }

  return available;
}

function collectRequiredCssVars(item: RegistryItem, theme: CssVars): RequiredCssVars {
  const required: RequiredCssVars = {
    theme: new Set(),
    runtime: new Map(),
  };

  const fileContents = (item.files ?? []).map((file) =>
    readFileSync(join(vertexRoot, file.path), 'utf-8')
  );

  for (const content of fileContents) {
    for (const runtimeVar of collectCssVarReferences(content)) {
      if (
        !baseRuntimeVars.has(runtimeVar) &&
        (theme.light?.[runtimeVar] || theme.dark?.[runtimeVar])
      ) {
        addRuntimeRequirement(required, runtimeVar, expectedRuntimeModes(runtimeVar, theme));
      }
    }

    for (const match of content.matchAll(tailwindColorUtilityPattern)) {
      const colorName = match[1];
      const themeKey = `color-${colorName}`;

      if (!theme.theme?.[themeKey] || baseThemeVars.has(themeKey)) {
        continue;
      }

      required.theme.add(themeKey);

      const runtimeVar = getRuntimeVarForThemeKey(theme, themeKey);

      if (runtimeVar && !baseRuntimeVars.has(runtimeVar)) {
        addRuntimeRequirement(required, runtimeVar, expectedRuntimeModes(runtimeVar, theme));
      }
    }
  }

  for (const value of Object.values(item.cssVars?.theme ?? {})) {
    for (const runtimeVar of collectCssVarReferences(value)) {
      if (
        !baseRuntimeVars.has(runtimeVar) &&
        (theme.light?.[runtimeVar] || theme.dark?.[runtimeVar])
      ) {
        addRuntimeRequirement(required, runtimeVar, expectedRuntimeModes(runtimeVar, theme));
      }
    }
  }

  for (const value of Object.values(item.cssVars?.light ?? {})) {
    for (const runtimeVar of collectCssVarReferences(value)) {
      if (!baseRuntimeVars.has(runtimeVar) && theme.light?.[runtimeVar]) {
        addRuntimeRequirement(required, runtimeVar, ['light']);
      }
    }
  }

  for (const value of Object.values(item.cssVars?.dark ?? {})) {
    for (const runtimeVar of collectCssVarReferences(value)) {
      if (!baseRuntimeVars.has(runtimeVar) && theme.dark?.[runtimeVar]) {
        addRuntimeRequirement(required, runtimeVar, ['dark']);
      }
    }
  }

  return required;
}

function expectedRuntimeModes(runtimeVar: string, theme: CssVars): Array<'light' | 'dark'> {
  const modes: Array<'light' | 'dark'> = [];

  if (theme.light?.[runtimeVar]) {
    modes.push('light');
  }

  if (theme.dark?.[runtimeVar]) {
    modes.push('dark');
  }

  return modes;
}

function main() {
  const registry = readRegistry();
  const themeItem = registry.items.find(
    (item) => item.name === 'apollo-vertex-theme' && item.type === 'registry:theme'
  );

  if (!themeItem?.cssVars) {
    console.error('apollo-vertex-theme cssVars are required for the registry CSS var check.');
    process.exit(1);
  }

  const itemsByName = new Map(registry.items.map((item) => [item.name, item]));
  const errors: string[] = [];

  for (const item of registry.items) {
    if (!item.files?.length) {
      continue;
    }

    const required = collectRequiredCssVars(item, themeItem.cssVars);

    if (required.theme.size === 0 && required.runtime.size === 0) {
      continue;
    }

    const available = collectAvailableCssVars(item, itemsByName);
    const missing: string[] = [];

    for (const themeKey of required.theme) {
      if (!available.theme.has(themeKey)) {
        missing.push(`cssVars.theme["${themeKey}"]`);
      }
    }

    for (const [runtimeVar, modes] of required.runtime) {
      for (const mode of modes) {
        if (!available[mode].has(runtimeVar)) {
          missing.push(`cssVars.${mode}["${runtimeVar}"]`);
        }
      }
    }

    if (missing.length > 0) {
      errors.push(
        [
          `@uipath/${item.name} uses Apollo CSS variables that are not provided by its registry item or registryDependencies:`,
          ...missing.map((entry) => `  - ${entry}`),
        ].join('\n')
      );
    }
  }

  if (errors.length > 0) {
    console.error(errors.join('\n\n'));
    process.exit(1);
  }

  console.log('Registry CSS variable check passed.');
}

main();
