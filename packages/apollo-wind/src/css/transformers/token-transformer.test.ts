/**
 * Tests for Token Transformer
 */

import {
  transformToken,
  transformTokens,
  isValidTokenValue,
  type TokenInput,
  type TransformOptions,
} from './token-transformer';

describe('isValidTokenValue', () => {
  it('should return true for string values', () => {
    expect(isValidTokenValue('#ff6b35')).toBe(true);
    expect(isValidTokenValue('16px')).toBe(true);
    expect(isValidTokenValue('')).toBe(true);
  });

  it('should return true for number values', () => {
    expect(isValidTokenValue(16)).toBe(true);
    expect(isValidTokenValue(0)).toBe(true);
    expect(isValidTokenValue(-5)).toBe(true);
    expect(isValidTokenValue(3.14)).toBe(true);
  });

  it('should return false for other types', () => {
    expect(isValidTokenValue(null)).toBe(false);
    expect(isValidTokenValue(undefined)).toBe(false);
    expect(isValidTokenValue({})).toBe(false);
    expect(isValidTokenValue([])).toBe(false);
    expect(isValidTokenValue(true)).toBe(false);
  });
});

describe('transformToken', () => {
  describe('basic transformation', () => {
    it('should transform token to CSS variable reference with var()', () => {
      expect(transformToken('ColorOrange500', '#ff6b35')).toBe('var(--color-orange-500)');
    });

    it('should transform token with number value', () => {
      expect(transformToken('SpacingBase', 16)).toBe('var(--spacing-base)');
    });

    it('should handle complex PascalCase names', () => {
      expect(transformToken('ShadowCardElevation', '0 2px 4px')).toBe(
        'var(--shadow-card-elevation)'
      );
    });
  });

  describe('options handling', () => {
    it('should respect wrapInVar: false option', () => {
      const options: TransformOptions = { wrapInVar: false };
      expect(transformToken('ColorOrange500', '#ff6b35', options)).toBe('--color-orange-500');
    });

    it('should respect custom cssVarPrefix', () => {
      const options: TransformOptions = { cssVarPrefix: '--apollo-' };
      expect(transformToken('ColorOrange500', '#ff6b35', options)).toBe(
        'var(--apollo-color-orange-500)'
      );
    });

    it('should respect custom naming function', () => {
      const options: TransformOptions = {
        namingFn: (name: string) => name.toLowerCase(),
      };
      expect(transformToken('ColorOrange500', '#ff6b35', options)).toBe('var(--colororange500)');
    });

    it('should combine multiple options', () => {
      const options: TransformOptions = {
        cssVarPrefix: '--tw-',
        wrapInVar: false,
      };
      expect(transformToken('ColorOrange500', '#ff6b35', options)).toBe('--tw-color-orange-500');
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid token value', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => transformToken('ColorInvalid', null as any)).toThrow(
        'Invalid token value for "ColorInvalid": expected string or number, got object'
      );
    });

    it('should throw error for undefined value', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => transformToken('ColorInvalid', undefined as any)).toThrow(
        'Invalid token value for "ColorInvalid": expected string or number, got undefined'
      );
    });

    it('should throw error for object value', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => transformToken('ColorInvalid', {} as any)).toThrow(
        'Invalid token value for "ColorInvalid": expected string or number, got object'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty string value', () => {
      expect(transformToken('EmptyValue', '')).toBe('var(--empty-value)');
    });

    it('should handle zero number value', () => {
      expect(transformToken('ZeroValue', 0)).toBe('var(--zero-value)');
    });

    it('should handle negative number value', () => {
      expect(transformToken('NegativeValue', -5)).toBe('var(--negative-value)');
    });
  });
});

describe('transformTokens', () => {
  describe('basic transformation', () => {
    it('should transform all tokens in an object', () => {
      const tokens: TokenInput = {
        ColorOrange500: '#ff6b35',
        ColorBlue600: '#0066cc',
        SpacingBase: 16,
      };

      const result = transformTokens(tokens);

      expect(result).toEqual({
        ColorOrange500: 'var(--color-orange-500)',
        ColorBlue600: 'var(--color-blue-600)',
        SpacingBase: 'var(--spacing-base)',
      });
    });

    it('should handle empty token object', () => {
      expect(transformTokens({})).toEqual({});
    });
  });

  describe('options handling', () => {
    it('should apply options to all tokens', () => {
      const tokens: TokenInput = {
        ColorOrange500: '#ff6b35',
        ColorBlue600: '#0066cc',
      };

      const options: TransformOptions = { wrapInVar: false };
      const result = transformTokens(tokens, options);

      expect(result).toEqual({
        ColorOrange500: '--color-orange-500',
        ColorBlue600: '--color-blue-600',
      });
    });
  });

  describe('error handling', () => {
    it('should throw error if any token value is invalid', () => {
      const tokens: TokenInput = {
        ColorOrange500: '#ff6b35',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ColorInvalid: null as any,
      };

      expect(() => transformTokens(tokens)).toThrow('Invalid token value for "ColorInvalid"');
    });

    it('should preserve the token name in error message', () => {
      const tokens: TokenInput = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        SomeBadToken: undefined as any,
      };

      expect(() => transformTokens(tokens)).toThrow('Invalid token value for "SomeBadToken"');
    });
  });
});
