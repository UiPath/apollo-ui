import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { Popover, PopoverContent, PopoverTrigger } from '../../src/components/ui/popover';

describe('Popover', () => {
  it('renders popover trigger', () => {
    render(
      <Popover>
        <PopoverTrigger>Open Popover</PopoverTrigger>
      </Popover>
    );
    expect(screen.getByText('Open Popover')).toBeInTheDocument();
  });

  it('opens popover when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Popover content</PopoverContent>
      </Popover>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });
  });

  it('closes popover when trigger is clicked again', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Toggle</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByText('Toggle');

    // Open
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    // Close
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });
  });

  it('closes popover when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Press Escape</PopoverContent>
      </Popover>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByText('Press Escape')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText('Press Escape')).not.toBeInTheDocument();
    });
  });

  it('closes popover when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Click outside to close</PopoverContent>
        </Popover>
        <button>Outside button</button>
      </div>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByText('Click outside to close')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Outside button'));

    await waitFor(() => {
      expect(screen.queryByText('Click outside to close')).not.toBeInTheDocument();
    });
  });

  it('can be controlled via open prop', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Popover open={false} onOpenChange={onOpenChange}>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Controlled popover</PopoverContent>
      </Popover>
    );

    expect(screen.queryByText('Controlled popover')).not.toBeInTheDocument();

    rerender(
      <Popover open={true} onOpenChange={onOpenChange}>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Controlled popover</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      expect(screen.getByText('Controlled popover')).toBeInTheDocument();
    });
  });

  it('renders custom content', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>
          <div data-testid="custom-content">
            <h3>Custom Title</h3>
            <p>Custom paragraph</p>
            <button>Custom button</button>
          </div>
        </PopoverContent>
      </Popover>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom paragraph')).toBeInTheDocument();
      expect(screen.getByText('Custom button')).toBeInTheDocument();
    });
  });

  it('accepts custom className', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent className="custom-popover">Custom styled</PopoverContent>
      </Popover>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      const content = screen.getByText('Custom styled');
      expect(content).toHaveClass('custom-popover');
    });
  });

  it('accepts align prop', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent align="start">Aligned start</PopoverContent>
      </Popover>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByText('Aligned start')).toBeInTheDocument();
    });
  });

  it('accepts sideOffset prop', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent sideOffset={10}>Offset content</PopoverContent>
      </Popover>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByText('Offset content')).toBeInTheDocument();
    });
  });

  it('works with asChild prop on trigger', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button>Custom trigger button</button>
        </PopoverTrigger>
        <PopoverContent>Content for custom trigger</PopoverContent>
      </Popover>
    );

    await user.click(screen.getByRole('button', { name: 'Custom trigger button' }));

    await waitFor(() => {
      expect(screen.getByText('Content for custom trigger')).toBeInTheDocument();
    });
  });

  it('contains interactive elements within popover content', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>
          <button>Button 1</button>
          <button>Button 2</button>
        </PopoverContent>
      </Popover>
    );

    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Button 2')).toBeInTheDocument();
    });
  });

  it('handles multiple popovers independently', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Popover>
          <PopoverTrigger>First Popover</PopoverTrigger>
          <PopoverContent>First content</PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger>Second Popover</PopoverTrigger>
          <PopoverContent>Second content</PopoverContent>
        </Popover>
      </div>
    );

    // Open first popover
    await user.click(screen.getByText('First Popover'));
    await waitFor(() => {
      expect(screen.getByText('First content')).toBeInTheDocument();
    });

    // Open second popover (should close first)
    await user.click(screen.getByText('Second Popover'));
    await waitFor(() => {
      expect(screen.queryByText('First content')).not.toBeInTheDocument();
      expect(screen.getByText('Second content')).toBeInTheDocument();
    });
  });

  it('renders interactive elements inside popover', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>
          <button onClick={onClick}>Click me</button>
        </PopoverContent>
      </Popover>
    );

    await user.click(screen.getByText('Open'));
    await waitFor(() => screen.getByText('Click me'));

    await user.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalled();
  });
});
