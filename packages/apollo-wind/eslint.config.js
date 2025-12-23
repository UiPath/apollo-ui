import prettierConfig from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import vitestPlugin from 'eslint-plugin-vitest';
import globals from 'globals';

import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: 'readonly',
        RequestInit: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Complexity rules (from Biome)
      'no-regex-spaces': 'error',
      'no-extra-boolean-cast': 'error',
      'no-useless-catch': 'error',
      'no-useless-escape': 'error',

      // Correctness rules (from Biome)
      'no-const-assign': 'error',
      'no-constant-condition': 'error',
      'no-empty-character-class': 'error',
      'no-empty-pattern': 'error',
      'no-obj-calls': 'error',
      'no-new-native-nonconstructor': 'error',
      'constructor-super': 'error',
      'no-nonoctal-decimal-escape': 'error',
      'no-loss-of-precision': 'error',
      'no-self-assign': 'error',
      'no-setter-return': 'error',
      'no-case-declarations': 'error',
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-optional-chaining': 'error',
      'no-unused-labels': 'error',
      'no-unused-private-class-members': 'error',
      'use-isnan': 'error',
      'for-direction': 'error',
      'valid-typeof': 'error',
      'require-yield': 'error',

      // Suspicious rules (from Biome)
      'no-cond-assign': 'error',
      'no-async-promise-executor': 'error',
      'no-ex-assign': 'error',
      'no-class-assign': 'error',
      'no-compare-neg-zero': 'error',
      'no-constant-binary-expression': 'error',
      'no-control-regex': 'error',
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'no-dupe-class-members': 'error',
      'no-dupe-else-if': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-empty': 'error',
      'no-fallthrough': 'error',
      'no-func-assign': 'error',
      'no-global-assign': 'error',
      'no-import-assign': 'error',
      'no-irregular-whitespace': 'error',
      'no-misleading-character-class': 'error',
      'no-prototype-builtins': 'error',
      'no-redeclare': 'error',
      'no-shadow-restricted-names': 'error',
      'no-sparse-arrays': 'error',
      'no-unsafe-negation': 'error',
      'no-useless-backreference': 'error',
      'no-with': 'error',
      'getter-return': 'error',
      'no-var': 'error',

      // Style rules (from Biome)
      'prefer-const': 'error',
      'no-array-constructor': 'error',

      // TypeScript specific rules (from Biome)
      'no-restricted-globals': ['error', 'arguments'],
      '@typescript-eslint/no-this-alias': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-extra-non-null-assertion': 'error',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
        },
      ],
      '@typescript-eslint/no-unsafe-declaration-merging': 'error',
      '@typescript-eslint/prefer-namespace-keyword': 'error',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/prefer-as-const': 'error',

      // React specific rules (from Biome)
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',

      // Additional needed rules for React (minimal)
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/no-unknown-property': [
        'error',
        {
          ignore: ['cmdk-input-wrapper'],
        },
      ],
    },
  },
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      'storybook-static/**',
      '.storybook/**',
      'examples/**',
      '**/*.css',
    ],
  },
  // Test files configuration
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.test.js',
      '**/*.test.jsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.spec.js',
      '**/*.spec.jsx',
    ],
    plugins: {
      vitest: vitestPlugin,
    },
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        vitest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  // Stories files configuration
  {
    files: ['**/*.stories.ts', '**/*.stories.tsx', '**/*.stories.js', '**/*.stories.jsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'no-undef': 'off',
    },
  },
  // Examples files configuration
  {
    files: [
      '**/examples/**/*.ts',
      '**/examples/**/*.tsx',
      '**/examples/**/*.js',
      '**/examples/**/*.jsx',
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  prettierConfig,
];

export default config;
