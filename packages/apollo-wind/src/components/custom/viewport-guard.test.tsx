import { act, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { beforeEach, describe, expect, it } from 'vitest';
import { useViewportAtOrAbove, ViewportGuard } from './viewport-guard';

// ============================================================================
// Local matchMedia mock
//
// tests/setup.ts installs a matchMedia stub that always reports
// `matches: false`, which is not enough to exercise both branches of
// ViewportGuard. This file replaces it with a width-aware mock that
// evaluates (min-width) / (max-width) queries against a fake viewport
// width and supports change listeners.
// ============================================================================

let viewportWidth = 1280;
const changeListeners = new Set<() => void>();

function queryMatches(query: string): boolean {
  const maxMatch = query.match(/\(max-width:\s*([\d.]+)px\)/);
  if (maxMatch) return viewportWidth <= Number.parseFloat(maxMatch[1]);
  const minMatch = query.match(/\(min-width:\s*([\d.]+)px\)/);
  if (minMatch) return viewportWidth >= Number.parseFloat(minMatch[1]);
  return false;
}

function installMatchMediaMock() {
  window.matchMedia = ((query: string) => ({
    get matches() {
      return queryMatches(query);
    },
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: (_type: string, listener: () => void) => {
      changeListeners.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      changeListeners.delete(listener);
    },
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function setViewportWidth(width: number) {
  viewportWidth = width;
  act(() => {
    for (const listener of changeListeners) {
      listener();
    }
  });
}

beforeEach(() => {
  viewportWidth = 1280;
  changeListeners.clear();
  installMatchMediaMock();
});

// ============================================================================
// Test helper for the hook
// ============================================================================

function HookProbe({ minWidth }: { minWidth: number }) {
  const isAtOrAbove = useViewportAtOrAbove(minWidth);
  return <span data-testid="hook-result">{String(isAtOrAbove)}</span>;
}

// ============================================================================
// Tests
// ============================================================================

describe('ViewportGuard', () => {
  it('renders children when the viewport is at or above minWidth', () => {
    viewportWidth = 1024;
    render(
      <ViewportGuard minWidth={769}>
        <p>Guarded content</p>
      </ViewportGuard>
    );
    expect(screen.getByText('Guarded content')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the overlay instead of children when the viewport is below minWidth', () => {
    viewportWidth = 500;
    render(
      <ViewportGuard minWidth={769}>
        <p>Guarded content</p>
      </ViewportGuard>
    );
    expect(screen.queryByText('Guarded content')).not.toBeInTheDocument();
    const overlay = screen.getByRole('status');
    expect(overlay).toHaveTextContent(
      'This view is not available at this screen size. Please use a larger viewport.'
    );
  });

  it('renders a custom overlay message', () => {
    viewportWidth = 500;
    render(
      <ViewportGuard minWidth={1024} message="Please widen your browser window.">
        <p>Guarded content</p>
      </ViewportGuard>
    );
    expect(screen.getByRole('status')).toHaveTextContent('Please widen your browser window.');
  });

  it('switches between overlay and content when the viewport crosses the threshold', () => {
    viewportWidth = 1024;
    render(
      <ViewportGuard minWidth={769}>
        <p>Guarded content</p>
      </ViewportGuard>
    );
    expect(screen.getByText('Guarded content')).toBeInTheDocument();

    setViewportWidth(600);
    expect(screen.queryByText('Guarded content')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    setViewportWidth(1200);
    expect(screen.getByText('Guarded content')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('has no accessibility violations in the overlay state', async () => {
    viewportWidth = 500;
    const { container } = render(
      <ViewportGuard minWidth={769}>
        <p>Guarded content</p>
      </ViewportGuard>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('useViewportAtOrAbove', () => {
  it('returns true when the viewport is at or above the threshold', () => {
    viewportWidth = 1280;
    render(<HookProbe minWidth={1024} />);
    expect(screen.getByTestId('hook-result')).toHaveTextContent('true');
  });

  it('returns false when the viewport is below the threshold', () => {
    viewportWidth = 800;
    render(<HookProbe minWidth={1024} />);
    expect(screen.getByTestId('hook-result')).toHaveTextContent('false');
  });

  it('updates when the viewport crosses the threshold', () => {
    viewportWidth = 800;
    render(<HookProbe minWidth={1024} />);
    expect(screen.getByTestId('hook-result')).toHaveTextContent('false');

    setViewportWidth(1440);
    expect(screen.getByTestId('hook-result')).toHaveTextContent('true');
  });
});
