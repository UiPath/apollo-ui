import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer';

describe('Drawer', () => {
  const DrawerExample = () => (
    <Drawer>
      <DrawerTrigger>Open Drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Drawer Title</DrawerTitle>
          <DrawerDescription>This is a drawer description.</DrawerDescription>
        </DrawerHeader>
        <div>Drawer body content</div>
        <DrawerFooter>
          <DrawerClose>Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );

  it('renders trigger without crashing', () => {
    render(<DrawerExample />);
    expect(screen.getByRole('button', { name: 'Open Drawer' })).toBeInTheDocument();
  });

  it('has no accessibility violations when closed', async () => {
    const { container } = render(<DrawerExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('opens drawer when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<DrawerExample />);

    await user.click(screen.getByRole('button', { name: 'Open Drawer' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('displays title and description when open', async () => {
    const user = userEvent.setup();
    render(<DrawerExample />);

    await user.click(screen.getByRole('button', { name: 'Open Drawer' }));

    await waitFor(() => {
      expect(screen.getByText('Drawer Title')).toBeInTheDocument();
      expect(screen.getByText('This is a drawer description.')).toBeInTheDocument();
    });
  });

  it('displays drawer body content when open', async () => {
    const user = userEvent.setup();
    render(<DrawerExample />);

    await user.click(screen.getByRole('button', { name: 'Open Drawer' }));

    await waitFor(() => {
      expect(screen.getByText('Drawer body content')).toBeInTheDocument();
    });
  });

  it('renders an overlay with the bg-curtain class when open', async () => {
    const user = userEvent.setup();
    render(<DrawerExample />);

    await user.click(screen.getByRole('button', { name: 'Open Drawer' }));

    await waitFor(() => {
      const overlay = document.querySelector('.bg-curtain');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('fixed', 'inset-0');
    });
  });

  it('applies content styling classes and merges custom className', async () => {
    const user = userEvent.setup();
    render(
      <Drawer>
        <DrawerTrigger>Open Drawer</DrawerTrigger>
        <DrawerContent className="custom-drawer">
          <DrawerTitle>Title</DrawerTitle>
          <DrawerDescription>Description</DrawerDescription>
        </DrawerContent>
      </Drawer>
    );

    await user.click(screen.getByRole('button', { name: 'Open Drawer' }));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-drawer');
      expect(dialog).toHaveClass('bg-background');
    });
  });

  it('closes drawer with close button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Drawer onOpenChange={onOpenChange}>
        <DrawerTrigger>Open Drawer</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Drawer Title</DrawerTitle>
            <DrawerDescription>This is a drawer description.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose>Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );

    await user.click(screen.getByRole('button', { name: 'Open Drawer' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(onOpenChange).toHaveBeenCalledWith(true);

    // fireEvent.click avoids userEvent's pointer event sequence: vaul's drag
    // release handler reads the computed transform, which jsdom does not
    // implement, and crashes on pointerup inside the drawer content.
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    // vaul unmounts the dialog only after its exit transition finishes, and
    // jsdom never fires transition events, so assert the closed state instead.
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'closed');
    });
  });

  it('has no accessibility violations when open', async () => {
    const user = userEvent.setup();
    const { container } = render(<DrawerExample />);

    await user.click(screen.getByRole('button', { name: 'Open Drawer' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
