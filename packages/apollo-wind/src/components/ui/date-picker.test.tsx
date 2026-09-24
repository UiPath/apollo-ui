import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { DatePicker, DateRangePicker } from './date-picker';

describe('DatePicker', () => {
  describe('rendering', () => {
    it('renders trigger button', () => {
      render(<DatePicker />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<DatePicker />);
      expect(screen.getByText('Pick a date')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<DatePicker placeholder="Select date" />);
      expect(screen.getByText('Select date')).toBeInTheDocument();
    });

    it('renders with selected date', () => {
      render(<DatePicker value={new Date(2024, 5, 15)} />);
      expect(screen.getByText(/June 15/)).toBeInTheDocument();
    });

    it('renders disabled state', () => {
      render(<DatePicker disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<DatePicker />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no violations with selected date', async () => {
      const { container } = render(<DatePicker value={new Date()} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('interactions', () => {
    it('opens calendar on click', async () => {
      const user = userEvent.setup();
      render(<DatePicker />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });
    });

    it('calls onValueChange when date is selected', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<DatePicker onValueChange={handleChange} />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Click on a day
      const dayButton = screen.getByRole('button', { name: /15/i });
      await user.click(dayButton);

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('custom className', () => {
    it('applies custom className to trigger', () => {
      render(<DatePicker className="custom-picker" />);
      expect(screen.getByRole('button')).toHaveClass('custom-picker');
    });
  });
});

describe('DateRangePicker', () => {
  describe('rendering', () => {
    it('renders trigger button', () => {
      render(<DateRangePicker />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<DateRangePicker />);
      expect(screen.getByText('Pick a date range')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<DateRangePicker placeholder="Select range" />);
      expect(screen.getByText('Select range')).toBeInTheDocument();
    });

    it('renders with selected range', () => {
      render(
        <DateRangePicker
          value={{
            from: new Date(2024, 5, 10),
            to: new Date(2024, 5, 15),
          }}
        />
      );
      expect(screen.getByText(/Jun 10, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jun 15, 2024/)).toBeInTheDocument();
    });

    it('renders with only from date', () => {
      render(
        <DateRangePicker
          value={{
            from: new Date(2024, 5, 10),
          }}
        />
      );
      expect(screen.getByText(/Jun 10, 2024/)).toBeInTheDocument();
    });

    it('renders disabled state', () => {
      render(<DateRangePicker disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<DateRangePicker />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('interactions', () => {
    it('opens calendar on click', async () => {
      const user = userEvent.setup();
      render(<DateRangePicker />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        // Range picker shows 2 months
        expect(screen.getAllByRole('grid')).toHaveLength(2);
      });
    });

    it('calls onValueChange when range is selected', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<DateRangePicker onValueChange={handleChange} />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getAllByRole('grid')).toHaveLength(2);
      });

      // Click on first day to start range
      const dayButtons = screen.getAllByRole('button', { name: /15/i });
      await user.click(dayButtons[0]);

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('custom className', () => {
    it('applies custom className to trigger', () => {
      render(<DateRangePicker className="custom-range-picker" />);
      expect(screen.getByRole('button')).toHaveClass('custom-range-picker');
    });
  });
});

describe('value vs placeholder color', () => {
  it('mutes the DatePicker placeholder via its own span', () => {
    render(<DatePicker placeholder="Pick a date" />);
    const placeholder = screen.getByText('Pick a date');
    expect(placeholder.tagName).toBe('SPAN');
    expect(placeholder).toHaveClass('text-foreground-muted');
  });

  it('mutes the DateRangePicker placeholder via its own span', () => {
    render(<DateRangePicker placeholder="Pick a date range" />);
    const placeholder = screen.getByText('Pick a date range');
    expect(placeholder.tagName).toBe('SPAN');
    expect(placeholder).toHaveClass('text-foreground-muted');
  });

  it('renders a selected date at full strength', () => {
    render(<DatePicker value={new Date(2024, 5, 15)} />);
    const trigger = screen.getByRole('button');
    expect(trigger).toHaveTextContent(/June 15/);
    expect(trigger.querySelector('.text-foreground-muted')).toBeNull();
  });

  // A range with only `from` set still renders a value, so the trigger must not
  // fall back to the placeholder colour.
  it('renders a partial range at full strength', () => {
    render(<DateRangePicker value={{ from: new Date(2024, 5, 15), to: undefined }} />);
    const trigger = screen.getByRole('button');
    expect(trigger).toHaveTextContent(/Jun 15/);
    expect(trigger.querySelector('.text-foreground-muted')).toBeNull();
  });

  // The outline Button variant mutes its own text in Future themes, so each
  // trigger has to override it rather than rely on removing the class.
  it.each([
    ['DatePicker', <DatePicker key="d" />],
    ['DateRangePicker', <DateRangePicker key="r" />],
  ])('overrides the outline variant on %s', (_name, element) => {
    render(element);
    const trigger = screen.getByRole('button');
    expect(trigger).toHaveClass('future:text-foreground');
    expect(trigger).not.toHaveClass('future:text-muted-foreground');
  });
});

describe('trigger icon color', () => {
  it.each([
    ['DatePicker', <DatePicker key="d" />],
    ['DateRangePicker', <DateRangePicker key="r" />],
  ])('mutes the %s icon and brightens it on hover', (_name, element) => {
    render(element);
    const trigger = screen.getByRole('button');
    expect(trigger).toHaveClass('[&>svg]:text-foreground-muted');
    expect(trigger).toHaveClass('hover:[&>svg]:text-accent-foreground');
  });

  // The [&>svg] selector only matches a direct child, so wrapping the icon
  // would silently drop both rules.
  it.each([
    ['DatePicker', <DatePicker key="d" />],
    ['DateRangePicker', <DateRangePicker key="r" />],
  ])('keeps the %s icon a direct child of the trigger', (_name, element) => {
    render(element);
    const trigger = screen.getByRole('button');
    expect(trigger.querySelector(':scope > svg')).not.toBeNull();
  });
});

describe('DatePicker inline validation', () => {
  it('renders the message and wires aria attributes to it', () => {
    render(<DatePicker id="due" error="Select a due date." />);
    const trigger = screen.getByRole('button');
    const message = screen.getByText('Select a due date.');

    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('aria-describedby', 'due-error');
    expect(trigger).toHaveAttribute('aria-errormessage', 'due-error');
    expect(message).toHaveAttribute('id', 'due-error');
    expect(message).toHaveClass('text-error');
  });

  it('lets a label name the trigger when an id is provided', () => {
    render(
      <>
        <label htmlFor="due">Due date</label>
        <DatePicker id="due" />
      </>
    );
    expect(screen.getByRole('button', { name: 'Due date' })).toBeInTheDocument();
  });

  it('keeps the computed aria-label when nothing else names it', () => {
    render(<DatePicker placeholder="Pick a date" />);
    expect(screen.getByRole('button', { name: 'Pick a date' })).toBeInTheDocument();
  });
});

describe('DateRangePicker inline validation', () => {
  it('renders the message and wires aria attributes to it', () => {
    render(<DateRangePicker id="window" error="Select a date range." />);
    const trigger = screen.getByRole('button');
    const message = screen.getByText('Select a date range.');

    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('aria-describedby', 'window-error');
    expect(trigger).toHaveAttribute('aria-errormessage', 'window-error');
    expect(message).toHaveAttribute('id', 'window-error');
  });
});
describe('DatePicker remount safety', () => {
  it('keeps the same trigger node and focus when an error appears', () => {
    const { rerender } = render(<DatePicker id="due" />);
    const before = screen.getByRole('button');
    before.focus();
    expect(before).toHaveFocus();

    rerender(<DatePicker id="due" error="Select a due date." />);
    const after = screen.getByRole('button');

    expect(after).toBe(before);
    expect(after).toHaveFocus();
  });
});

describe('DateRangePicker remount safety', () => {
  it('keeps the same trigger node and focus when an error appears', () => {
    const { rerender } = render(<DateRangePicker id="window" />);
    const before = screen.getByRole('button');
    before.focus();
    expect(before).toHaveFocus();

    rerender(<DateRangePicker id="window" error="Select a date range." />);
    const after = screen.getByRole('button');

    expect(after).toBe(before);
    expect(after).toHaveFocus();
  });
});

describe('DatePicker popover', () => {
  it('opens on the selected month with the drilldown caption', async () => {
    const user = userEvent.setup();
    render(<DatePicker value={new Date(2024, 2, 10)} />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button', { name: /March, choose month/ })).toBeInTheDocument();
  });

  it('closes after a date is picked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DatePicker
        onValueChange={onValueChange}
        calendarProps={{ defaultMonth: new Date(2024, 5, 1) }}
      />
    );

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('15'));

    expect(onValueChange).toHaveBeenCalledWith(new Date(2024, 5, 15));
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('lets calendarProps switch back to the label caption', async () => {
    const user = userEvent.setup();
    render(<DatePicker calendarProps={{ captionLayout: 'label' }} />);

    await user.click(screen.getByRole('button'));
    expect(screen.queryByRole('button', { name: /choose month/ })).not.toBeInTheDocument();
  });

  it('forwards popoverProps to the popover', async () => {
    const user = userEvent.setup();
    render(<DatePicker popoverProps={{ className: 'custom-popover', align: 'end' }} />);

    await user.click(screen.getByRole('button'));
    const popover = document.querySelector("[data-slot='popover-content']");
    expect(popover).toHaveClass('custom-popover', 'w-auto', 'p-0');
    expect(popover).toHaveAttribute('data-align', 'end');
  });

  it('aligns to the trigger start by default', async () => {
    const user = userEvent.setup();
    render(<DatePicker />);

    await user.click(screen.getByRole('button'));
    expect(document.querySelector("[data-slot='popover-content']")).toHaveAttribute(
      'data-align',
      'start'
    );
  });
});

describe('displayFormat', () => {
  it('formats the DatePicker value', () => {
    render(<DatePicker value={new Date(2024, 5, 15)} displayFormat="yyyy-MM-dd" />);
    expect(screen.getByRole('button')).toHaveTextContent('2024-06-15');
  });

  it('formats both ends of the DateRangePicker value', () => {
    render(
      <DateRangePicker
        value={{ from: new Date(2024, 5, 10), to: new Date(2024, 5, 15) }}
        displayFormat="dd/MM/yyyy"
      />
    );
    expect(screen.getByRole('button')).toHaveTextContent('10/06/2024 - 15/06/2024');
  });
});

describe('DateRangePicker months', () => {
  const monthButtons = () => screen.getAllByRole('button', { name: /, choose month/ });

  it('opens on the start month and the end month', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker value={{ from: new Date(2024, 2, 10), to: new Date(2024, 10, 5) }} />);

    await user.click(screen.getByRole('button'));
    const [left, right] = monthButtons();
    expect(left).toHaveTextContent('March');
    expect(right).toHaveTextContent('November');
  });

  it('shows consecutive months when the range sits in one month', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker value={{ from: new Date(2024, 2, 10), to: new Date(2024, 2, 15) }} />);

    await user.click(screen.getByRole('button'));
    const [left, right] = monthButtons();
    expect(left).toHaveTextContent('March');
    expect(right).toHaveTextContent('April');
  });

  it('pages each month on its own', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker value={{ from: new Date(2024, 2, 10), to: new Date(2024, 10, 5) }} />);

    await user.click(screen.getByRole('button'));
    const [leftNext, rightNext] = screen.getAllByRole('button', { name: /next month/i });
    await user.click(rightNext);
    await user.click(leftNext);

    const [left, right] = monthButtons();
    expect(left).toHaveTextContent('April');
    expect(right).toHaveTextContent('December');
  });

  it('keeps the right month after the left one', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker value={{ from: new Date(2024, 2, 10), to: new Date(2024, 2, 15) }} />);

    await user.click(screen.getByRole('button'));
    const [leftNext] = screen.getAllByRole('button', { name: /next month/i });
    const [, rightPrevious] = screen.getAllByRole('button', { name: /previous month/i });
    expect(leftNext).toBeDisabled();
    expect(rightPrevious).toBeDisabled();
  });

  it('selects a range across both months', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <DateRangePicker value={{ from: new Date(2024, 2, 10) }} onValueChange={handleChange} />
    );

    await user.click(screen.getByRole('button'));
    const [, april] = screen.getAllByRole('grid');
    await user.click(within(april).getByText('20'));

    expect(handleChange).toHaveBeenLastCalledWith(
      { from: new Date(2024, 2, 10), to: new Date(2024, 3, 20) },
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
  });
});

describe('focus on open', () => {
  it('moves focus to the selected day', async () => {
    const user = userEvent.setup();
    render(<DatePicker value={new Date(2024, 5, 15)} />);

    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('15').closest('button')).toHaveFocus());
  });

  it('moves focus to the range start', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker value={{ from: new Date(2024, 5, 10), to: new Date(2024, 7, 5) }} />);

    await user.click(screen.getByRole('button'));
    const [june] = screen.getAllByRole('grid');
    await waitFor(() => expect(within(june).getByText('10').closest('button')).toHaveFocus());
  });
});

describe('DateRangePicker bounds', () => {
  const monthButtons = () => screen.getAllByRole('button', { name: /, choose month/ });

  it('keeps both months inside endMonth when there is no value', async () => {
    const user = userEvent.setup();
    const now = new Date();
    render(
      <DateRangePicker
        calendarProps={{ endMonth: new Date(now.getFullYear(), now.getMonth(), 1) }}
      />
    );

    await user.click(screen.getByRole('button'));
    const [, right] = monthButtons();
    expect(right).toHaveTextContent(now.toLocaleString(undefined, { month: 'long' }));
  });

  it('clamps a value outside the bounds into them', async () => {
    const user = userEvent.setup();
    render(
      <DateRangePicker
        value={{ from: new Date(2020, 0, 5), to: new Date(2030, 0, 5) }}
        calendarProps={{ startMonth: new Date(2024, 2, 1), endMonth: new Date(2024, 7, 1) }}
      />
    );

    await user.click(screen.getByRole('button'));
    const [left, right] = monthButtons();
    expect(left).toHaveTextContent('March');
    expect(right).toHaveTextContent('August');
  });

  it('shows one month per calendar even if numberOfMonths is forced', async () => {
    const user = userEvent.setup();
    const calendarProps = { numberOfMonths: 3, captionLayout: 'label' } as never;
    render(<DateRangePicker calendarProps={calendarProps} />);

    await user.click(screen.getByRole('button'));
    expect(screen.getAllByRole('grid')).toHaveLength(2);
  });
});
