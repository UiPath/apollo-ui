import { createElement } from 'react';

import { vi } from 'vitest';

// Mock createRoot and root for React
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn(),
  })),
}));

// Mock the react-renderer to avoid MUI import issues
vi.mock('../react-renderer', () => ({
  createReactRenderer: vi.fn(() => {
    // Return a mock React component
    return (props: any) => createElement('div', { 'data-testid': 'mock-chat' }, 'Mock Chat Component');
  }),
  cleanupReactRenderer: vi.fn(),
}));
