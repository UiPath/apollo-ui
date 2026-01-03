import '@testing-library/jest-dom';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Import canvas-specific mocks (from deleted canvas/test/test-setup.ts)
import './canvas-mocks';
