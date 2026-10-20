import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

describe('Popover', () => {
  const PopoverExample = () => (
    <Popover>
      <PopoverTrigger>Open Popover</PopoverTrigger>
      <PopoverContent>Popover content goes here</PopoverContent>
    </Popover>
  );

  it('renders trigger without crashing', () => {
    render(<PopoverExample />);
    expect(screen.getByRole('button', { name: 'Open Popover' })).toBeInTheDocument();
  });

  it('has no accessibility violations when closed', async () => {
    const { container } = render(<PopoverExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations when open', async () => {
    const user = userEvent.setup();
    const { container } = render(<PopoverExample />);

    const trigger = screen.getByRole('button', { name: 'Open Popover' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Popover content goes here')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('opens popover when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<PopoverExample />);

    const trigger = screen.getByRole('button', { name: 'Open Popover' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Popover content goes here')).toBeInTheDocument();
    });
  });

  it('closes popover when trigger is clicked again', async () => {
    const user = userEvent.setup();
    render(<PopoverExample />);

    const trigger = screen.getByRole('button', { name: 'Open Popover' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Popover content goes here')).toBeInTheDocument();
    });

    await user.click(trigger);

    await waitFor(() => {
      expect(screen.queryByText('Popover content goes here')).not.toBeInTheDocument();
    });
  });

  it('closes popover with Escape key', async () => {
    const user = userEvent.setup();
    render(<PopoverExample />);

    const trigger = screen.getByRole('button', { name: 'Open Popover' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Popover content goes here')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText('Popover content goes here')).not.toBeInTheDocument();
    });
  });

  it('applies custom className to content', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent className="custom-popover">Custom Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);

    await waitFor(() => {
      const content = screen.getByText('Custom Content');
      expect(content).toHaveClass('custom-popover');
    });
  });

  it('supports controlled mode', async () => {
    const { rerender } = render(
      <Popover open={false}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    expect(screen.queryByText('Content')).not.toBeInTheDocument();

    rerender(
      <Popover open={true}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  it('supports align prop', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent align="start">Aligned content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Aligned content')).toBeInTheDocument();
    });
  });

  it('supports sideOffset prop', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent sideOffset={10}>Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  it('forwards ref correctly to content', () => {
    const ref = { current: null };
    render(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent ref={ref}>Content</PopoverContent>
      </Popover>
    );
    waitFor(() => {
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  it('supports side prop', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent side="top">Top content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole('button', { name: 'Open' });
    await act(async () => {
      await user.click(trigger);
    });

    await waitFor(() => {
      expect(screen.getByText('Top content')).toBeInTheDocument();
    });
  });

  it('closes on outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <PopoverExample />
      </div>
    );

    const trigger = screen.getByRole('button', { name: 'Open Popover' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Popover content goes here')).toBeInTheDocument();
    });

    const outside = screen.getByTestId('outside');
    await user.click(outside);

    await waitFor(() => {
      expect(screen.queryByText('Popover content goes here')).not.toBeInTheDocument();
    });
  });

  describe('inside a shadow root', () => {
    // A host such as Agents renders wind into a shadow root, and the popup portals there too.
    const renderInShadowRoot = () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const mount = document.createElement('div');
      host.attachShadow({ mode: 'open' }).appendChild(mount);
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <Popover>
            <PopoverTrigger>Open Popover</PopoverTrigger>
            <PopoverContent container={mount}>Popover content goes here</PopoverContent>
          </Popover>
        </div>,
        { container: mount }
      );
      return { host, view: within(mount) };
    };

    it('closes when its trigger is clicked again', async () => {
      const user = userEvent.setup();
      const { host, view } = renderInShadowRoot();

      const trigger = view.getByRole('button', { name: 'Open Popover' });
      await user.click(trigger);
      await waitFor(() => {
        expect(view.getByText('Popover content goes here')).toBeInTheDocument();
      });

      await user.click(trigger);
      await waitFor(() => {
        expect(view.queryByText('Popover content goes here')).not.toBeInTheDocument();
      });
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      host.remove();
    });

    it('still closes on a click elsewhere in the shadow root', async () => {
      const user = userEvent.setup();
      const { host, view } = renderInShadowRoot();

      await user.click(view.getByRole('button', { name: 'Open Popover' }));
      await waitFor(() => {
        expect(view.getByText('Popover content goes here')).toBeInTheDocument();
      });

      await user.click(view.getByTestId('outside'));
      await waitFor(() => {
        expect(view.queryByText('Popover content goes here')).not.toBeInTheDocument();
      });
      host.remove();
    });
  });

  it("leaves Radix's own trigger handling alone outside a shadow root", async () => {
    // Radix recognizes the trigger there by itself, and closing from it leaves focus where the
    // press put it. Taking that press over would also make Radix move focus to the trigger.
    const user = userEvent.setup();
    render(<PopoverExample />);

    const trigger = screen.getByRole('button', { name: 'Open Popover' });
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByText('Popover content goes here')).toBeInTheDocument();
    });
    // Radix attaches its outside-press listener a tick after the popup mounts.
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    const focus = vi.spyOn(trigger, 'focus');

    // Plain events rather than userEvent, which focuses the trigger itself on press.
    fireEvent.pointerDown(trigger);
    fireEvent.mouseDown(trigger);
    fireEvent.pointerUp(trigger);
    fireEvent.mouseUp(trigger);
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.queryByText('Popover content goes here')).not.toBeInTheDocument();
    });
    expect(focus).not.toHaveBeenCalled();
  });

  it('supports asChild on trigger', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Custom trigger</button>
        </PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByRole('button', { name: 'Custom trigger' });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});
