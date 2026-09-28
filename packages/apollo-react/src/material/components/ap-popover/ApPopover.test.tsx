import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ApPopover } from './ApPopover';

describe('ApPopover', () => {
  it('renders the popover when open is true', () => {
    render(
      <ApPopover open={true} anchorEl={document.body}>
        <div>Popover Content</div>
      </ApPopover>
    );

    expect(screen.getByText('Popover Content')).toBeInTheDocument();
  });

  it('does not render the popover when open is false', () => {
    render(
      <ApPopover open={false} anchorEl={document.body}>
        <div>Popover Content</div>
      </ApPopover>
    );

    expect(screen.queryByText('Popover Content')).not.toBeInTheDocument();
  });

  it('calls onClose when clicking outside the popover', async () => {
    const TestComponent = () => {
      const [anchorEl, setAnchorEl] = useState<null | HTMLButtonElement>(null);

      const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
      };
      const handleClose = () => {
        setAnchorEl(null);
      };

      const open = Boolean(anchorEl);

      return (
        <div>
          <button data-testid="anchor-button" onClick={handleClick}>
            Open Popover
          </button>
          <ApPopover open={open} anchorEl={anchorEl} onClose={handleClose}>
            <div>Popover Content</div>
          </ApPopover>
        </div>
      );
    };

    render(<TestComponent />);

    const anchorButton = screen.getByTestId('anchor-button');
    // Initially , the popover should not be in the document
    expect(screen.queryByText('Popover Content')).not.toBeInTheDocument();
    // Click the button to open the popover
    await userEvent.click(anchorButton);
    // Now the popover should be in the document
    expect(screen.getByText('Popover Content')).toBeInTheDocument();
    // Click the backdrop to close the popover
    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    await waitFor(() => {
      expect(screen.queryByText('Popover Content')).not.toBeInTheDocument();
    });
  });

  it('Opens and closes the popover based on click events', async () => {
    const TestComponent = () => {
      const [anchorEl, setAnchorEl] = useState<null | HTMLButtonElement>(null);

      const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
      };
      const handleClose = () => {
        setAnchorEl(null);
      };

      const open = Boolean(anchorEl);

      return (
        <div>
          <button data-testid="anchor-button" onClick={handleClick}>
            Open Popover
          </button>
          <ApPopover open={open} anchorEl={anchorEl} onClose={handleClose}>
            <div>Popover Content</div>
          </ApPopover>
        </div>
      );
    };

    render(<TestComponent />);
    const anchorButton = screen.getByTestId('anchor-button');

    // Initially, the popover should not be in the document
    expect(screen.queryByText('Popover Content')).not.toBeInTheDocument();
    // Click the button to open the popover
    await userEvent.click(anchorButton);
    // Now the popover should be in the document
    expect(screen.getByText('Popover Content')).toBeInTheDocument();
    // Click the backdrop to close the popover
    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    // The popover should no longer be in the document
    await waitFor(() => {
      expect(screen.queryByText('Popover Content')).not.toBeInTheDocument();
    });
  });

  it('Opens and closes popover based on keyboard events', async () => {
    const TestComponent = () => {
      const [anchorEl, setAnchorEl] = useState<null | HTMLButtonElement>(null);

      const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
      };
      const handleClose = () => {
        setAnchorEl(null);
      };

      const open = Boolean(anchorEl);

      return (
        <div>
          <button data-testid="anchor-button" onClick={handleClick}>
            Open Popover
          </button>
          <ApPopover open={open} anchorEl={anchorEl} onClose={handleClose}>
            <div>Popover Content</div>
          </ApPopover>
        </div>
      );
    };

    render(<TestComponent />);
    const anchorButton = screen.getByTestId('anchor-button');

    // Initially, the popover should not be in the document
    expect(screen.queryByText('Popover Content')).not.toBeInTheDocument();
    // Focus and press Enter to open the popover
    anchorButton.focus();
    await userEvent.keyboard('{Enter}');
    // Now the popover should be in the document
    expect(screen.getByText('Popover Content')).toBeInTheDocument();
    // Press Escape to close the popover
    await userEvent.keyboard('{Escape}');
    // The popover should no longer be in the document
    await waitFor(() => {
      expect(screen.queryByText('Popover Content')).not.toBeInTheDocument();
    });
  });

  it('applies custom styles via sx prop', () => {
    render(
      <ApPopover
        open={true}
        anchorEl={document.body}
        sx={{ '& .MuiPaper-root': { backgroundColor: 'red' } }}
      >
        <div>Styled Popover Content</div>
      </ApPopover>
    );

    const popoverPaper = document.querySelector('.MuiPaper-root') as HTMLElement;
    expect(popoverPaper).toHaveStyle('background-color: red');
  });
});
