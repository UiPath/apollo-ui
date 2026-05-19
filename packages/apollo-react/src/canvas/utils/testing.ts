import { type RenderOptions, type RenderResult, render as rtlRender } from '@testing-library/react';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { ApI18nProvider } from '../../i18n';

// Re-export testing-library functions
export { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
export { type UserEvent, userEvent } from '@testing-library/user-event';

// Canvas components use `useLingui()` (via `useStageNodeLabels`, the Toolbox,
// etc.) which throws when there is no `I18nProvider` upstream. Production
// code gets the provider from `CanvasProviders` inside `BaseCanvas`; tests
// that render canvas components in isolation get it from this wrapper.
const CanvasTestProviders = ({ children }: { children: ReactNode }) =>
  createElement(ApI18nProvider, { component: 'canvas', children });

// Custom render function that includes providers if needed
function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>): RenderResult {
  return rtlRender(ui, { wrapper: CanvasTestProviders, ...options });
}

export { render };
