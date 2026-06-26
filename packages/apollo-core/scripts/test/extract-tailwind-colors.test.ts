import { describe, expect, it } from 'vitest';

import { extractTailwindColors } from '../extract-tailwind-colors';

type TokenFamily = Record<string, { value: string; comment: string }>;

const THEME_CSS_FIXTURE = `
@theme default {
  --color-zinc-50: oklch(98.5% 0 0);
  --color-zinc-100: oklch(96.7% 0.001 286.375);
  --color-zinc-200: oklch(92% 0.004 286.32);
  --color-zinc-700: oklch(37% 0.013 285.805);
  --color-zinc-900: oklch(21% 0.006 285.885);
  --color-zinc-950: oklch(14.1% 0.005 285.823);
  --color-cyan-100: oklch(95.6% 0.045 203.388);
  --color-cyan-400: oklch(78.9% 0.154 211.53);
  --color-cyan-600: oklch(60.9% 0.126 221.723);
  --color-emerald-400: oklch(76.5% 0.177 163.223);
  --color-amber-400: oklch(82.8% 0.189 84.429);
  --color-violet-400: oklch(70.2% 0.183 293.541);
  --color-rose-400: oklch(71.2% 0.194 13.428);
  --color-sky-400: oklch(74.6% 0.16 232.661);
  --color-red-500: oklch(63.7% 0.237 25.331);
  --color-red-950: oklch(25.8% 0.092 26.042);
  --color-gray-500: oklch(55.1% 0.027 264.364);
}
`;

describe('extractTailwindColors', () => {
  const tokens = extractTailwindColors(THEME_CSS_FIXTURE) as {
    color: Record<string, TokenFamily>;
  };

  // Expected hex values are the documented sRGB equivalents of the Tailwind v4
  // palette (the same ones referenced in apollo-wind's tailwind.consumer.css).
  it.each([
    ['zinc', '50', '#fafafa'],
    ['zinc', '100', '#f4f4f5'],
    ['zinc', '200', '#e4e4e7'],
    ['zinc', '700', '#3f3f46'],
    ['zinc', '900', '#18181b'],
    ['zinc', '950', '#09090b'],
    ['cyan', '100', '#cefafe'],
    // Out-of-sRGB-gamut oklch values clip to the published v4 hex equivalents
    ['cyan', '400', '#00d3f2'],
    ['cyan', '600', '#0092b8'],
    ['emerald', '400', '#00d492'],
    ['amber', '400', '#ffb900'],
    ['violet', '400', '#a684ff'],
    ['rose', '400', '#ff637e'],
    ['sky', '400', '#00bcff'],
  ])('converts %s-%s to %s (±1/255 per channel)', (family, step, expectedHex) => {
    const actual = tokens.color[family][step].value;
    const channels = (hex: string) =>
      [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((c) => Number.parseInt(c, 16));
    const actualChannels = channels(actual);
    const expectedChannels = channels(expectedHex);
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(actualChannels[i] - expectedChannels[i])).toBeLessThanOrEqual(1);
    }
  });

  it('only extracts whitelisted families plus partial-family steps', () => {
    expect(Object.keys(tokens.color).sort()).toEqual([
      'amber',
      'cyan',
      'emerald',
      'red',
      'rose',
      'sky',
      'violet',
      'zinc',
    ]);
    expect(tokens.color).not.toHaveProperty('gray');
    // Only the whitelisted step of the colliding family — Apollo owns the rest
    expect(Object.keys(tokens.color.red)).toEqual(['950']);
  });

  it('extracts partial-family steps so colliding families stay package-driven', () => {
    expect(tokens.color.red['950'].value).toBe('#460809');
  });

  it('throws when a whitelisted family is missing', () => {
    expect(() => extractTailwindColors('--color-zinc-500: oklch(55.2% 0.016 285.938);')).toThrow(
      /family "cyan" not found/
    );
  });

  it('throws when a partial-family step is missing', () => {
    const withoutRed950 = THEME_CSS_FIXTURE.replace(/--color-red-950[^;]+;/, '');
    expect(() => extractTailwindColors(withoutRed950)).toThrow(/red-950 not found/);
  });

  it('records token provenance in comments', () => {
    expect(tokens.color.zinc['950'].comment).toBe('tailwind zinc-950 (oklch(14.1% 0.005 285.823))');
  });
});
