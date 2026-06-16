import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      include: ['scripts/**/*.ts'],
      exclude: [
        'scripts/**/*.test.ts',
        'scripts/**/*.spec.ts',
        'scripts/test/**',
      ],
    },
  },
});
