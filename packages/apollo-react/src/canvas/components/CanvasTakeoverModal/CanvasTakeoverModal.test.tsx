import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CanvasTakeoverModal } from './CanvasTakeoverModal';

describe('CanvasTakeoverModal', () => {
  it('renders an optional sidebar and toggles its expanded state', () => {
    const onExpandedChange = vi.fn();
    render(
      <CanvasTakeoverModal
        open
        title="Manage datasets"
        sidebar={<nav>Datasets</nav>}
        onExpandedChange={onExpandedChange}
      >
        Datapoints
      </CanvasTakeoverModal>
    );

    expect(screen.getByRole('navigation')).toHaveTextContent('Datasets');
    expect(screen.getByRole('dialog')).toHaveAttribute('data-expanded', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Expand modal' }));

    expect(screen.getByRole('dialog')).toHaveAttribute('data-expanded', 'true');
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });

  it('requests close from Escape, the close button, and the backdrop', () => {
    const onOpenChange = vi.fn();
    render(
      <CanvasTakeoverModal open title="Modal" onOpenChange={onOpenChange}>
        Content
      </CanvasTakeoverModal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    fireEvent.mouseDown(screen.getByTestId('canvas-takeover-backdrop'));

    expect(onOpenChange).toHaveBeenCalledTimes(3);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('does not render while closed', () => {
    render(
      <CanvasTakeoverModal open={false} title="Modal">
        Content
      </CanvasTakeoverModal>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not reserve sidebar space when sidebar is null', () => {
    render(
      <CanvasTakeoverModal open title="Modal" sidebar={null}>
        Content
      </CanvasTakeoverModal>
    );

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('moves focus into the modal and restores it after closing', async () => {
    const { rerender } = render(
      <>
        <button type="button">Open modal</button>
        <CanvasTakeoverModal open={false} title="Modal">
          Content
        </CanvasTakeoverModal>
      </>
    );
    const trigger = screen.getByRole('button', { name: 'Open modal' });
    trigger.focus();

    rerender(
      <>
        <button type="button">Open modal</button>
        <CanvasTakeoverModal open title="Modal">
          Content
        </CanvasTakeoverModal>
      </>
    );

    await waitFor(() => expect(screen.getByRole('button', { name: 'Expand modal' })).toHaveFocus());

    rerender(
      <>
        <button type="button">Open modal</button>
        <CanvasTakeoverModal open={false} title="Modal">
          Content
        </CanvasTakeoverModal>
      </>
    );

    await waitFor(() => expect(screen.getByRole('button', { name: 'Open modal' })).toHaveFocus());
  });
});
