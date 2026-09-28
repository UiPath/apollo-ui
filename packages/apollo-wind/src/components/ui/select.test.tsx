import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { InputGroup } from './input-group';
import { PortalContainerProvider } from './portal-container';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './select';

describe('Select', () => {
  const SelectExample = ({
    onValueChange = vi.fn(),
  }: {
    onValueChange?: (value: string) => void;
  }) => (
    <Select onValueChange={onValueChange}>
      <SelectTrigger aria-label="Select a fruit">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );

  it('renders without crashing', () => {
    render(<SelectExample />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<SelectExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('displays placeholder text', () => {
    render(<SelectExample />);
    expect(screen.getByText('Select a fruit')).toBeInTheDocument();
  });

  it('opens dropdown when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<SelectExample />);

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    });
  });

  it('selects an item when clicked', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    render(<SelectExample onValueChange={handleValueChange} />);

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('option', { name: 'Apple' }));

    expect(handleValueChange).toHaveBeenCalledWith('apple');
  });

  it('supports keyboard navigation with Arrow Down', async () => {
    const user = userEvent.setup();
    render(<SelectExample />);

    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await user.keyboard('{ArrowDown}');

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation with Arrow Up', async () => {
    const user = userEvent.setup();
    render(<SelectExample />);

    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await user.keyboard('{ArrowUp}');

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation with Space', async () => {
    const user = userEvent.setup();
    render(<SelectExample />);

    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await user.keyboard(' ');

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation with Enter', async () => {
    const user = userEvent.setup();
    render(<SelectExample />);

    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    });
  });

  it('closes dropdown with Escape key', async () => {
    const user = userEvent.setup();
    render(<SelectExample />);

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument();
    });
  });

  it('can be disabled', () => {
    render(
      <Select disabled>
        <SelectTrigger aria-label="Select">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="item">Item</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('supports controlled mode', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    const { rerender } = render(
      <Select value="apple" onValueChange={handleValueChange}>
        <SelectTrigger aria-label="Select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByText('Apple')).toBeInTheDocument();

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(handleValueChange).toHaveBeenCalledWith('banana');

    rerender(
      <Select value="banana" onValueChange={handleValueChange}>
        <SelectTrigger aria-label="Select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  it('renders SelectLabel correctly', async () => {
    const user = userEvent.setup();
    render(<SelectExample />);

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Fruits')).toBeInTheDocument();
    });
  });

  it('supports disabled items', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    render(
      <Select onValueChange={handleValueChange}>
        <SelectTrigger aria-label="Select">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="enabled">Enabled</SelectItem>
          <SelectItem value="disabled" disabled>
            Disabled
          </SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    await waitFor(() => {
      const disabledOption = screen.getByRole('option', { name: 'Disabled' });
      expect(disabledOption).toHaveAttribute('data-disabled', '');
    });
  });

  it('applies custom className to trigger', () => {
    render(
      <Select>
        <SelectTrigger className="custom-class" aria-label="Select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="item">Item</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass('custom-class');
  });

  it('has proper ARIA attributes', () => {
    render(<SelectExample />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-label', 'Select a fruit');
  });

  describe('portal container', () => {
    const OpenSelect = ({ container }: { container?: HTMLElement }) => (
      <Select open>
        <SelectTrigger aria-label="Fruit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent container={container}>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>
    );

    it('portals into the PortalContainerProvider boundary', async () => {
      render(
        <div data-testid="host">
          <PortalContainerProvider>
            <OpenSelect />
          </PortalContainerProvider>
        </div>
      );

      await waitFor(() => {
        const option = screen.getByRole('option', { name: 'Apple' });
        expect(screen.getByTestId('host').contains(option)).toBe(true);
      });
    });

    it('routes its portal through an explicit container prop', async () => {
      const Harness = () => {
        const [target, setTarget] = React.useState<HTMLElement | null>(null);
        return (
          <>
            <div data-testid="custom" ref={setTarget} />
            {target && <OpenSelect container={target} />}
          </>
        );
      };
      render(<Harness />);

      await waitFor(() => {
        const option = screen.getByRole('option', { name: 'Apple' });
        expect(screen.getByTestId('custom').contains(option)).toBe(true);
      });
    });
  });

  // SelectTrigger is not Button-based: Radix's data-placeholder already mutes the
  // empty state in every theme. A future:text-foreground here would outrank it.
  describe('value vs placeholder color', () => {
    it('mutes the empty state through data-placeholder, not a blanket class', () => {
      render(<SelectExample />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('data-placeholder');
      expect(trigger).toHaveClass('data-[placeholder]:text-muted-foreground');
      expect(trigger).not.toHaveClass('future:text-muted-foreground');
      expect(trigger).not.toHaveClass('future:text-foreground');
    });

    it('drops data-placeholder once a value is selected', async () => {
      const user = userEvent.setup();
      render(<SelectExample />);
      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      await user.click(await screen.findByRole('option', { name: 'Apple' }));
      await waitFor(() => expect(trigger).not.toHaveAttribute('data-placeholder'));
    });
  });
});

describe('SelectTrigger inline validation', () => {
  it('renders the message and wires aria attributes to it', () => {
    render(
      <Select>
        <SelectTrigger id="connection" error="Select a connection.">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    );
    const trigger = screen.getByRole('combobox');
    const message = screen.getByText('Select a connection.');

    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('aria-describedby', 'connection-error');
    expect(trigger).toHaveAttribute('aria-errormessage', 'connection-error');
    expect(message).toHaveAttribute('id', 'connection-error');
    expect(message).toHaveClass('text-error');
  });

  it('renders no message without an error', () => {
    render(
      <Select>
        <SelectTrigger id="connection">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid');
    expect(document.getElementById('connection-error')).toBeNull();
  });
});
describe('SelectTrigger remount safety', () => {
  it('keeps the same trigger node and focus when an error appears', () => {
    const { rerender } = render(
      <Select>
        <SelectTrigger id="connection">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    );
    const before = screen.getByRole('combobox');
    before.focus();
    expect(before).toHaveFocus();

    rerender(
      <Select>
        <SelectTrigger id="connection" error="Select a connection.">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    );
    const after = screen.getByRole('combobox');

    expect(after).toBe(before);
    expect(after).toHaveFocus();
  });

  describe('trigger in an input group', () => {
    const renderTrigger = (grouped?: boolean) => {
      const select = (
        <Select>
          <SelectTrigger aria-label="Select">
            <SelectValue placeholder="Pick one" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="item">Item</SelectItem>
          </SelectContent>
        </Select>
      );
      return render(grouped ? <InputGroup>{select}</InputGroup> : select);
    };

    it('drops its own box, including the future-theme one', () => {
      renderTrigger(true);
      const trigger = screen.getByRole('combobox');
      for (const cls of [
        'h-9',
        'border',
        'rounded-md',
        'px-3',
        'future:h-10',
        'future:bg-surface-overlay',
        'future:rounded-xl',
        'future:px-4',
      ]) {
        expect(trigger).not.toHaveClass(cls);
      }
      expect(trigger).toHaveClass('w-full', 'bg-transparent', 'p-0');
      // The group's focus, hover and disabled rules find its control by this slot.
      expect(trigger).toHaveAttribute('data-slot', 'input-group-control');
      // The group's flex item, so it takes the row's free width and can shrink to truncate.
      expect(trigger).toHaveClass('min-w-0', 'flex-1');
    });

    it('draws no focus ring of its own, leaving that to the group', () => {
      renderTrigger(true);
      const trigger = screen.getByRole('combobox');
      expect(trigger.className).not.toMatch(/(^|\s)focus(-visible)?:ring-2/);
      expect(trigger).toHaveClass('focus-visible:outline-none');
    });

    it('keeps its placeholder colour and layout', () => {
      renderTrigger(true);
      expect(screen.getByRole('combobox')).toHaveClass(
        'data-[placeholder]:text-muted-foreground',
        'justify-between'
      );
    });

    it('keeps its own box outside a group', () => {
      renderTrigger();
      expect(screen.getByRole('combobox')).toHaveClass('h-9', 'border', 'future:h-10');
      expect(screen.getByRole('combobox')).toHaveAttribute('data-slot', 'select-trigger');
    });
  });

  describe('inside an input group', () => {
    const rect = (left: number, top: number, width: number, height: number) =>
      ({
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;

    it('sizes and offsets the panel to the group box, not the trigger', async () => {
      const user = userEvent.setup();
      render(
        <InputGroup data-testid="box">
          <Select>
            <SelectTrigger aria-label="Priority">
              <SelectValue placeholder="Pick one" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </InputGroup>
      );

      // The box is 12px wider on the left and 5px taller below than the inset trigger.
      vi.spyOn(screen.getByTestId('box'), 'getBoundingClientRect').mockReturnValue(
        rect(0, 0, 300, 36)
      );
      vi.spyOn(screen.getByRole('combobox'), 'getBoundingClientRect').mockReturnValue(
        rect(12, 5, 250, 26)
      );

      await user.click(screen.getByRole('combobox'));
      const listbox = await screen.findByRole('listbox');
      expect(listbox).toHaveStyle({ width: '300px' });
    });

    it('leaves the panel on the trigger outside a group', async () => {
      const user = userEvent.setup();
      render(
        <Select>
          <SelectTrigger aria-label="Priority">
            <SelectValue placeholder="Pick one" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      );

      await user.click(screen.getByRole('combobox'));
      const listbox = await screen.findByRole('listbox');
      expect(listbox.style.width).toBe('');
    });
  });
});
