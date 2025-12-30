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
        find: '@uipath/apollo-react/icons',
        replacement: fileURLToPath(new URL('./src/icons/index.ts', import.meta.url)),
      },
      {
        find: '@uipath/apollo-react/material/components',
        replacement: fileURLToPath(new URL('./src/material/components/index.ts', import.meta.url)),
      },
      {
        find: '@uipath/apollo-react/material/theme',
        replacement: fileURLToPath(new URL('./src/material/theme/index.ts', import.meta.url)),
      },
      {
        find: '@uipath/apollo-react/material',
        replacement: fileURLToPath(new URL('./src/material/index.ts', import.meta.url)),
      },
      {
        find: '@uipath/apollo-react/canvas/xyflow/react',
        replacement: fileURLToPath(new URL('./src/canvas/xyflow/react.ts', import.meta.url)),
      },
      {
        find: '@uipath/apollo-react/canvas/xyflow/system',
        replacement: fileURLToPath(new URL('./src/canvas/xyflow/system.ts', import.meta.url)),
      },
      {
        find: '@uipath/apollo-react/canvas/layouts',
        replacement: fileURLToPath(new URL('./src/canvas/layouts/index.ts', import.meta.url)),
      },
      {
        find: '@uipath/apollo-react/canvas/hooks',
        replacement: fileURLToPath(new URL('./src/canvas/hooks/index.ts', import.meta.url)),
      },
      {
        find: '@uipath/apollo-react/canvas/utils',
        replacement: fileURLToPath(new URL('./src/canvas/utils/index.ts', import.meta.url)),
      },
      {
        find: '@uipath/apollo-react/canvas/controls',
        replacement: fileURLToPath(new URL('./src/canvas/controls/index.ts', import.meta.url)),
      },
      {
        find: '@uipath/apollo-react/canvas/icons',
        replacement: fileURLToPath(new URL('./src/canvas/icons/index.ts', import.meta.url)),
      },
      {
        find: '@uipath/apollo-react/canvas/components',
        replacement: fileURLToPath(new URL('./src/canvas/components/index.ts', import.meta.url)),
      },
      {
        find: '@uipath/apollo-react/canvas/types',
        replacement: fileURLToPath(new URL('./src/canvas/types.ts', import.meta.url)),
      },
      {
        find: '@uipath/apollo-react/canvas/constants',
        replacement: fileURLToPath(new URL('./src/canvas/constants.ts', import.meta.url)),
      },
      {
        find: '@uipath/apollo-react/canvas',
        replacement: fileURLToPath(new URL('./src/canvas/index.ts', import.meta.url)),
      },
    ],
  },
});
