/**
 * Apollo Future — Spacing Tokens
 *
 * Single source of truth for spacing (padding, margin, gap, dimensions)
 * in the Future design language.
 * Includes values actively used in both Delegate and Flow templates.
 * All values map to Tailwind spacing scale or arbitrary values in use.
 */

// =============================================================================
// Spacing Scale (Tailwind: 1 unit = 4px)
// =============================================================================

/**
 * Spacing scale in pixels.
 *
 * | Token | px  | Tailwind     | Usage example             |
 * |-------|-----|--------------|---------------------------|
 * | 0     | 0   | p-0          | Reset padding             |
 * | 1     | 4   | p-1, gap-1   | Tight padding             |
 * | 2     | 8   | p-2, gap-2   | Default gaps              |
 * | 3     | 12  | px-3, py-3   | Inline padding            |
 * | 4     | 16  | p-4, gap-4   | Content padding           |
 * | 5     | 20  | py-5         | Section padding           |
 * | 6     | 24  | gap-6, px-6  | Large gaps                |
 * | 7     | 28  | gap-7        | Chat message gap (Flow)   |
 * | 8     | 32  | gap-8        | Section gaps              |
 * | 10    | 40  | px-10        | Page horizontal           |
 */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
} as const;

/**
 * Fractional / half-unit spacing used in templates.
 *
 * | Token | px  | Tailwind  | Usage                         |
 * |-------|-----|-----------|-------------------------------|
 * | 0.5   | 2   | gap-0.5   | Tight gaps                   |
 * | 2.5   | 10  | pt-2.5    | Node card padding, toolbar   |
 */
export const spacingHalf = {
  '0.5': 2,
  '2.5': 10,
} as const;

// =============================================================================
// Arbitrary spacing (custom values in use)
// =============================================================================

/**
 * Arbitrary spacing values used in Future templates.
 *
 * | Token | px   | Usage                            |
 * |-------|------|----------------------------------|
 * | 15    | 15   | gap-[15px] (Flow node)           |
 * | 18    | 18   | gap-[18px], pt-[18px] (Delegate) |
 * | 20    | 20   | mt-20 (Delegate)                 |
 * | 37    | 37   | gap-[37px] (Delegate)            |
 * | 60    | 60   | Panel icon rail (60×60px)        |
 * | 78    | 78   | min-h-[78px] (Delegate)          |
 * | 124   | 124  | min-h-[124px] (Delegate)         |
 * | 360   | 360  | Flow node size (360×360px)       |
 * | 420   | 420  | Flow expanded panel width        |
 * | 680   | 680  | max-w-[680px] (properties bar)   |
 * | 800   | 800  | max-w-[800px] (Delegate)         |
 * | 930   | 930  | Properties expanded panel width  |
 */
export const spacingArbitrary = {
  15: 15,
  18: 18,
  20: 20,
  37: 37,
  60: 60,
  78: 78,
  124: 124,
  360: 360,
  420: 420,
  680: 680,
  800: 800,
  930: 930,
} as const;
