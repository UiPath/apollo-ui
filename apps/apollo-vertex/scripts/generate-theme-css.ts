import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sidebarSpring } from "../registry/shell/shell-animations.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const registryPath = join(__dirname, "../registry.json");
const outputPath = join(__dirname, "../app/theme.generated.css");
const layoutTokensPath = join(
  __dirname,
  "../registry/composition/layout-tokens.ts",
);

/**
 * With --check, nothing is written. The script fails if the committed
 * layout-tokens.ts is out of date with registry.json, or registry.json's
 * --panel-transition-easing is out of date with the Shell's spring. Lint
 * runs this.
 */
const checkOnly = process.argv.includes("--check");

/** Theme tokens exported to TypeScript as px numbers, by camelCase name. */
const LAYOUT_TOKENS: Record<string, string> = {
  "surface-inset": "surfaceInset",
  "side-panel-width-min": "sidePanelWidthMin",
  "content-area-width-min": "contentAreaWidthMin",
  "scroll-fade-size": "scrollFadeSize",
  "slot-divider-width": "slotDividerWidth",
};

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

/**
 * The Shell sidebar's spring as a CSS linear() easing over the panel
 * transition's duration: its progress at evenly spaced times, to three
 * decimals, ending at 1. The spring is the source; registry.json carries
 * the result so the theme ships it.
 */
function springEasing(durationMs: number, steps = 24): string {
  const { stiffness: k, damping: c, mass: m } = sidebarSpring;
  const dt = 1e-6;
  let x = 0;
  let v = 0;
  let t = 0;
  const points = [0];
  for (let i = 1; i < steps; i++) {
    const until = (i * durationMs) / steps / 1000;
    while (t < until) {
      v += ((-k * (x - 1) - c * v) / m) * dt;
      x += v * dt;
      t += dt;
    }
    points.push(Math.round(x * 1000) / 1000);
  }
  points.push(1);
  return `linear(${points.join(", ")})`;
}

const easingKey = "panel-transition-easing";
const easing = springEasing(transitionMs());
const easingIn = (vars: Record<string, string>) =>
  vars[easingKey] === undefined || vars[easingKey] === easing;
const easingCurrent = easingIn(cssVars.light) && easingIn(cssVars.dark);
// The CSS always gets the spring's curve, even before registry.json is updated.
for (const vars of [cssVars.light, cssVars.dark])
  if (vars[easingKey] !== undefined) vars[easingKey] = easing;

const sections: string[] = [
  renderBlock("@theme inline", cssVars.theme),
  renderBlock(":root", cssVars.light),
  renderBlock(".dark", cssVars.dark),
];

const css = `${sections.join("\n")}\n`;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function layoutTokenPx(name: string): number {
  const value = cssVars.light[name];
  if (value === undefined) fail(`Layout token --${name} is missing from light`);
  const dark = cssVars.dark[name];
  if (dark !== undefined && dark !== value) {
    fail(`Layout token --${name} must not differ between light and dark`);
  }
  const match = /^(\d+(?:\.\d+)?)px$/.exec(value);
  if (!match) fail(`Layout token --${name} must be a px value, got "${value}"`);
  return Number(match[1]);
}

function tintStrength(): number {
  const read = (scheme: "light" | "dark") => {
    const value = cssVars[scheme]["side-panel-tint"] ?? "";
    const match = /var\(--sidebar\)\s+(\d+(?:\.\d+)?)%/.exec(value);
    if (!match)
      fail(`--side-panel-tint in ${scheme} has no --sidebar strength`);
    return Number(match[1]);
  };
  const light = read("light");
  if (read("dark") !== light) {
    fail("--side-panel-tint strength must match in light and dark");
  }
  return light;
}

function transitionMs(): number {
  const value = cssVars.light["panel-transition-duration"] ?? "";
  const match = /^(\d+)ms$/.exec(value);
  if (!match) fail(`--panel-transition-duration must be in ms, got "${value}"`);
  return Number(match[1]);
}

const layoutTokensTs = [
  "// Generated by scripts/generate-theme-css.ts from registry.json. Do not edit.",
  "// Change the tokens in registry.json and run `pnpm generate:theme`;",
  "// `pnpm lint` fails while this file is out of date.",
  "",
  "/** Layout tokens from the apollo-vertex-theme item, in px. */",
  "export const LAYOUT_TOKENS = {",
  ...Object.entries(LAYOUT_TOKENS).map(
    ([name, key]) => `  ${key}: ${layoutTokenPx(name)},`,
  ),
  "} as const;",
  "",
  "/** The --sidebar strength in --side-panel-tint, as a percentage. */",
  `export const SIDE_PANEL_TINT_STRENGTH = ${tintStrength()};`,
  "",
  "/** --panel-transition-duration, in ms. */",
  `export const PANEL_TRANSITION_DURATION_MS = ${transitionMs()};`,
  "",
].join("\n");

if (checkOnly) {
  // Only layout-tokens.ts is committed. theme.generated.css is gitignored
  // and written on every dev run and build, so a fresh checkout has none.
  const committed = existsSync(layoutTokensPath)
    ? readFileSync(layoutTokensPath, "utf-8")
    : "";
  if (committed !== layoutTokensTs) {
    fail(
      "registry/composition/layout-tokens.ts is out of date with registry.json. " +
        "Run `pnpm generate:theme` and commit the result.",
    );
  }
  if (!easingCurrent) {
    fail(
      `registry.json's --${easingKey} is out of date with sidebarSpring in ` +
        "registry/shell/shell-animations.ts. Run `pnpm generate:theme` and commit the result.",
    );
  }
  console.log(
    "layout-tokens.ts and --panel-transition-easing are up to date with registry.json and sidebarSpring",
  );
  process.exit(0);
}

// Keep registry.json's easing on the spring, changing only that value.
const registryUpdated = fileContent.replaceAll(
  /("panel-transition-easing": )"[^"]*"/g,
  (_, key: string) => `${key}${JSON.stringify(easing)}`,
);

try {
  writeFileSync(outputPath, css);
  writeFileSync(layoutTokensPath, layoutTokensTs);
  if (registryUpdated !== fileContent)
    writeFileSync(registryPath, registryUpdated);
} catch (error) {
  console.error(
    "Failed to write generated theme files:",
    (error as Error).message,
  );
  process.exit(1);
}
