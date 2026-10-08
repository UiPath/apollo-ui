import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_LOADING_DOTS_STRINGS, LoadingDots, loadingDotsVariants } from './loading-dots';

describe('LoadingDots', () => {
  it('renders a status named by the default label', () => {
    render(<LoadingDots />);
    const status = screen.getByRole('status', { name: DEFAULT_LOADING_DOTS_STRINGS.label });
    expect(status).toHaveAttribute('data-slot', 'loading-dots');
  });

  it('uses strings.label, and an explicit aria-label over it', () => {
    const { rerender } = render(<LoadingDots strings={{ label: 'Loading older messages' }} />);
    expect(screen.getByRole('status', { name: 'Loading older messages' })).toBeInTheDocument();
    rerender(<LoadingDots strings={{ label: 'Loading older messages' }} aria-label="Fetching" />);
    expect(screen.getByRole('status', { name: 'Fetching' })).toBeInTheDocument();
  });

  it('renders three hidden, staggered dots', () => {
    const { container } = render(<LoadingDots />);
    const dots = container.querySelectorAll('[data-slot="loading-dot"]');
    expect(dots).toHaveLength(3);
    dots.forEach((dot) => {
      expect(dot).toHaveAttribute('aria-hidden', 'true');
      expect(dot).toHaveClass('animate-loading-dot');
    });
    expect(dots[1]).toHaveClass('[animation-delay:150ms]');
    expect(dots[2]).toHaveClass('[animation-delay:300ms]');
  });

  it.each(['sm', 'md', 'lg'] as const)('applies the %s size', (size) => {
    render(<LoadingDots size={size} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('data-size', size);
    expect(status.className).toBe(loadingDotsVariants({ size }));
  });

  it('defaults to md', () => {
    render(<LoadingDots />);
    expect(screen.getByRole('status')).toHaveAttribute('data-size', 'md');
  });

  it('forwards refs', () => {
    const ref = createRef<HTMLDivElement>();
    render(<LoadingDots ref={ref} />);
    expect(ref.current).toHaveAttribute('data-slot', 'loading-dots');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<LoadingDots />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
