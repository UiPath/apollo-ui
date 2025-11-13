/**
 * Naming Convention Utilities
 *
 * Utilities for transforming token names between different naming conventions.
 * Primary use: PascalCase (TypeScript) → kebab-case (CSS)
 */

/**
 * Convert PascalCase string to kebab-case
 *
 * Handles edge cases:
 * - Consecutive capital letters: XXL → xxl (not x-x-l)
 * - Numbers: Dp24 → dp-24 (not dp24)
 * - Mixed case: H1Bold → h1-bold
 *
 * @param input - PascalCase string (e.g., 'ColorOrange500')
 * @returns kebab-case string (e.g., 'color-orange-500')
 *
 * @example
 * ```typescript
 * pascalToKebab('ColorOrange500') // 'color-orange-500'
 * pascalToKebab('SpacingXXL') // 'spacing-xxl'
 * pascalToKebab('ShadowDp24') // 'shadow-dp-24'
 * pascalToKebab('FontH1Bold') // 'font-h1-bold'
 * ```
 */
export function pascalToKebab(input: string): string {
  return (
    input
      // Insert hyphen before uppercase letters that follow lowercase letters or numbers
      // ColorOrange500 → Color-Orange-500
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      // Insert hyphen before numbers that follow lowercase letters (handles Dp24 → Dp-24)
      // Don't add hyphen after uppercase letters (H1 → h1, not h-1)
      .replace(/([a-z])(\d)/g, '$1-$2')
      // Handle consecutive uppercase letters (XXL → xxl, not X-X-L)
      // Keep them together unless followed by lowercase (HTML → html, HTMLElement → HTML-Element)
      .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
      // Convert to lowercase
      .toLowerCase()
  );
}
