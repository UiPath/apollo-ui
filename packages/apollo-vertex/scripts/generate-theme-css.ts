import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const themeJsonPath = join(__dirname, '../src/styles/theme.json');
const outputPath = join(__dirname, '../src/styles/theme.css');

interface CssVars {
  theme: Record<string, string>;
  light: Record<string, string>;
  dark: Record<string, string>;
}

let fileContent: string;
try {
  fileContent = readFileSync(themeJsonPath, 'utf-8');
} catch (error) {
  console.error(`Failed to read theme JSON at ${themeJsonPath}:`, (error as Error).message);
  process.exit(1);
}

let cssVars: CssVars;
try {
  cssVars = JSON.parse(fileContent) as CssVars;
} catch (error) {
  console.error('Failed to parse theme JSON:', (error as Error).message);
  process.exit(1);
}

if (!cssVars?.theme || !cssVars?.light || !cssVars?.dark) {
  console.error('theme.json is missing required cssVars (theme, light, dark)');
  process.exit(1);
}

function renderBlock(selector: string, vars: Record<string, string>, indent = '  '): string {
  const lines = Object.entries(vars).map(([key, value]) => `${indent}--${key}: ${value};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

const css = [
  '/* Generated from src/styles/theme.json (copied from apollo-vertex-theme). */',
  '/* Re-run: node --experimental-strip-types scripts/generate-theme-css.ts */',
  renderBlock('@theme inline', cssVars.theme),
  renderBlock(':root', cssVars.light),
  renderBlock('.dark', cssVars.dark),
].join('\n');

try {
  writeFileSync(outputPath, `${css}\n`);
} catch (error) {
  console.error(`Failed to write theme CSS at ${outputPath}:`, (error as Error).message);
  process.exit(1);
}
