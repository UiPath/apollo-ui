/**
 * Token Transformer
 *
 * Transforms apollo-core tokens into Tailwind-compatible configuration.
 * Converts TypeScript token exports to CSS variable references.
 */

import { pascalToKebab } from '../utils/naming-conventions';

/**
 * Token types that can be transformed
 */
export type TokenValue = string | number;

/**
 * Input token structure from apollo-core
 */
export interface TokenInput {
  [key: string]: TokenValue;
}

/**
 * Output token structure for Tailwind config
 */
export interface TokenOutput {
  [key: string]: string | TokenOutput;
}

/**
 * Transform options
 */
export interface TransformOptions {
  /**
   * Prefix for CSS variable names (default: '--')
   */
  cssVarPrefix?: string;

  /**
   * Whether to wrap values in var() function (default: true)
   */
  wrapInVar?: boolean;

  /**
   * Custom naming transformation function
   */
  namingFn?: (name: string) => string;
}

/**
 * Transform a single token value to CSS variable reference
 *
 * @param name - Token name in PascalCase (e.g., 'ColorOrange500')
 * @param value - Token value
 * @param options - Transform options
 * @returns CSS variable reference (e.g., 'var(--color-orange-500)')
 *
 * @throws {Error} If the token value is invalid
 *
 * @example
 * ```typescript
 * transformToken('ColorOrange500', '#ff6b35')
 * // Returns: 'var(--color-orange-500)'
 *
 * transformToken('ColorOrange500', '#ff6b35', { wrapInVar: false })
 * // Returns: '--color-orange-500'
 * ```
 */
export function transformToken(
  name: string,
  value: TokenValue,
  options: TransformOptions = {}
): string {
  // Validate token value
  if (!isValidTokenValue(value)) {
    throw new Error(
      `Invalid token value for "${name}": expected string or number, got ${typeof value}`
    );
  }

  // Extract options with defaults
  const { cssVarPrefix = '--', wrapInVar = true, namingFn = pascalToKebab } = options;

  // Convert PascalCase name to kebab-case
  const kebabName = namingFn(name);

  // Build CSS variable name
  const cssVarName = `${cssVarPrefix}${kebabName}`;

  // Return with or without var() wrapper
  return wrapInVar ? `var(${cssVarName})` : cssVarName;
}

/**
 * Transform a collection of tokens to CSS variable references
 *
 * @param tokens - Input tokens from apollo-core
 * @param options - Transform options
 * @returns Transformed token object for Tailwind config
 *
 * @throws {Error} If any token value is invalid
 *
 * @example
 * ```typescript
 * const colors = {
 *   ColorOrange500: '#ff6b35',
 *   ColorBlue600: '#0066cc'
 * };
 *
 * transformTokens(colors)
 * // Returns: {
 * //   ColorOrange500: 'var(--color-orange-500)',
 * //   ColorBlue600: 'var(--color-blue-600)'
 * // }
 * ```
 */
export function transformTokens(tokens: TokenInput, options: TransformOptions = {}): TokenOutput {
  const result: TokenOutput = {};

  for (const [name, value] of Object.entries(tokens)) {
    // Transform each token
    result[name] = transformToken(name, value, options);
  }

  return result;
}

/**
 * Validate that a token value is acceptable
 *
 * @param value - Token value to validate
 * @returns True if valid, false otherwise
 */
export function isValidTokenValue(value: unknown): value is TokenValue {
  return typeof value === 'string' || typeof value === 'number';
}
