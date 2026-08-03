#!/usr/bin/env node
/**
 * Type-drift guard for the invoice-review timeline.
 *
 * The design locks font sizes to an agreed scale, expressed as `text-[Npx]`
 * because Tailwind has no 11/13/18/22 classes and the project defines no custom
 * font-size scale. This fails loudly if an OFF-SCALE arbitrary size slips in
 * (e.g. a headline drifting to `text-[2rem]`), so item 3's revert cannot
 * silently regress.
 *
 * Note: an earlier revision also banned font weights above 500. That rule was
 * dropped because the focus/current exception headline is now deliberately
 * `font-bold` (the anchor). If a weight ceiling is wanted again, add it here
 * consciously (do not add inline escape hatches in the source).
 */
import { readFileSync } from "node:fs";

const FILE = "templates/invoice-review/next/ExceptionTimeline.tsx";

// The agreed size scale. Sizes must be one of these; anything else is drift.
const ALLOWED_SIZES = new Set(["11px", "12px", "13px", "14px", "18px", "22px"]);
const isLength = (v) => /^-?[\d.]+(px|rem|em)$/.test(v.trim());

const violations = [];
const lines = readFileSync(FILE, "utf8").split("\n");

lines.forEach((line, i) => {
  for (const m of line.matchAll(/text-\[([^\]]+)\]/g)) {
    const value = m[1].trim();
    if (isLength(value) && !ALLOWED_SIZES.has(value)) {
      violations.push({
        line: i + 1,
        text: line.trim(),
        why: `off-scale size text-[${value}] (allowed: ${[...ALLOWED_SIZES].join(", ")})`,
      });
    }
  }
});

if (violations.length > 0) {
  console.error(`Type drift in ${FILE}:`);
  for (const v of violations) {
    console.error(`  ${FILE}:${v.line}  ${v.why}`);
    console.error(`    ${v.text}`);
  }
  process.exit(1);
}

console.log(`Type-drift guard passed: ${FILE}`);
