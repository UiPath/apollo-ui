import '@testing-library/jest-dom';

import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import { afterEach, expect } from 'vitest';

// Extend Vitest's expect with jest-axe matchers (a11y assertions in component suites)
expect.extend(toHaveNoViolations);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Import canvas-specific mocks (from deleted canvas/test/test-setup.ts)
import './canvas-mocks';
