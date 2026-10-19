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
  it('takes the sm look in a compact ancestor unless a size is set', () => {
    const compactSize = 'in-data-[density=compact]:[--thinking-indicator-font-size:0.75rem]';
    const { rerender } = render(
      <div data-density="compact">
        <ThinkingIndicator />
      </div>
    );
    const root = () => screen.getByRole('status');
    expect(root()).toHaveClass(
      'text-(length:--thinking-indicator-font-size,0.875rem)',
      compactSize
    );
    expect(root()).toHaveAttribute('data-size', 'md');
    rerender(
      <div data-density="compact">
        <ThinkingIndicator size="md" />
      </div>
    );
    expect(root()).not.toHaveClass(compactSize);
  });

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

  it('renders the accessible name as visually hidden text', () => {
    const { container, rerender } = render(
      <ThinkingIndicator messages={['Searching', 'Reading']} />
    );
    expect(container.querySelector('.sr-only')).toHaveTextContent('Thinking');
    rerender(<ThinkingIndicator messages={['Searching', 'Reading']} aria-label="Working" />);
    expect(container.querySelector('.sr-only')).toHaveTextContent('Working');
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

  it('restarts from the first label when the messages change but their count does not', () => {
    const { container, rerender } = render(
      <ThinkingIndicator messages={['A', 'B']} interval={1000} />
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(activeLabel(container)).toBe('B');

    rerender(<ThinkingIndicator messages={['C', 'D']} interval={1000} />);
    expect(activeLabel(container)).toBe('C');
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(activeLabel(container)).toBe('C');
  });

  it('keeps rotating when re-rendered with an equal messages array', () => {
    const { container, rerender } = render(
      <ThinkingIndicator messages={['A', 'B']} interval={1000} />
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender(<ThinkingIndicator messages={['A', 'B']} interval={1000} />);
    expect(activeLabel(container)).toBe('B');
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

  it('stops rotating and returns to the first label when reduced motion turns on', () => {
    const original = window.matchMedia;
    const listeners = new Set<() => void>();
    const mql = {
      matches: false,
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    };
    window.matchMedia = (() => mql) as unknown as typeof window.matchMedia;
    try {
      const { container } = render(
        <ThinkingIndicator messages={['Searching', 'Reading', 'Writing']} interval={1000} />
      );
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(activeLabel(container)).toBe('Reading');

      act(() => {
        mql.matches = true;
        for (const fn of listeners) fn();
      });
      expect(activeLabel(container)).toBe('Searching');
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(activeLabel(container)).toBe('Searching');
    } finally {
      window.matchMedia = original;
    }
  });

  it('applies motion-reduce classes to the icon and label', () => {
    const { container } = render(<ThinkingIndicator />);
    expect(container.querySelector('[data-slot="thinking-indicator-icon"] svg')).toHaveClass(
      'motion-reduce:animate-none'
    );
    expect(container.querySelector('[data-active]')).toHaveClass('shimmer');
  });

  it('renders a custom icon in the icon slot', () => {
    const { container } = render(<ThinkingIndicator icon={<svg data-testid="custom-icon" />} />);
    const slot = container.querySelector('[data-slot="thinking-indicator-icon"]');
    expect(slot).toHaveAttribute('aria-hidden', 'true');
    expect(slot).toContainElement(screen.getByTestId('custom-icon'));
    expect(slot?.querySelectorAll('svg')).toHaveLength(1);
  });

  it.each([null, false])('omits the icon when icon is %s', (icon) => {
    const { container } = render(<ThinkingIndicator icon={icon} />);
    expect(container.querySelector('[data-slot="thinking-indicator-icon"]')).toBeNull();
    expect(activeLabel(container)).toBe('Thinking');
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
