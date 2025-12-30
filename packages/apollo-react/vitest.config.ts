import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/index.ts',
        'src/test/**',
        'src/icons/**',
      ],
    },
  },
  resolve: {
    alias: [
      {
        find: '@uipath/apollo-core/icons/svg',
        replacement: fileURLToPath(new URL('../apollo-core/src/icons/svg', import.meta.url)),
      },
      {
        find: '@uipath/apollo-react/canvas/xyflow/react',
        replacement: fileURLToPath(new URL('./src/canvas/xyflow/react.ts', import.meta.url)),
      },
      {
        find: '@uipath/apollo-react/canvas/xyflow/system',
        replacement: fileURLToPath(new URL('./src/canvas/xyflow/system.ts', import.meta.url)),
      },
    ],
  },
});
