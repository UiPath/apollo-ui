import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock dynamic imports for SVG files
vi.mock('@uipath/apollo-core/icons/svg/*.svg', async () => {
  return {
    default: '<svg width="24" height="24"><circle cx="12" cy="12" r="10" /></svg>',
  };
});

// Add custom matchers
expect.extend({});
