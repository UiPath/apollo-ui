import { resolve } from 'node:path';
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
    testTimeout: 30000,
    hookTimeout: 20000,
    setupFiles: ['./tests/setup.ts'],
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/index.ts', 'dist/', 'tests/', '**/*.test.ts', '**/*.test.tsx'],
      all: false,
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
