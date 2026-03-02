import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders with title', () => {
    render(<EmptyState title="No results found" />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <EmptyState
        title="No data available"
        description="Try adjusting your filters or adding new items"
        action={{ label: 'Add Item', onClick: vi.fn() }}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders with description', () => {
    render(
      <EmptyState title="No items" description="There are no items to display at this time." />
    );
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display at this time.')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    const { container } = render(
      <EmptyState title="Empty" icon={<span data-testid="custom-icon">📦</span>} />
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    const iconContainer = container.querySelector('.items-center.justify-center');
    expect(iconContainer).toBeInTheDocument();
  });

  it('renders primary action button', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<EmptyState title="No data" action={{ label: 'Add Item', onClick: handleClick }} />);

    const button = screen.getByRole('button', { name: /add item/i });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders secondary action button', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <EmptyState title="No data" secondaryAction={{ label: 'Learn More', onClick: handleClick }} />
    );

    const button = screen.getByRole('button', { name: /learn more/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('border');

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders both primary and secondary actions', () => {
    render(
      <EmptyState
        title="No data"
        action={{ label: 'Primary', onClick: vi.fn() }}
        secondaryAction={{ label: 'Secondary', onClick: vi.fn() }}
      />
    );

    expect(screen.getByRole('button', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /secondary/i })).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(<EmptyState title="Test" className="custom-empty-state" />);
    const emptyState = container.firstChild as HTMLElement;
    expect(emptyState).toHaveClass('custom-empty-state');
  });

  it('applies default layout classes', () => {
    const { container } = render(<EmptyState title="Test" />);
    const emptyState = container.firstChild as HTMLElement;
    expect(emptyState).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'p-8',
      'text-center'
    );
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<EmptyState ref={ref} title="Test" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
