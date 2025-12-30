/**
 * Converts a color to a lighter version via color-mix with transparency.
 * @param color Color string (hex, rgb, hsl, etc. or CSS var like "var(--color-var)")
 * @param opacity Opacity value between 0 and 1.
 * @returns a color-mix() string that can be used in CSS.
 */
export const getLighterColor = (color: string, opacity: number = 0.2): string | undefined => {
  // Validate color format
  const isValidColor = CSS.supports('color', color);
  if (!isValidColor) {
    console.warn(`Invalid color format: ${color}`);
    return;
  }

  // Use color-mix for CSS variables to create a lighter version
  const clampedOpacity = Math.min(Math.max(opacity, 0), 1);
  const percentage = clampedOpacity * 100;
  return `color-mix(in srgb, ${color} ${percentage}%, transparent)`;
};
