import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['scripts/**/*.ts'],
      exclude: [
        'scripts/**/*.test.ts',
        'scripts/**/*.spec.ts',
        'scripts/test/**',
      ],
    },
  },
});
