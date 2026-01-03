import { type RenderOptions, type RenderResult, render as rtlRender } from '@testing-library/react';
import type { ReactElement } from 'react';

// Re-export testing-library functions
export { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
export { type UserEvent, userEvent } from '@testing-library/user-event';

// Custom render function that includes providers if needed
function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>): RenderResult {
  return rtlRender(ui, options);
}

export { render };
