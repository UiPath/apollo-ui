import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const registryPath = join(__dirname, "../registry.json");
const outputPath = join(__dirname, "../app/theme.generated.css");

interface ThemeItem {
  name: string;
  type: string;
  cssVars: {
    theme: Record<string, string>;
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

interface Registry {
  items: ThemeItem[];
}

let fileContent: string;
try {
  fileContent = readFileSync(registryPath, "utf-8");
} catch (error) {
  console.error(
    `Failed to read registry file at ${registryPath}:`,
    (error as Error).message,
  );
  process.exit(1);
}

let registry: Registry;
try {
  registry = JSON.parse(fileContent);
} catch (error) {
  console.error("Failed to parse registry JSON:", (error as Error).message);
  process.exit(1);
}

const theme = registry.items.find(
  (item) =>
    item.name === "apollo-vertex-theme" && item.type === "registry:theme",
);

if (!theme) {
  console.error(
    'No item with name "apollo-vertex-theme" and type "registry:theme" found in registry.json',
  );
  process.exit(1);
}

const { cssVars } = theme;

if (!cssVars?.theme || !cssVars?.light || !cssVars?.dark) {
  console.error(
    "apollo-vertex-theme item is missing required cssVars (theme, light, dark)",
  );
  process.exit(1);
}

function renderBlock(
  selector: string,
  vars: Record<string, string>,
  indent = "  ",
): string {
  const lines = Object.entries(vars).map(
    ([key, value]) => `${indent}--${key}: ${value};`,
  );
  return `${selector} {\n${lines.join("\n")}\n}`;
}

const sections: string[] = [
  renderBlock("@theme inline", cssVars.theme),
  renderBlock(":root", cssVars.light),
  renderBlock(".dark", cssVars.dark),
];

const css = `${sections.join("\n")}\n`;

try {
  writeFileSync(outputPath, css);
} catch (error) {
  console.error(
    `Failed to write theme CSS at ${outputPath}:`,
    (error as Error).message,
  );
  process.exit(1);
}
