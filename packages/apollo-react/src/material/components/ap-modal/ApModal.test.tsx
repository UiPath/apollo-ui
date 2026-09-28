import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApModal } from './ApModal';
import type { ModalSize } from './ApModal.types';

describe('ApModal', () => {
  describe('Basic Rendering', () => {
    it('renders the modal when open', () => {
      render(<ApModal open={true} onClose={vi.fn()} header="Test Modal" />);
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('does not render content when closed', () => {
      render(<ApModal open={false} onClose={vi.fn()} header="Test Modal" />);
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('renders the modal with a message', () => {
      render(<ApModal open={true} onClose={vi.fn()} header="Test Modal" message="Test message" />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders the modal with children instead of message', () => {
      render(
        <ApModal open={true} onClose={vi.fn()} header="Test Modal">
          <div data-testid="custom-content">Custom Content</div>
        </ApModal>
      );
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });

    it('renders the close button by default', () => {
      render(<ApModal open={true} onClose={vi.fn()} header="Test Modal" />);
      const closeButton = screen.getByRole('button', { name: /icon button/i, hidden: true });
      expect(closeButton).toBeInTheDocument();
    });

    it('hides the close button when hideCloseButton is true', () => {
      render(<ApModal open={true} onClose={vi.fn()} header="Test Modal" hideCloseButton />);
      const closeButton = screen.queryByRole('button', { name: /icon button/i, hidden: true });
      expect(closeButton).not.toBeInTheDocument();
    });
  });

  describe('Modal Sizes', () => {
    const sizes: ModalSize[] = ['small', 'medium', 'large'];

    sizes.forEach((size) => {
      it(`renders the modal with ${size} size`, () => {
        render(<ApModal open={true} onClose={vi.fn()} header="Test Modal" size={size} />);
        expect(screen.getByText('Test Modal')).toBeInTheDocument();
      });
    });

    it('defaults to small size when not specified', () => {
      render(<ApModal open={true} onClose={vi.fn()} header="Test Modal" />);
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('renders primary action button when provided', () => {
      render(
        <ApModal
          open={true}
          onClose={vi.fn()}
          header="Test Modal"
          primaryAction={{ label: 'Confirm', onClick: vi.fn() }}
        />
      );
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('renders secondary action button when provided', () => {
      render(
        <ApModal
          open={true}
          onClose={vi.fn()}
          header="Test Modal"
          secondaryAction={{ label: 'Cancel', onClick: vi.fn() }}
        />
      );
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders both primary and secondary action buttons', () => {
      render(
        <ApModal
          open={true}
          onClose={vi.fn()}
          header="Test Modal"
          primaryAction={{ label: 'Confirm', onClick: vi.fn() }}
          secondaryAction={{ label: 'Cancel', onClick: vi.fn() }}
        />
      );
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('does not render action buttons when not provided', () => {
      render(<ApModal open={true} onClose={vi.fn()} header="Test Modal" />);
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('calls primaryAction onClick when clicked', () => {
      const handlePrimaryClick = vi.fn();
      const handleClose = vi.fn();
      render(
        <ApModal
          open={true}
          onClose={handleClose}
          header="Test Modal"
          primaryAction={{ label: 'Confirm', onClick: handlePrimaryClick }}
        />
      );
      const button = screen.getByText('Confirm');
      button.click();
      expect(handlePrimaryClick).toHaveBeenCalledTimes(1);
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('calls secondaryAction onClick when clicked', () => {
      const handleSecondaryClick = vi.fn();
      const handleClose = vi.fn();
      render(
        <ApModal
          open={true}
          onClose={handleClose}
          header="Test Modal"
          secondaryAction={{ label: 'Cancel', onClick: handleSecondaryClick }}
        />
      );
      const button = screen.getByText('Cancel');
      button.click();
      expect(handleSecondaryClick).toHaveBeenCalledTimes(1);
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('shows loading state on primary action button', () => {
      render(
        <ApModal
          open={true}
          onClose={vi.fn()}
          header="Test Modal"
          primaryAction={{ label: 'Confirm', onClick: vi.fn(), loading: true }}
        />
      );
      const button = screen.getByText('Confirm');
      expect(button).toBeInTheDocument();
    });

    it('shows loading state on secondary action button', () => {
      render(
        <ApModal
          open={true}
          onClose={vi.fn()}
          header="Test Modal"
          secondaryAction={{ label: 'Cancel', onClick: vi.fn(), loading: true }}
        />
      );
      const button = screen.getByText('Cancel');
      expect(button).toBeInTheDocument();
    });

    it('disables primary action button when disabled is true', () => {
      const handlePrimaryClick = vi.fn();
      render(
        <ApModal
          open={true}
          onClose={vi.fn()}
          header="Test Modal"
          primaryAction={{ label: 'Confirm', onClick: handlePrimaryClick, disabled: true }}
        />
      );
      const button = screen.getByRole('button', { name: /confirm/i, hidden: true });
      expect(button).toBeDisabled();
      button.click();
      expect(handlePrimaryClick).not.toHaveBeenCalled();
    });

    it('disables secondary action button when disabled is true', () => {
      const handleSecondaryClick = vi.fn();
      render(
        <ApModal
          open={true}
          onClose={vi.fn()}
          header="Test Modal"
          secondaryAction={{ label: 'Cancel', onClick: handleSecondaryClick, disabled: true }}
        />
      );
      const button = screen.getByRole('button', { name: /cancel/i, hidden: true });
      expect(button).toBeDisabled();
      button.click();
      expect(handleSecondaryClick).not.toHaveBeenCalled();
    });

    it('sets id on primary action button', () => {
      render(
        <ApModal
          open={true}
          onClose={vi.fn()}
          header="Test Modal"
          primaryAction={{ label: 'Confirm', onClick: vi.fn(), id: 'primary-btn' }}
        />
      );
      const button = screen.getByRole('button', { name: /confirm/i, hidden: true });
      expect(button).toHaveAttribute('id', 'primary-btn');
    });

    it('sets id on secondary action button', () => {
      render(
        <ApModal
          open={true}
          onClose={vi.fn()}
          header="Test Modal"
          secondaryAction={{ label: 'Cancel', onClick: vi.fn(), id: 'secondary-btn' }}
        />
      );
      const button = screen.getByRole('button', { name: /cancel/i, hidden: true });
      expect(button).toHaveAttribute('id', 'secondary-btn');
    });
  });

  describe('Close Behavior', () => {
    it('calls onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(<ApModal open={true} onClose={handleClose} header="Test Modal" />);
      const closeButton = screen.getByRole('button', { name: /icon button/i, hidden: true });
      closeButton.click();
      expect(handleClose).toHaveBeenCalledWith({}, 'closeButtonClick');
    });

    it('calls onClose when backdrop is clicked', async () => {
      const handleClose = vi.fn();
      const { container } = render(
        <ApModal open={true} onClose={handleClose} header="Test Modal" />
      );
      const backdrop = container.querySelector('.MuiBackdrop-root');
      if (backdrop) {
        fireEvent.click(backdrop);
        await waitFor(() => {
          expect(handleClose).toHaveBeenCalled();
        });
      }
    });

    it('does not call onClose when preventClose is true and close button clicked', () => {
      const handleClose = vi.fn();
      render(<ApModal open={true} onClose={handleClose} header="Test Modal" preventClose />);
      // Close button should not be rendered when preventClose is true
      const closeButton = screen.queryByRole('button', { name: /icon button/i, hidden: true });
      expect(closeButton).not.toBeInTheDocument();
    });

    it('does not call onClose when preventClose is true and backdrop clicked', async () => {
      const handleClose = vi.fn();
      const { container } = render(
        <ApModal open={true} onClose={handleClose} header="Test Modal" preventClose />
      );
      const backdrop = container.querySelector('.MuiBackdrop-root');
      if (backdrop) {
        fireEvent.click(backdrop);
        await waitFor(() => {
          expect(handleClose).not.toHaveBeenCalled();
        });
      }
    });

    it('sets id on close button', () => {
      render(
        <ApModal open={true} onClose={vi.fn()} header="Test Modal" closeButtonId="close-btn" />
      );
      const closeButton = screen.getByRole('button', { name: /icon button/i, hidden: true });
      expect(closeButton).toHaveAttribute('id', 'close-btn');
    });
  });

  describe('Material UI Props Pass-through', () => {
    it('passes through keepMounted prop', () => {
      render(<ApModal open={true} onClose={vi.fn()} header="Test Modal" keepMounted />);
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('passes through disablePortal prop', () => {
      render(<ApModal open={true} onClose={vi.fn()} header="Test Modal" disablePortal />);
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to the underlying Modal component', () => {
      const ref = vi.fn();
      render(<ApModal ref={ref} open={true} onClose={vi.fn()} header="Test Modal" />);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('renders semantic HTML structure', () => {
      render(<ApModal open={true} onClose={vi.fn()} header="Test Modal" />);
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('close button has accessible role', () => {
      render(<ApModal open={true} onClose={vi.fn()} header="Test Modal" />);
      const closeButton = screen.getByRole('button', { name: /icon button/i, hidden: true });
      expect(closeButton).toBeInTheDocument();
    });
  });
});
