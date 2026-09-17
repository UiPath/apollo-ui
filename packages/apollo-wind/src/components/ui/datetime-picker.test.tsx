import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DateTimePicker } from './datetime-picker';

function getTimeInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[type="time"]');
  if (!input) {
    throw new Error('Time input not found');
  }
  return input;
}

describe('DateTimePicker', () => {
  describe('rendering', () => {
    it('renders the default placeholder', () => {
      render(<DateTimePicker />);
      expect(screen.getByText('Pick a date and time')).toBeInTheDocument();
    });

    it('renders a custom placeholder', () => {
      render(<DateTimePicker placeholder="Choose when" />);
      expect(screen.getByText('Choose when')).toBeInTheDocument();
    });

    it('renders a formatted value when one is provided', () => {
      render(<DateTimePicker value={new Date(2024, 5, 15, 14, 30)} />);
      expect(screen.getByText(/June 15th, 2024 at 14:30/)).toBeInTheDocument();
    });

    it('formats the time in 12-hour style when use12Hour is set', () => {
      render(<DateTimePicker value={new Date(2024, 5, 15, 14, 30)} use12Hour />);
      expect(screen.getByText(/June 15th, 2024 at 02:30 PM/)).toBeInTheDocument();
    });

    it('renders disabled state', () => {
      render(<DateTimePicker disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('merges custom className on the trigger', () => {
      render(<DateTimePicker className="custom-picker" />);
      expect(screen.getByRole('button')).toHaveClass('custom-picker');
    });
  });

  describe('ref forwarding', () => {
    it('forwards its ref to the trigger button', () => {
      const ref = createRef<HTMLButtonElement>();
      render(<DateTimePicker ref={ref} />);
      expect(ref.current).toBe(screen.getByRole('button'));
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations when closed', async () => {
      const { container } = render(<DateTimePicker />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('interactions', () => {
    it('opens the popover with a calendar on click', async () => {
      const user = userEvent.setup();
      render(<DateTimePicker />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });
      expect(screen.getByText('Time')).toBeInTheDocument();
    });

    it('calls onValueChange when a date is selected', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<DateTimePicker onValueChange={handleChange} />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /15/ }));

      expect(handleChange).toHaveBeenCalledTimes(1);
      const selected = handleChange.mock.calls[0][0] as Date;
      expect(selected.getDate()).toBe(15);
    });

    it('updates the value when a time is typed after picking a date', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<DateTimePicker onValueChange={handleChange} />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /15/ }));
      fireEvent.change(getTimeInput(), { target: { value: '13:45' } });

      const lastCall = handleChange.mock.calls.at(-1)?.[0] as Date;
      expect(lastCall.getDate()).toBe(15);
      expect(lastCall.getHours()).toBe(13);
      expect(lastCall.getMinutes()).toBe(45);
    });

    it('resets the value and closes when Clear is clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<DateTimePicker value={new Date(2024, 5, 15, 9, 0)} onValueChange={handleChange} />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Clear' }));

      expect(handleChange).toHaveBeenCalledWith(undefined);
      await waitFor(() => {
        expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Pick a date and time')).toBeInTheDocument();
    });

    it('closes the popover when Done is clicked', async () => {
      const user = userEvent.setup();
      render(<DateTimePicker value={new Date(2024, 5, 15, 9, 0)} />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Done' }));

      await waitFor(() => {
        expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      });
    });

    it('disables Done until a date is selected', async () => {
      const user = userEvent.setup();
      render(<DateTimePicker />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled();
    });
  });

  describe('value vs placeholder color', () => {
    it('mutes the placeholder via its own span', () => {
      render(<DateTimePicker placeholder="Pick a date and time" />);
      const placeholder = screen.getByText('Pick a date and time');
      expect(placeholder.tagName).toBe('SPAN');
      expect(placeholder).toHaveClass('text-foreground-muted');
    });

    it('renders a selected value at full strength', () => {
      const { container } = render(<DateTimePicker value={new Date(2024, 5, 15, 14, 30)} />);
      expect(screen.getByRole('button')).toHaveTextContent(/June 15/);
      expect(container.querySelector('.text-foreground-muted')).toBeNull();
    });

    it('overrides the outline variant so the trigger is not globally muted', () => {
      render(<DateTimePicker />);
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveClass('future:text-foreground');
      expect(trigger).not.toHaveClass('future:text-muted-foreground');
    });
  });

  describe('trigger icon color', () => {
    it('mutes the icon and brightens it on hover', () => {
      render(<DateTimePicker />);
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveClass('[&>svg]:text-foreground-muted');
      expect(trigger).toHaveClass('hover:[&>svg]:text-accent-foreground');
    });

    // The [&>svg] selector only matches a direct child, so wrapping the icon
    // would silently drop both rules.
    it('keeps the icon a direct child of the trigger', () => {
      render(<DateTimePicker />);
      const trigger = screen.getByRole('button');
      expect(trigger.querySelector(':scope > svg')).not.toBeNull();
    });
  });
});
