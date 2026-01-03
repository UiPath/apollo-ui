import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';

describe('Sheet', () => {
  const SheetExample = ({ side = 'right' as const }) => (
    <Sheet>
      <SheetTrigger>Open Sheet</SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>This is a sheet description.</SheetDescription>
        </SheetHeader>
        <div>Sheet content goes here</div>
        <SheetFooter>
          <SheetClose>Close</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  it('renders trigger without crashing', () => {
    render(<SheetExample />);
    expect(screen.getByRole('button', { name: 'Open Sheet' })).toBeInTheDocument();
  });

  it('has no accessibility violations when closed', async () => {
    const { container } = render(<SheetExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations when open', async () => {
    const user = userEvent.setup();
    const { container } = render(<SheetExample />);

    const trigger = screen.getByRole('button', { name: 'Open Sheet' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('opens sheet when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<SheetExample />);

    const trigger = screen.getByRole('button', { name: 'Open Sheet' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('displays sheet title', async () => {
    const user = userEvent.setup();
    render(<SheetExample />);

    const trigger = screen.getByRole('button', { name: 'Open Sheet' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Sheet Title')).toBeInTheDocument();
    });
  });

  it('displays sheet description', async () => {
    const user = userEvent.setup();
    render(<SheetExample />);

    const trigger = screen.getByRole('button', { name: 'Open Sheet' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('This is a sheet description.')).toBeInTheDocument();
    });
  });

  it('displays sheet content', async () => {
    const user = userEvent.setup();
    render(<SheetExample />);

    const trigger = screen.getByRole('button', { name: 'Open Sheet' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Sheet content goes here')).toBeInTheDocument();
    });
  });

  it('closes sheet with close button', async () => {
    const user = userEvent.setup();
    render(<SheetExample />);

    const trigger = screen.getByRole('button', { name: 'Open Sheet' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Find the Close button in the footer (not the X button)
    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    const closeButton = closeButtons.find((btn) => btn.textContent === 'Close');
    if (closeButton) {
      await user.click(closeButton);
    }

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes sheet with Escape key', async () => {
    const user = userEvent.setup();
    render(<SheetExample />);

    const trigger = screen.getByRole('button', { name: 'Open Sheet' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('supports controlled mode', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();
    const { rerender } = render(
      <Sheet open={false} onOpenChange={handleOpenChange}>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
        </SheetContent>
      </Sheet>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);

    expect(handleOpenChange).toHaveBeenCalledWith(true);

    rerender(
      <Sheet open={true} onOpenChange={handleOpenChange}>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
        </SheetContent>
      </Sheet>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('applies custom className to content', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent className="custom-sheet">
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
        </SheetContent>
      </Sheet>
    );

    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-sheet');
    });
  });

  it('has proper ARIA attributes', async () => {
    const user = userEvent.setup();
    render(<SheetExample />);

    const trigger = screen.getByRole('button', { name: 'Open Sheet' });
    await user.click(trigger);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });
  });
});
