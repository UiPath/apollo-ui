import { ViteUserConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export const vitestConfig: ViteUserConfig = {
  plugins: [tsconfigPaths({ root: '../..', configNames: ['tsconfig.base.json'] })],
  test: {
    environment: 'happy-dom',
    setupFiles: ['../test/src/test-setup.ts'],
    includeSource: ['./src/**/*.{ts,tsx}'],
    exclude: ['node_modules'],
    globals: true,
    coverage: {
      include: ['./src/**/*.{ts,tsx}'],
      exclude: ['**/*.{stories,test,spec}.{ts,tsx}', 'dist/**', 'node_modules/**', '.storybook/**'],
      thresholds: {
        statements: 70,
        functions: 70,
        branches: 70,
        lines: 70,
      },
      // TODO: Uncomment this line to see coverage report in the terminal
      reporter: 'lcov',
    },
  },
};
