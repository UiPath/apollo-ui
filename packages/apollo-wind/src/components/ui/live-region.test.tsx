import { act, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveRegion, type LiveRegionHandle } from './live-region';

describe('LiveRegion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a visually hidden polite status by default', () => {
    render(<LiveRegion />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('data-slot', 'live-region');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    expect(region).toHaveClass('sr-only');
    expect(region).toBeEmptyDOMElement();
  });

  it('uses role="alert" when assertive', () => {
    render(<LiveRegion aria-live="assertive" />);
    const region = screen.getByRole('alert');
    expect(region).toHaveAttribute('aria-live', 'assertive');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('can turn aria-atomic off', () => {
    render(<LiveRegion aria-atomic={false} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-atomic', 'false');
  });

  it('renders the message into the live node and announces changes', () => {
    const { rerender } = render(<LiveRegion message="Response ready" />);
    expect(screen.getByRole('status')).toHaveTextContent('Response ready');
    rerender(<LiveRegion message="2 files attached" />);
    expect(screen.getByRole('status')).toHaveTextContent('2 files attached');
  });

  it('clears the text after clearAfter', () => {
    render(<LiveRegion message="Saved" clearAfter={500} />);
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Saved');
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(region).toHaveTextContent('Saved');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(region).toBeEmptyDOMElement();
  });

  it('clears after 1000ms by default and keeps the text with clearAfter={0}', () => {
    const { unmount } = render(<LiveRegion message="Saved" />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    unmount();

    render(<LiveRegion message="Saved" clearAfter={0} />);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('debounces rapid updates to the last message', () => {
    const { rerender } = render(<LiveRegion debounce={200} />);
    const region = screen.getByRole('status');
    rerender(<LiveRegion debounce={200} message="Token 1" />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender(<LiveRegion debounce={200} message="Token 2" />);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender(<LiveRegion debounce={200} message="Token 3" />);
    expect(region).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(region).toHaveTextContent('Token 3');
  });

  it('announces through the ref handle and replaces the node for a repeated message', () => {
    const ref = createRef<LiveRegionHandle>();
    render(<LiveRegion ref={ref} />);
    const region = screen.getByRole('status');

    act(() => ref.current?.announce('Copied'));
    const first = region.firstChild;
    expect(region).toHaveTextContent('Copied');

    act(() => ref.current?.announce('Copied'));
    expect(region).toHaveTextContent('Copied');
    expect(region.firstChild).not.toBe(first);

    act(() => ref.current?.clear());
    expect(region).toBeEmptyDOMElement();
  });

  it('drops a pending debounced announcement on clear', () => {
    const ref = createRef<LiveRegionHandle>();
    render(<LiveRegion ref={ref} debounce={200} />);
    act(() => ref.current?.announce('Later'));
    act(() => ref.current?.clear());
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('has no accessibility violations', async () => {
    vi.useRealTimers();
    const { container } = render(
      <>
        <LiveRegion message="Response ready" />
        <LiveRegion aria-live="assertive" message="Upload failed" />
      </>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
