import type { CSSProperties } from "react";

function linearToSrgb(val: number): number {
  if (val <= 0.0031308) return 12.92 * val;
  return 1.055 * val ** (1 / 2.4) - 0.055;
}

function srgbToLinear(val: number): number {
  if (val <= 0.04045) return val / 12.92;
  return ((val + 0.055) / 1.055) ** 2.4;
}

export function oklchToHex(oklchString: string): string {
  const match = oklchString.match(
    /oklch\s*\(\s*([0-9.]+)%?\s+([0-9.]+)\s+([0-9.]+)(?:deg)?(?:\s*\/\s*([0-9.]+)%?)?\s*\)/i,
  );
  if (!match) return oklchString;

  let l = Number.parseFloat(match[1]);
  const c = Number.parseFloat(match[2]);
  const h = Number.parseFloat(match[3]);
  let alpha = match[4] ? Number.parseFloat(match[4]) : 1;

  if (oklchString.includes("%") && match[1].includes("%")) l = l / 100;
  if (match[4] && oklchString.includes(`/ ${match[4]}%`)) alpha = alpha / 100;

  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  let r =
    4.0767416621 * l_ ** 3 - 3.3077115913 * m_ ** 3 + 0.2309699292 * s_ ** 3;
  let g =
    -1.2684380046 * l_ ** 3 + 2.6097574011 * m_ ** 3 - 0.3413193965 * s_ ** 3;
  let b_rgb =
    -0.0041960863 * l_ ** 3 - 0.7034186147 * m_ ** 3 + 1.707614701 * s_ ** 3;

  r = linearToSrgb(r);
  g = linearToSrgb(g);
  b_rgb = linearToSrgb(b_rgb);

  r = Math.max(0, Math.min(255, Math.round(r * 255)));
  g = Math.max(0, Math.min(255, Math.round(g * 255)));
  b_rgb = Math.max(0, Math.min(255, Math.round(b_rgb * 255)));

  if (alpha < 1) {
    const bgValue = 51;
    r = Math.round(r * alpha + bgValue * (1 - alpha));
    g = Math.round(g * alpha + bgValue * (1 - alpha));
    b_rgb = Math.round(b_rgb * alpha + bgValue * (1 - alpha));
  }

  return `#${[r, g, b_rgb].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

export function hexToOklchString(hex: string): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2]
      : clean;

  const r = srgbToLinear(Number.parseInt(full.slice(0, 2), 16) / 255);
  const g = srgbToLinear(Number.parseInt(full.slice(2, 4), 16) / 255);
  const b = srgbToLinear(Number.parseInt(full.slice(4, 6), 16) / 255);

  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bLab = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.hypot(a, bLab);
  let H = (Math.atan2(bLab, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return `oklch(${L.toFixed(4)} ${C.toFixed(4)} ${H.toFixed(4)})`;
}

export function toHexForPicker(value: string): string {
  if (!value) return "#000000";
  if (value.startsWith("#")) return value;
  if (value.includes("oklch")) {
    try {
      return oklchToHex(value);
    } catch {
      return "#000000";
    }
  }
  return value;
}

function parseToOklch(
  value: string,
): { L: number; C: number; H: number } | null {
  const oklchMatch = value.match(
    /oklch\s*\(\s*([0-9.]+)%?\s+([0-9.]+)\s+([0-9.]+)/i,
  );
  if (oklchMatch) {
    let l = Number.parseFloat(oklchMatch[1]);
    if (value.includes("%")) l = l / 100;
    return {
      L: l,
      C: Number.parseFloat(oklchMatch[2]),
      H: Number.parseFloat(oklchMatch[3]),
    };
  }

  if (value.startsWith("#")) {
    const clean = value.replace("#", "");
    if (clean.length !== 6 && clean.length !== 3) return null;
    const full =
      clean.length === 3
        ? clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2]
        : clean;

    const r = srgbToLinear(Number.parseInt(full.slice(0, 2), 16) / 255);
    const g = srgbToLinear(Number.parseInt(full.slice(2, 4), 16) / 255);
    const b = srgbToLinear(Number.parseInt(full.slice(4, 6), 16) / 255);

    const l_ = Math.cbrt(
      0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
    );
    const m_ = Math.cbrt(
      0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
    );
    const s_ = Math.cbrt(
      0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
    );

    const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
    const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
    const bLab = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

    const C = Math.hypot(a, bLab);
    let H = (Math.atan2(bLab, a) * 180) / Math.PI;
    if (H < 0) H += 360;

    return { L, C, H };
  }

  return null;
}

// Generates a full primary shade ramp + sidebar vars from a single primary color.
// Used so Tailwind utilities like bg-primary-700 pick up the custom brand color.
export function buildPrimaryVars(primaryColor: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const parsed = parseToOklch(primaryColor);

  vars["--primary"] = primaryColor;
  vars["--sidebar-primary"] = primaryColor;
  vars["--sidebar-ring"] = primaryColor;

  if (parsed) {
    const { C, H } = parsed;
    vars["--primary-50"] = `oklch(0.95 ${(C * 0.3).toFixed(3)} ${H})`;
    vars["--primary-100"] = `oklch(0.92 ${(C * 0.39).toFixed(3)} ${H})`;
    vars["--primary-200"] = `oklch(0.86 ${(C * 0.52).toFixed(3)} ${H})`;
    vars["--primary-300"] = `oklch(0.8 ${(C * 0.7).toFixed(3)} ${H})`;
    vars["--primary-400"] = `oklch(0.75 ${(C * 0.87).toFixed(3)} ${H})`;
    vars["--primary-500"] = `oklch(0.69 ${(C * 0.97).toFixed(3)} ${H})`;
    vars["--primary-600"] =
      `oklch(${parsed.L.toFixed(2)} ${C.toFixed(3)} ${H})`;
    vars["--primary-700"] = `oklch(0.6 ${(C * 1.09).toFixed(3)} ${H})`;
    vars["--primary-800"] = `oklch(0.53 ${(C * 0.96).toFixed(3)} ${H})`;
    vars["--primary-900"] = `oklch(0.46 ${(C * 0.83).toFixed(3)} ${H})`;
  }

  return vars;
}

export function buildBrandingStyle(
  primaryColor: string,
  accentColor: string,
): CSSProperties {
  const vars: Record<string, string> = {};

  if (primaryColor) {
    Object.assign(vars, buildPrimaryVars(primaryColor));
  }
  if (accentColor) {
    vars["--accent"] = accentColor;
    vars["--sidebar-accent"] = accentColor;
  }

  return vars as CSSProperties;
}
