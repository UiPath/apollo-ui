/**
 * Extracts Tailwind CSS palette families into a Style Dictionary token file.
 *
 * Reads the palette from the installed `tailwindcss` package (theme.css),
 * converts oklch values to sRGB hex, and writes
 * `src/tokens/color/tailwind.json`.
 *
 * The output file is checked in on purpose: a Tailwind upgrade that
 * recalibrates colors must surface as a reviewable diff, never as a silent
 * reskin of shipped themes. Run with `--check` (CI) to fail when the file is
 * out of sync with the installed Tailwind version.
 *
 * Values are converted to hex (not kept as oklch) so the tokens behave like
 * every other Apollo color token: alpha-suffix composition ("<hex>14"),
 * MUI color manipulation (alpha()/darken()) and SCSS color functions all
 * require parseable sRGB values.
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Palette families shipped as Apollo tokens. Families that collide with
 * existing Apollo palettes (red, gray, …) are deliberately excluded — Apollo
 * keeps its own values for those.
 */
const FAMILIES = ['zinc', 'cyan', 'emerald', 'amber', 'violet', 'rose', 'sky'] as const;

/**
 * Individual steps extracted from families that otherwise collide with an
 * Apollo palette. Only steps the Apollo family does NOT define may be listed
 * here — they deep-merge into the existing family without overriding it.
 */
const PARTIAL_FAMILIES: Record<string, readonly string[]> = {
  // Apollo red defines 100-800; 950 is the future themes' destructive tint.
  red: ['950'],
};

const OUTPUT_PATH = path.join(__dirname, '../src/tokens/color/tailwind.json');

/** oklch(L C H) → sRGB hex. Reference: https://bottosson.github.io/posts/oklab/ */
function oklchToHex(lightness: number, chroma: number, hueDegrees: number): string {
  const hueRadians = (hueDegrees * Math.PI) / 180;
  const a = chroma * Math.cos(hueRadians);
  const b = chroma * Math.sin(hueRadians);

  const l_ = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = lightness - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const linear = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  const toGamma = (c: number) => {
    const clamped = Math.min(1, Math.max(0, c));
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  };

  return `#${linear
    .map((c) =>
      Math.round(toGamma(c) * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
}

function parseOklch(value: string): { l: number; c: number; h: number } | null {
  const match = value.match(/^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)$/);
  if (!match) {
    return null;
  }
  return { l: Number(match[1]) / 100, c: Number(match[2]), h: Number(match[3]) };
}

export function extractTailwindColors(themeCss: string): Record<string, unknown> {
  const families: Record<string, Record<string, { value: string; comment: string }>> = {};

  for (const family of FAMILIES) {
    families[family] = {};
  }

  const declaration = /--color-([a-z]+)-(\d+):\s*([^;]+);/g;
  for (const match of themeCss.matchAll(declaration)) {
    const [, family, step, rawValue] = match;
    const isFullFamily = FAMILIES.includes(family as (typeof FAMILIES)[number]);
    const isPartialStep = PARTIAL_FAMILIES[family]?.includes(step) ?? false;
    if (!isFullFamily && !isPartialStep) {
      continue;
    }
    families[family] ??= {};
    const value = rawValue.trim();
    const oklch = parseOklch(value);
    if (!oklch) {
      throw new Error(`Unparseable Tailwind color value for ${family}-${step}: "${value}"`);
    }
    families[family][step] = {
      value: oklchToHex(oklch.l, oklch.c, oklch.h),
      comment: `tailwind ${family}-${step} (${value})`,
    };
  }

  for (const family of FAMILIES) {
    const steps = Object.keys(families[family]);
    if (steps.length === 0) {
      throw new Error(`Tailwind palette family "${family}" not found in theme.css`);
    }
  }
  for (const [family, steps] of Object.entries(PARTIAL_FAMILIES)) {
    for (const step of steps) {
      if (!families[family]?.[step]) {
        throw new Error(`Tailwind color ${family}-${step} not found in theme.css`);
      }
    }
  }

  return { color: families };
}

function main() {
  const themeCssPath = require.resolve('tailwindcss/theme.css');
  const themeCss = fs.readFileSync(themeCssPath, 'utf8');
  const tokens = extractTailwindColors(themeCss);
  const output = `${JSON.stringify(tokens, null, 2)}\n`;

  if (process.argv.includes('--check')) {
    const existing = fs.existsSync(OUTPUT_PATH) ? fs.readFileSync(OUTPUT_PATH, 'utf8') : '';
    if (existing !== output) {
      console.error(
        `${OUTPUT_PATH} is out of sync with the installed tailwindcss package.\n` +
          'Run "pnpm run build:tokens" in packages/apollo-core and review the palette diff.'
      );
      process.exit(1);
    }
    console.log('tailwind.json is in sync with the installed tailwindcss package.');
    return;
  }

  fs.writeFileSync(OUTPUT_PATH, output);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
