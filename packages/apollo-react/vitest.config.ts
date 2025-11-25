import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/index.ts',
        'src/test/**',
      ],
    },
  },
  resolve: {
    alias: [
      {
        find: '@uipath/apollo-core/icons/svg',
        replacement: fileURLToPath(new URL('../apollo-core/src/icons/svg', import.meta.url)),
      },
    ],
  },
});
