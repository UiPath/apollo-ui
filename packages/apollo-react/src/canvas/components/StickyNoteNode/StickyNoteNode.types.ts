/**
 * Base color values for sticky notes.
 * Use `withAlpha()` to derive background colors with transparency.
 */
export const STICKY_NOTE_COLORS = {
  blue: '#42A1FF',
  green: '#6EB84A',
  yellow: '#FFB40E',
  pink: '#ED145B',
  white: 'var(--uix-canvas-border)',
} as const;

export type StickyNoteColor = keyof typeof STICKY_NOTE_COLORS;

export interface StickyNoteData extends Record<string, unknown> {
  color?: StickyNoteColor;
  content?: string;
  /** When true, the sticky note will start in edit mode with the textarea focused */
  autoFocus?: boolean;
}

/** Default alpha value for sticky note backgrounds (8%) */
const STICKY_NOTE_BG_ALPHA = 0.08;

/**
 * Applies an alpha channel to a hex color.
 * @param hex - 6-digit hex color (e.g., "#FFB40E")
 * @param alpha - Alpha value between 0 and 1 (default: 0.08)
 * @returns rgba() string
 */
export function withAlpha(hex: string, alpha: number = STICKY_NOTE_BG_ALPHA): string {
  // Clamp alpha to valid range
  const clampedAlpha = Math.max(0, Math.min(1, alpha));

  // Handle CSS variables - can't parse them, so use color-mix as fallback
  if (hex.startsWith('var(')) {
    return `color-mix(in srgb, ${hex} ${Math.round(clampedAlpha * 100)}%, transparent)`;
  }

  // Normalize hex string: add leading # if missing
  let normalized = hex.startsWith('#') ? hex : `#${hex}`;

  // Expand 3-digit shorthand hex to 6-digit
  if (/^#([a-fA-F0-9]{3})$/.test(normalized)) {
    normalized = `#${normalized
      .slice(1)
      .split('')
      .map((c) => c + c)
      .join('')}`;
  }

  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
}
