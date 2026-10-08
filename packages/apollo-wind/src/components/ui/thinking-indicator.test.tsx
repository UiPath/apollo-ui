import { act, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_THINKING_INDICATOR_STRINGS,
  ThinkingIndicator,
  thinkingIndicatorVariants,
} from './thinking-indicator';

function activeLabel(container: HTMLElement) {
  return container.querySelector('[data-active="true"]')?.textContent;
}

function mockReducedMotion(reduce: boolean) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

describe('ThinkingIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the default label', () => {
    const { container } = render(<ThinkingIndicator />);
    const status = screen.getByRole('status', { name: DEFAULT_THINKING_INDICATOR_STRINGS.label });
    expect(status).toHaveAttribute('data-slot', 'thinking-indicator');
    expect(activeLabel(container)).toBe('Thinking');
  });

  it('shows a custom label', () => {
    const { container } = render(<ThinkingIndicator label="Searching documents" />);
    expect(screen.getByRole('status', { name: 'Searching documents' })).toBeInTheDocument();
    expect(activeLabel(container)).toBe('Searching documents');
  });

  it('uses strings.label as the default', () => {
    render(<ThinkingIndicator strings={{ label: 'Réflexion' }} />);
    expect(screen.getByRole('status', { name: 'Réflexion' })).toBeInTheDocument();
  });

  it('hides the icon and visual label from assistive technology', () => {
    const { container } = render(<ThinkingIndicator />);
    expect(container.querySelector('[data-slot="thinking-indicator-icon"]')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    expect(container.querySelector('[data-slot="thinking-indicator-label"]')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('rotates messages on the interval and keeps a stable accessible name', () => {
    const { container } = render(
      <ThinkingIndicator messages={['Searching', 'Reading', 'Writing']} interval={1000} />
    );
    const status = screen.getByRole('status');
    expect(activeLabel(container)).toBe('Searching');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(activeLabel(container)).toBe('Reading');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(activeLabel(container)).toBe('Writing');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(activeLabel(container)).toBe('Searching');
    expect(status).toHaveAccessibleName('Thinking');
  });

  it('defaults to a 2500ms interval', () => {
    const { container } = render(<ThinkingIndicator messages={['One', 'Two']} />);
    act(() => {
      vi.advanceTimersByTime(2499);
    });
    expect(activeLabel(container)).toBe('One');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(activeLabel(container)).toBe('Two');
  });

  it('does not rotate when the user prefers reduced motion', () => {
    const restore = mockReducedMotion(true);
    try {
      const { container } = render(
        <ThinkingIndicator messages={['Searching', 'Reading']} interval={1000} />
      );
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(activeLabel(container)).toBe('Searching');
    } finally {
      restore();
    }
  });

  it('keeps the icon and label static under reduced motion', () => {
    const { container } = render(<ThinkingIndicator />);
    expect(container.querySelector('[data-slot="thinking-indicator-icon"]')).toHaveClass(
      'motion-reduce:animate-none'
    );
    expect(container.querySelector('[data-active]')).toHaveClass('shimmer');
  });

  it.each(['sm', 'md'] as const)('applies the %s size', (size) => {
    render(<ThinkingIndicator size={size} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('data-size', size);
    expect(status.className).toBe(thinkingIndicatorVariants({ size }));
  });

  it('forwards refs', () => {
    const ref = createRef<HTMLDivElement>();
    render(<ThinkingIndicator ref={ref} />);
    expect(ref.current).toHaveAttribute('data-slot', 'thinking-indicator');
  });

  it('has no accessibility violations', async () => {
    vi.useRealTimers();
    const { container } = render(<ThinkingIndicator messages={['Searching', 'Reading']} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
