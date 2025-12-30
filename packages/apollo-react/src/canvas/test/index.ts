import { ReactElement } from 'react';
import { RenderOptions, RenderResult, render as rtlRender } from '@testing-library/react';

// Re-export testing-library functions
export { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Custom render function that includes providers if needed
function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>): RenderResult {
  return rtlRender(ui, options);
}

export * from './test-setup';
export * from './vitest.config';
export { render };
