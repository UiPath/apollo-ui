import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type * as React from 'react';
import { useDayPicker } from 'react-day-picker';
import { describe, expect, it, vi } from 'vitest';
import { DatePicker, DateRangePicker } from './date-picker';
import { InputGroup } from './input-group';

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

describe.each([
  ['DatePicker', DatePicker],
  ['DateRangePicker', DateRangePicker],
] as const)('%s in an input group', (_, Picker) => {
  it("is the enclosing group's control, with no box of its own", () => {
    render(
      <InputGroup>
        <Picker placeholder="Pick a date" />
      </InputGroup>
    );
    const trigger = screen.getByRole('button', { name: 'Pick a date' });
    expect(trigger).toHaveAttribute('data-slot', 'input-group-control');
    expect(trigger).not.toHaveClass('future:bg-surface-overlay');
  });

  it('opens its panel against the group box', async () => {
    const user = userEvent.setup();
    render(
      <InputGroup data-testid="box">
        <Picker placeholder="Pick a date" />
      </InputGroup>
    );
    const measure = vi.spyOn(screen.getByTestId('box'), 'getBoundingClientRect');

    await user.click(screen.getByRole('button', { name: 'Pick a date' }));
    await waitFor(() => expect(measure).toHaveBeenCalled());
  });
});

describe('DateRangePicker in an input group', () => {
  it('shows the range itself, not its accessible label', () => {
    render(
      <InputGroup>
        <DateRangePicker
          id="range"
          value={{ from: new Date(2026, 0, 5), to: new Date(2026, 0, 9) }}
        />
      </InputGroup>
    );
    expect(screen.getByText('Jan 05, 2026 - Jan 09, 2026')).toBeInTheDocument();
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

describe('DateRangePicker bounded to one month', () => {
  it('shows a single calendar inside the bounds', async () => {
    const user = userEvent.setup();
    render(
      <DateRangePicker
        calendarProps={{ startMonth: new Date(2024, 5, 1), endMonth: new Date(2024, 5, 1) }}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getAllByRole('grid')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /June, choose month/ })).toBeInTheDocument();
  });

  it('refits the calendars when the bounds change while open', async () => {
    const user = userEvent.setup();
    const june = new Date(2024, 5, 1);
    const { rerender } = render(
      <DateRangePicker calendarProps={{ startMonth: june, endMonth: new Date(2024, 7, 1) }} />
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getAllByRole('grid')).toHaveLength(2);

    rerender(<DateRangePicker calendarProps={{ startMonth: june, endMonth: june }} />);
    expect(screen.getAllByRole('grid')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /June, choose month/ })).toBeInTheDocument();

    rerender(
      <DateRangePicker calendarProps={{ startMonth: june, endMonth: new Date(2024, 11, 1) }} />
    );
    const months = screen.getAllByRole('button', { name: /, choose month/ });
    expect(months.map((month) => month.textContent?.split(',')[0])).toEqual(['June', 'July']);
  });
});

describe('DateRangePicker right to left', () => {
  it('lays the pair and its footer out in the calendars’ direction and language', async () => {
    const user = userEvent.setup();
    render(
      <DateRangePicker calendarProps={{ dir: 'rtl', lang: 'ar', footer: <span>تذييل</span> }} />
    );

    await user.click(screen.getByRole('button'));
    const grids = screen.getAllByRole('grid');
    const pair = grids[0].closest('[data-slot="range-calendars"]');
    expect(pair).toHaveAttribute('dir', 'rtl');
    expect(pair).toHaveAttribute('lang', 'ar');
    expect(pair).toContainElement(screen.getByText('تذييل'));
    expect(grids[1].closest('[data-caption-layout="drilldown"]')).toHaveClass('md:border-s');
  });
});

describe('DateRangePicker deprecated month props', () => {
  const monthButtons = () => screen.getAllByRole('button', { name: /, choose month/ });

  it('shows a controlled month on the left calendar', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DateRangePicker
        value={{ from: new Date(2024, 0, 10) }}
        calendarProps={{ month: new Date(2024, 5, 1) }}
      />
    );

    await user.click(screen.getByRole('button'));
    let [left, right] = monthButtons();
    expect(left).toHaveTextContent('June');
    expect(right).toHaveTextContent('July');

    // Moving the left month onto the right one pushes the right along after it.
    rerender(
      <DateRangePicker
        value={{ from: new Date(2024, 0, 10) }}
        calendarProps={{ month: new Date(2024, 6, 1) }}
      />
    );
    [left, right] = monthButtons();
    expect(left).toHaveTextContent('July');
    expect(right).toHaveTextContent('August');
  });

  it('opens the left calendar on defaultMonth and pages from it', async () => {
    const user = userEvent.setup();
    render(
      <DateRangePicker
        value={{ from: new Date(2024, 0, 10) }}
        calendarProps={{ defaultMonth: new Date(2024, 5, 1) }}
      />
    );

    await user.click(screen.getByRole('button'));
    const [left, right] = monthButtons();
    expect(left).toHaveTextContent('June');
    expect(right).toHaveTextContent('July');

    // Not controlled: the left calendar still pages on its own.
    const [leftPrevious] = screen.getAllByRole('button', { name: /previous month/i });
    await user.click(leftPrevious);
    expect(monthButtons()[0]).toHaveTextContent('May');
  });

  it('keeps a controlled month inside the bounds, with room for the right month', async () => {
    const user = userEvent.setup();
    render(
      <DateRangePicker
        calendarProps={{ month: new Date(2024, 11, 1), endMonth: new Date(2024, 11, 1) }}
      />
    );

    await user.click(screen.getByRole('button'));
    const [left, right] = monthButtons();
    expect(left).toHaveTextContent('November');
    expect(right).toHaveTextContent('December');
  });

  it('applies calendarProps.className once, to the pair', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker calendarProps={{ className: 'custom-calendars' }} />);

    await user.click(screen.getByRole('button'));
    const styled = document.querySelectorAll('.custom-calendars');
    expect(styled).toHaveLength(1);
    expect(styled[0]).toHaveAttribute('data-slot', 'range-calendars');
  });

  it('applies root style, classNames.root and styles.root once, to the pair', async () => {
    const user = userEvent.setup();
    render(
      <DateRangePicker
        calendarProps={{
          style: { marginTop: 12 },
          classNames: { root: 'custom-root' },
          styles: { root: { paddingTop: 4 } },
        }}
      />
    );

    await user.click(screen.getByRole('button'));
    const styled = document.querySelectorAll<HTMLElement>('.custom-root');
    expect(styled).toHaveLength(1);
    expect(styled[0]).toHaveAttribute('data-slot', 'range-calendars');
    expect(styled[0].style.marginTop).toBe('12px');
    expect(styled[0].style.paddingTop).toBe('4px');
    expect(document.querySelectorAll('[style*="margin-top"]')).toHaveLength(1);
  });

  it('renders a custom Root once, around both months', async () => {
    const user = userEvent.setup();
    render(
      <DateRangePicker
        calendarProps={{
          components: {
            Root: ({ rootRef, ...props }) => <div ref={rootRef} data-custom-root {...props} />,
          },
        }}
      />
    );

    await user.click(screen.getByRole('button'));
    // A custom Root keeps the one two-month DayPicker, so it renders inside DayPicker's context.
    const custom = document.querySelectorAll('[data-custom-root]');
    expect(custom).toHaveLength(1);
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    for (const grid of screen.getAllByRole('grid')) expect(custom[0]).toContainElement(grid);
  });

  it('lets a controlled month win over defaultMonth', async () => {
    const user = userEvent.setup();
    render(
      <DateRangePicker
        calendarProps={{ month: new Date(2024, 8, 1), defaultMonth: new Date(2024, 5, 1) }}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(monthButtons()[0]).toHaveTextContent('September');
  });

  it('reports the left month through onMonthChange', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(
      <DateRangePicker
        value={{ from: new Date(2024, 2, 10), to: new Date(2024, 10, 5) }}
        calendarProps={{ onMonthChange }}
      />
    );

    await user.click(screen.getByRole('button'));
    const [leftNext, rightNext] = screen.getAllByRole('button', { name: /next month/i });
    await user.click(rightNext);
    expect(onMonthChange).not.toHaveBeenCalled();
    await user.click(leftNext);
    expect(onMonthChange).toHaveBeenCalledTimes(1);
    expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2024, 3, 1));
    expect(monthButtons()[0]).toHaveTextContent('April');
  });
});

describe('DateRangePicker root props', () => {
  it('renders the footer once for the pair of calendars', async () => {
    const user = userEvent.setup();
    render(
      <DateRangePicker
        calendarProps={{
          footer: (
            <button type="button" id="range-footer">
              Clear
            </button>
          ),
        }}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Clear' })).toHaveLength(1);
    const footer = document.querySelector('[data-slot="range-calendars-footer"]');
    expect(footer).toHaveAttribute('role', 'status');
    expect(footer).toContainElement(screen.getByRole('button', { name: 'Clear' }));
  });

  it('puts the root id and name on the pair once', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker calendarProps={{ id: 'trip-dates', 'aria-label': 'Trip dates' }} />);

    await user.click(screen.getByRole('button'));
    expect(document.querySelectorAll('#trip-dates')).toHaveLength(1);
    expect(screen.getByRole('group', { name: 'Trip dates' })).toHaveAttribute('id', 'trip-dates');
  });
});

describe('DateRangePicker in a timeZone', () => {
  const monthButtons = () => screen.getAllByRole('button', { name: /, choose month/ });

  // Run on a UTC host, where the zone's month and the host's differ near a month boundary.
  async function inUTC(run: () => Promise<void>) {
    const original = process.env.TZ;
    process.env.TZ = 'UTC';
    try {
      await run();
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  }

  it('opens on the zone’s months for the range', () =>
    inUTC(async () => {
      const user = userEvent.setup();
      // 22:30Z on 30 June is 1 July in Tokyo; 20:00Z on 31 August is 1 September there.
      render(
        <DateRangePicker
          value={{
            from: new Date(Date.UTC(2024, 5, 30, 22, 30)),
            to: new Date(Date.UTC(2024, 7, 31, 20, 0)),
          }}
          calendarProps={{ timeZone: 'Asia/Tokyo' }}
        />
      );

      await user.click(screen.getByRole('button'));
      const [left, right] = monthButtons();
      expect(left).toHaveTextContent('July');
      expect(right).toHaveTextContent('September');
    }));

  it('opens on the zone’s current month without a value', () =>
    inUTC(async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(Date.UTC(2024, 5, 30, 22, 30)));
      try {
        const user = userEvent.setup();
        render(<DateRangePicker calendarProps={{ timeZone: 'Asia/Tokyo' }} />);

        await user.click(screen.getByRole('button'));
        const [left, right] = monthButtons();
        expect(left).toHaveTextContent('July');
        expect(right).toHaveTextContent('August');
      } finally {
        vi.useRealTimers();
      }
    }));

  it('keeps a controlled month inside the zone’s endMonth', () =>
    inUTC(async () => {
      const user = userEvent.setup();
      // 15:30Z on 31 July is 1 August in Tokyo, so August is the last month: the left stops at
      // July.
      render(
        <DateRangePicker
          calendarProps={{
            timeZone: 'Asia/Tokyo',
            month: new Date(Date.UTC(2024, 8, 15)),
            endMonth: new Date(Date.UTC(2024, 6, 31, 15, 30)),
          }}
        />
      );

      await user.click(screen.getByRole('button'));
      const [left, right] = monthButtons();
      expect(left).toHaveTextContent('July');
      expect(right).toHaveTextContent('August');
    }));
});

describe('trigger in the calendar timeZone', () => {
  // 22:30Z on 30 June is 1 July in Tokyo; 20:00Z on 31 August is 1 September there.
  const from = new Date(Date.UTC(2024, 5, 30, 22, 30));
  const to = new Date(Date.UTC(2024, 7, 31, 20, 0));

  function inUTC(run: () => void) {
    const original = process.env.TZ;
    process.env.TZ = 'UTC';
    try {
      run();
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  }

  it('names the DatePicker value as the zoned calendar selects it', () =>
    inUTC(() => {
      render(<DatePicker value={from} calendarProps={{ timeZone: 'Asia/Tokyo' }} />);
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveTextContent('July 1st, 2024');
      expect(trigger).toHaveAccessibleName('Selected date: July 1st, 2024');
    }));

  it('names the DateRangePicker ends as the zoned calendars select them', () =>
    inUTC(() => {
      render(<DateRangePicker value={{ from, to }} calendarProps={{ timeZone: 'Asia/Tokyo' }} />);
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveTextContent('Jul 01, 2024 - Sep 01, 2024');
      expect(trigger).toHaveAccessibleName('Selected range: Jul 01, 2024 to Sep 01, 2024');
    }));
});

// Overrides written for DayPicker's own layout, which read its context.
function ContextFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  const { months } = useDayPicker();
  return <div data-testid="context-footer" data-months={months.length} {...props} />;
}

function ContextRoot({
  rootRef,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { rootRef?: React.Ref<HTMLDivElement> }) {
  const { months } = useDayPicker();
  return <div ref={rootRef} data-testid="context-root" data-months={months.length} {...props} />;
}

describe('Root and Footer overrides that read DayPicker context', () => {
  it('keeps a DatePicker Footer inside DayPicker', async () => {
    const user = userEvent.setup();
    render(
      <DatePicker
        value={new Date(2024, 5, 15)}
        calendarProps={{ footer: 'Pick a day', components: { Footer: ContextFooter } }}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('context-footer')).toHaveTextContent('Pick a day');
    expect(screen.getByTestId('context-footer')).toHaveAttribute('data-months', '1');
    // The label caption DayPicker draws, not the drill-down's month and year buttons.
    expect(screen.queryByRole('button', { name: /choose month/ })).not.toBeInTheDocument();
    expect(screen.getByText('June 2024')).toBeInTheDocument();
  });

  it('keeps a DatePicker Root inside DayPicker', async () => {
    const user = userEvent.setup();
    render(
      <DatePicker
        value={new Date(2024, 5, 15)}
        calendarProps={{ components: { Root: ContextRoot } }}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('context-root')).toHaveAttribute('data-months', '1');
  });

  it('keeps a DateRangePicker Footer inside one two-month DayPicker', async () => {
    const user = userEvent.setup();
    render(
      <DateRangePicker
        value={{ from: new Date(2024, 2, 10), to: new Date(2024, 2, 15) }}
        calendarProps={{ footer: 'Pick a range', components: { Footer: ContextFooter } }}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('context-footer')).toHaveAttribute('data-months', '2');
    expect(screen.getByText('March 2024')).toBeInTheDocument();
    expect(screen.getByText('April 2024')).toBeInTheDocument();
  });
});
