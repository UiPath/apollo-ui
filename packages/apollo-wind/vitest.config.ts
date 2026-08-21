import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  define: {
    'globalThis.IS_REACT_ACT_ENVIRONMENT': 'true',
    'global.IS_REACT_ACT_ENVIRONMENT': 'true',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/*.stories.tsx',
        '**/index.ts',
        'dist/',
        '.storybook/',
        'storybook-static/',
        '*.config.ts',
        '*.config.js',
        // Storybook-only demo apps, excluded from the published build (see rslib.config.ts)
        'src/templates/**',
      ],
      include: ['src/**/*.{ts,tsx}'],
      all: true,
      // Ratcheting floor: raise toward 80 as coverage grows, never lower it.
      // Vitest only enforces thresholds nested under `coverage.thresholds`;
      // top-level lines/functions/... are silently ignored.
      thresholds: {
        lines: 55,
        functions: 55,
        branches: 45,
        statements: 55,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
