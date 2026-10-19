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

  it('renders a compact size with the title as a paragraph and small actions', () => {
    const { container } = render(
      <EmptyState
        size="compact"
        title="No chat history"
        description="Conversations appear here."
        action={{ label: 'New chat', onClick: vi.fn() }}
      />
    );
    expect(container.firstChild).toHaveAttribute('data-size', 'compact');
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByText('No chat history').tagName).toBe('P');
    expect(screen.getByRole('button', { name: 'New chat' })).toHaveClass('h-9');
  });

  it('keeps the title a heading by default', () => {
    render(<EmptyState title="No data" />);
    expect(screen.getByRole('heading', { name: 'No data' })).toBeInTheDocument();
    expect(screen.getByText('No data').parentElement).not.toHaveAttribute('data-size');
  });

  it('has no accessibility violations when compact', async () => {
    const { container } = render(
      <EmptyState
        size="compact"
        title="No chat history"
        description="Conversations appear here."
        action={{ label: 'New chat', onClick: vi.fn() }}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('turns compact under a compact ancestor unless a size is set', () => {
    const { container, rerender } = render(
      <div data-density="compact">
        <EmptyState title="No chat history" />
      </div>
    );
    const root = () => container.querySelector('[data-slot="empty-state"]');
    expect(root()).toHaveAttribute('data-size', 'compact');
    expect(screen.getByText('No chat history').tagName).toBe('P');
    expect(screen.queryByRole('heading')).toBeNull();

    rerender(
      <div data-density="compact">
        <EmptyState title="No chat history" size="default" />
      </div>
    );
    expect(root()).not.toHaveAttribute('data-size');
    expect(screen.getByRole('heading', { name: 'No chat history' })).toBeInTheDocument();
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
    const icon = screen.getByTestId('custom-icon');
    expect(icon).toBeInTheDocument();
    expect(icon.parentElement).toBeInTheDocument();
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
