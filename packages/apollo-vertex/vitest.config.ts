import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const srcAlias = { '@': resolve(__dirname, './src') };

export default defineConfig({
  define: {
    'globalThis.IS_REACT_ACT_ENVIRONMENT': 'true',
    'global.IS_REACT_ACT_ENVIRONMENT': 'true',
  },
  resolve: {
    alias: srcAlias,
  },
  test: {
    globals: true,
    testTimeout: 30000,
    hookTimeout: 120000,
    globalSetup: ['./tests/global-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/index.ts', 'dist/', 'tests/', '**/*.test.ts', '**/*.test.tsx'],
      all: false,
    },
    projects: [
      {
        resolve: { alias: srcAlias },
        test: {
          name: 'jsdom',
          globals: true,
          environment: 'jsdom',
          include: ['tests/**/*.test.tsx'],
          setupFiles: ['./tests/setup.ts'],
          environmentOptions: {
            jsdom: {
              resources: 'usable',
            },
          },
        },
      },
      {
        resolve: { alias: srcAlias },
        test: {
          name: 'node',
          globals: true,
          environment: 'node',
          include: ['tests/**/*.test.ts'],
        },
      },
    ],
  },
});
