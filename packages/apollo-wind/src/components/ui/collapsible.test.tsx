import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

describe('Collapsible', () => {
  const CollapsibleExample = ({
    onOpenChange = vi.fn(),
  }: {
    onOpenChange?: (open: boolean) => void;
  }) => (
    <Collapsible onOpenChange={onOpenChange}>
      <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      <CollapsibleContent>This is the collapsible content</CollapsibleContent>
    </Collapsible>
  );

  it('renders without crashing', () => {
    render(<CollapsibleExample />);
    expect(screen.getByRole('button', { name: 'Toggle' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<CollapsibleExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('is collapsed by default', () => {
    render(<CollapsibleExample />);
    expect(screen.queryByText('This is the collapsible content')).not.toBeInTheDocument();
  });

  it('expands when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<CollapsibleExample />);

    const trigger = screen.getByRole('button', { name: 'Toggle' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('This is the collapsible content')).toBeInTheDocument();
    });
  });

  it('collapses when trigger is clicked again', async () => {
    const user = userEvent.setup();
    render(<CollapsibleExample />);

    const trigger = screen.getByRole('button', { name: 'Toggle' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('This is the collapsible content')).toBeInTheDocument();
    });

    await user.click(trigger);

    await waitFor(() => {
      expect(screen.queryByText('This is the collapsible content')).not.toBeInTheDocument();
    });
  });

  it('calls onOpenChange when toggled', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();
    render(<CollapsibleExample onOpenChange={handleOpenChange} />);

    const trigger = screen.getByRole('button', { name: 'Toggle' });
    await user.click(trigger);

    expect(handleOpenChange).toHaveBeenCalledWith(true);
  });

  it('supports keyboard interaction with Space', async () => {
    const user = userEvent.setup();
    render(<CollapsibleExample />);

    const trigger = screen.getByRole('button', { name: 'Toggle' });
    trigger.focus();
    await user.keyboard(' ');

    await waitFor(() => {
      expect(screen.getByText('This is the collapsible content')).toBeInTheDocument();
    });
  });

  it('supports keyboard interaction with Enter', async () => {
    const user = userEvent.setup();
    render(<CollapsibleExample />);

    const trigger = screen.getByRole('button', { name: 'Toggle' });
    trigger.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('This is the collapsible content')).toBeInTheDocument();
    });
  });

  it('can be disabled', () => {
    render(
      <Collapsible disabled>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    const trigger = screen.getByRole('button', { name: 'Toggle' });
    expect(trigger).toBeDisabled();
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();
    render(
      <Collapsible disabled onOpenChange={handleOpenChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    const trigger = screen.getByRole('button', { name: 'Toggle' });
    await user.click(trigger);

    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  it('supports default open state', () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content shown by default</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.getByText('Content shown by default')).toBeInTheDocument();
  });

  it('supports controlled mode', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();
    const { rerender } = render(
      <Collapsible open={false} onOpenChange={handleOpenChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Controlled content</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.queryByText('Controlled content')).not.toBeInTheDocument();

    const trigger = screen.getByRole('button', { name: 'Toggle' });
    await user.click(trigger);

    expect(handleOpenChange).toHaveBeenCalledWith(true);

    rerender(
      <Collapsible open={true} onOpenChange={handleOpenChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Controlled content</CollapsibleContent>
      </Collapsible>
    );

    await waitFor(() => {
      expect(screen.getByText('Controlled content')).toBeInTheDocument();
    });
  });

  it('has proper ARIA attributes', () => {
    render(<CollapsibleExample />);
    const trigger = screen.getByRole('button', { name: 'Toggle' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('updates ARIA attributes when expanded', async () => {
    const user = userEvent.setup();
    render(<CollapsibleExample />);

    const trigger = screen.getByRole('button', { name: 'Toggle' });
    await user.click(trigger);

    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('supports asChild on trigger', async () => {
    const user = userEvent.setup();
    render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <button>Custom trigger</button>
        </CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    const trigger = screen.getByRole('button', { name: 'Custom trigger' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  it('supports asChild on content', async () => {
    const user = userEvent.setup();
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent asChild>
          <div>Custom content wrapper</div>
        </CollapsibleContent>
      </Collapsible>
    );

    const trigger = screen.getByRole('button', { name: 'Toggle' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Custom content wrapper')).toBeInTheDocument();
    });
  });
});
