import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies animate-pulse class', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('applies rounded-md class', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('rounded-md');
  });

  it('applies bg-muted class', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('bg-muted');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-skeleton" />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('custom-skeleton');
  });

  it('supports custom dimensions', () => {
    const { container } = render(<Skeleton className="h-12 w-12" />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('h-12');
    expect(skeleton).toHaveClass('w-12');
  });

  it('supports additional HTML attributes', () => {
    render(<Skeleton data-testid="skeleton-loader" />);
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('can render circular skeleton', () => {
    const { container } = render(<Skeleton className="rounded-full h-12 w-12" />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('rounded-full');
  });

  it('can render text skeleton', () => {
    const { container } = render(<Skeleton className="h-4 w-full" />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('h-4');
    expect(skeleton).toHaveClass('w-full');
  });

  it('can render multiple skeleton lines', () => {
    const { container } = render(
      <div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(2);
  });

  it('supports aria-busy attribute', () => {
    render(<Skeleton aria-busy="true" aria-label="Loading" />);
    const skeleton = screen.getByLabelText('Loading');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });
});
