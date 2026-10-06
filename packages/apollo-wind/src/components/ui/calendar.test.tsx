import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ja } from 'date-fns/locale';
import { Calendar } from './calendar';

describe('Calendar', () => {
  describe('rendering', () => {
    it('renders calendar', () => {
      render(<Calendar />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('renders with current month', () => {
      render(<Calendar />);
      const currentMonth = new Date().toLocaleString('default', {
        month: 'long',
      });
      expect(screen.getByText(new RegExp(currentMonth))).toBeInTheDocument();
    });

    it('renders navigation buttons', () => {
      render(<Calendar />);
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('renders weekday headers', () => {
      render(<Calendar />);
      expect(screen.getByText('Su')).toBeInTheDocument();
      expect(screen.getByText('Mo')).toBeInTheDocument();
    });

    it('renders day buttons', () => {
      render(<Calendar />);
      // Day buttons are in the grid
      expect(screen.getByRole('grid')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Calendar />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no violations with selected date', async () => {
      const { container } = render(<Calendar mode="single" selected={new Date()} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('interactions', () => {
    it('navigates to previous month', async () => {
      const user = userEvent.setup();
      render(<Calendar defaultMonth={new Date(2024, 5, 15)} />);

      expect(screen.getByText(/June/)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /previous/i }));

      expect(screen.getByText(/May/)).toBeInTheDocument();
    });

    it('navigates to next month', async () => {
      const user = userEvent.setup();
      render(<Calendar defaultMonth={new Date(2024, 5, 15)} />);

      expect(screen.getByText(/June/)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /next/i }));

      expect(screen.getByText(/July/)).toBeInTheDocument();
    });

    it('calls onSelect when day is clicked in single mode', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      render(
        <Calendar mode="single" defaultMonth={new Date(2024, 5, 1)} onSelect={handleSelect} />
      );

      await user.click(screen.getByText('15'));

      expect(handleSelect).toHaveBeenCalled();
    });
  });

  describe('modes', () => {
    it('supports single selection mode', () => {
      render(
        <Calendar
          mode="single"
          selected={new Date(2024, 5, 15)}
          defaultMonth={new Date(2024, 5, 1)}
        />
      );
      // The selected day should be marked with data-selected
      const selectedCell = screen.getByText('15').closest('[data-selected]');
      expect(selectedCell).toHaveAttribute('data-selected', 'true');
    });

    it('supports range selection mode', () => {
      render(
        <Calendar
          mode="range"
          selected={{
            from: new Date(2024, 5, 10),
            to: new Date(2024, 5, 15),
          }}
          defaultMonth={new Date(2024, 5, 1)}
        />
      );
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('draws the rule between months on the start side, so it stays between them in RTL', () => {
      const { container } = render(
        <Calendar numberOfMonths={2} defaultMonth={new Date(2024, 5, 1)} dir="rtl" />
      );
      const [, second] = container.querySelectorAll('.rdp-month');
      expect(second).toHaveClass('md:[.rdp-month+&]:border-s', 'md:[.rdp-month+&]:ps-4');
      expect(second.className).not.toMatch(/border-l|pl-4/);
    });

    it('points the range ends’ half-bands into the range in either direction', () => {
      render(
        <Calendar
          mode="range"
          selected={{ from: new Date(2024, 5, 10), to: new Date(2024, 5, 15) }}
          defaultMonth={new Date(2024, 5, 1)}
        />
      );
      const start = screen.getByText('10').closest('td');
      const end = screen.getByText('15').closest('td');
      expect(start).toHaveClass('bg-linear-to-r', 'rtl:bg-linear-to-l');
      expect(end).toHaveClass('bg-linear-to-l', 'rtl:bg-linear-to-r');
    });

    it('drops the range end’s half-band after a week number', () => {
      render(
        <Calendar
          mode="range"
          showWeekNumber
          selected={{ from: new Date(2024, 5, 10), to: new Date(2024, 5, 15) }}
          defaultMonth={new Date(2024, 5, 1)}
        />
      );
      const end = screen.getByText('15').closest('td');
      expect(end).toHaveClass(String.raw`[.rdp-week\_number+&]:bg-none`);
    });
  });

  describe('props', () => {
    it('respects showOutsideDays prop', () => {
      const { rerender } = render(
        <Calendar showOutsideDays={true} defaultMonth={new Date(2024, 5, 1)} />
      );
      // With showOutsideDays, days from adjacent months are visible
      expect(screen.getByRole('grid')).toBeInTheDocument();

      rerender(<Calendar showOutsideDays={false} defaultMonth={new Date(2024, 5, 1)} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<Calendar className="custom-calendar" />);
      expect(container.querySelector('.custom-calendar')).toBeInTheDocument();
    });

    it('respects disabled dates', () => {
      render(
        <Calendar
          mode="single"
          defaultMonth={new Date(2024, 5, 1)}
          disabled={[new Date(2024, 5, 15)]}
        />
      );
      const disabledDay = screen.getByText('15').closest('button');
      expect(disabledDay).toBeDisabled();
    });
  });

  describe('buttonVariant prop', () => {
    it('accepts different button variants', () => {
      const { container } = render(<Calendar buttonVariant="outline" />);
      expect(container.querySelector("[data-slot='calendar']")).toBeInTheDocument();
    });
  });

  describe('size prop', () => {
    it('uses compact cells with size="sm"', () => {
      const { container } = render(<Calendar size="sm" />);
      expect(container.querySelector("[data-slot='calendar']")).toHaveClass(
        '[--cell-size:2.25rem]'
      );
    });
  });

  describe('week start', () => {
    // The weekday row is aria-hidden, so it is read by class rather than by role.
    const firstWeekday = () => document.querySelector('.rdp-weekday');

    it('follows an explicit weekStartsOn', () => {
      render(<Calendar weekStartsOn={1} />);
      expect(firstWeekday()).toHaveTextContent('Mo');
    });

    it('follows the browser locale when weekStartsOn is not set', () => {
      const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-GB');
      render(<Calendar />);
      expect(firstWeekday()).toHaveTextContent('Mo');
      language.mockRestore();
    });

    it('starts on Sunday for en-US', () => {
      const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
      render(<Calendar />);
      expect(firstWeekday()).toHaveTextContent('Su');
      language.mockRestore();
    });
  });

  describe('drilldown caption', () => {
    const june2024 = new Date(2024, 5, 15);

    it('shows month and year buttons instead of a static caption', () => {
      render(<Calendar captionLayout="drilldown" defaultMonth={june2024} />);
      expect(screen.getByRole('button', { name: /June, choose month/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /2024, choose year/ })).toBeInTheDocument();
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('steps a month at a time in the days view', async () => {
      const user = userEvent.setup();
      render(<Calendar captionLayout="drilldown" defaultMonth={june2024} />);

      await user.click(screen.getByRole('button', { name: /next month/i }));
      expect(screen.getByRole('button', { name: /July, choose month/ })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /previous month/i }));
      await user.click(screen.getByRole('button', { name: /previous month/i }));
      expect(screen.getByRole('button', { name: /May, choose month/ })).toBeInTheDocument();
    });

    it('zooms out to months and back to that month’s days', async () => {
      const user = userEvent.setup();
      const onMonthChange = vi.fn();
      render(
        <Calendar captionLayout="drilldown" defaultMonth={june2024} onMonthChange={onMonthChange} />
      );

      await user.click(screen.getByRole('button', { name: /June, choose month/ }));
      const months = screen.getByRole('group', { name: 'Months of 2024' });
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'June 2024' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(months).toContainElement(document.activeElement as HTMLElement);

      await user.click(screen.getByRole('button', { name: 'March 2024' }));
      expect(screen.getByRole('grid')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /March, choose month/ })).toBeInTheDocument();
      expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2024, 2, 1));
    });

    it('pages years twelve at a time and steps down to months', async () => {
      const user = userEvent.setup();
      render(<Calendar captionLayout="drilldown" defaultMonth={june2024} />);

      await user.click(screen.getByRole('button', { name: /2024, choose year/ }));
      expect(screen.getByRole('group', { name: 'Years 2016 to 2027' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Next years' }));
      expect(screen.getByRole('group', { name: 'Years 2028 to 2039' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '2030' }));
      expect(screen.getByRole('group', { name: 'Months of 2030' })).toBeInTheDocument();
    });

    it('moves between month cells with the arrow keys', async () => {
      const user = userEvent.setup();
      render(<Calendar captionLayout="drilldown" defaultMonth={june2024} />);

      await user.click(screen.getByRole('button', { name: /June, choose month/ }));
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('button', { name: 'July 2024' })).toHaveFocus();
      await user.keyboard('{ArrowUp}');
      expect(screen.getByRole('button', { name: 'April 2024' })).toHaveFocus();
    });

    it('lays the caption and grids out right to left with dir="rtl"', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Calendar captionLayout="drilldown" defaultMonth={june2024} dir="rtl" />
      );
      const root = container.querySelector('[data-caption-layout="drilldown"]');
      expect(root).toHaveAttribute('dir', 'rtl');
      expect(screen.getByRole('grid').closest('.rdp-root')).toHaveAttribute('dir', 'rtl');

      // The month grid runs mirrored, so the left arrow moves on to the next month.
      await user.click(screen.getByRole('button', { name: /June, choose month/ }));
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByRole('button', { name: 'July 2024' })).toHaveFocus();
    });

    it('keeps DayPicker’s caption hidden when month_caption is customised', () => {
      const { container } = render(
        <Calendar
          captionLayout="drilldown"
          defaultMonth={june2024}
          classNames={{ month_caption: 'custom-caption' }}
        />
      );
      expect(container.querySelector('.custom-caption')).toHaveClass('sr-only');
    });

    it('disables months and years outside startMonth and endMonth', async () => {
      const user = userEvent.setup();
      render(
        <Calendar
          captionLayout="drilldown"
          defaultMonth={june2024}
          startMonth={new Date(2024, 3, 1)}
          endMonth={new Date(2025, 1, 1)}
        />
      );

      await user.click(screen.getByRole('button', { name: /June, choose month/ }));
      expect(screen.getByRole('button', { name: 'March 2024' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'April 2024' })).toBeEnabled();

      await user.click(screen.getByRole('button', { name: /2024, choose year/ }));
      expect(screen.getByRole('button', { name: '2023' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '2025' })).toBeEnabled();
      expect(screen.getByRole('button', { name: '2026' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Previous years' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Next years' })).toBeDisabled();
    });

    it('opens inside startMonth and endMonth when defaultMonth is outside them', () => {
      const { unmount } = render(
        <Calendar
          captionLayout="drilldown"
          defaultMonth={new Date(2020, 5, 1)}
          startMonth={new Date(2024, 3, 1)}
          endMonth={new Date(2025, 1, 1)}
        />
      );
      expect(screen.getByRole('button', { name: /April, choose month/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /2024, choose year/ })).toBeInTheDocument();
      unmount();

      render(
        <Calendar
          captionLayout="drilldown"
          defaultMonth={new Date(2030, 5, 1)}
          startMonth={new Date(2024, 3, 1)}
          endMonth={new Date(2025, 1, 1)}
        />
      );
      expect(screen.getByRole('button', { name: /February, choose month/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /2025, choose year/ })).toBeInTheDocument();
    });

    it('names its controls through labels', async () => {
      const user = userEvent.setup();
      render(
        <Calendar
          captionLayout="drilldown"
          defaultMonth={june2024}
          labels={{
            labelPrevious: () => 'Luna anterioară',
            labelNext: () => 'Luna următoare',
            labelMonthDropdown: () => 'alege luna',
            labelYearDropdown: () => 'alege anul',
            labelPreviousYears: (first, last) => `Anii ${first}–${last}`,
            labelNextYears: (first, last) => `Anii ${first}–${last}`,
            labelMonthsGrid: (year) => `Lunile din ${year}`,
            labelYearsGrid: (first, last) => `Anii de la ${first} la ${last}`,
          }}
        />
      );

      expect(screen.getByRole('button', { name: 'Luna anterioară' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Luna următoare' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /June, alege luna/ }));
      expect(screen.getByRole('group', { name: 'Lunile din 2024' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /2024, alege anul/ }));
      expect(screen.getByRole('group', { name: 'Anii de la 2016 la 2027' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Anii 2004–2015' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Anii 2028–2039' })).toBeInTheDocument();
    });

    it('keeps the footer in the month and year views', async () => {
      const user = userEvent.setup();
      render(
        <Calendar
          captionLayout="drilldown"
          defaultMonth={june2024}
          footer={<span>Pick a day</span>}
        />
      );

      // DayPicker's caption is a status region too, so find the footer by its content.
      const footer = () => screen.getByText('Pick a day').closest('[role="status"]');
      expect(footer()).toHaveAttribute('aria-live', 'polite');
      expect(screen.getAllByText('Pick a day')).toHaveLength(1);

      await user.click(screen.getByRole('button', { name: /June, choose month/ }));
      expect(footer()).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /choose year/ }));
      expect(footer()).toBeInTheDocument();
    });

    it('keeps its style in the month and year views', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Calendar captionLayout="drilldown" defaultMonth={june2024} style={{ marginTop: 12 }} />
      );
      const root = () => container.querySelector<HTMLElement>('[data-caption-layout="drilldown"]');
      expect(root()?.style.marginTop).toBe('12px');

      await user.click(screen.getByRole('button', { name: /June, choose month/ }));
      expect(root()?.style.marginTop).toBe('12px');
    });

    it('keeps root classNames and styles in the month and year views', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Calendar
          captionLayout="drilldown"
          defaultMonth={june2024}
          classNames={{ root: 'custom-root' }}
          styles={{ root: { marginTop: 12 } }}
        />
      );
      const root = () => container.querySelector<HTMLElement>('[data-caption-layout="drilldown"]');
      expect(root()).toHaveClass('custom-root');
      expect(container.querySelectorAll('.custom-root')).toHaveLength(1);

      await user.click(screen.getByRole('button', { name: /June, choose month/ }));
      expect(root()).toHaveClass('custom-root');
      expect(root()?.style.marginTop).toBe('12px');
    });

    it('renders a custom Root as the persistent root', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Calendar
          captionLayout="drilldown"
          defaultMonth={june2024}
          components={{
            Root: ({ rootRef, ...props }) => <div ref={rootRef} data-custom-root {...props} />,
          }}
        />
      );
      const custom = () => container.querySelectorAll('[data-custom-root]');
      expect(custom()).toHaveLength(1);
      expect(custom()[0]).toHaveAttribute('data-caption-layout', 'drilldown');

      await user.click(screen.getByRole('button', { name: /June, choose month/ }));
      expect(custom()).toHaveLength(1);
    });

    it('lets classNames.root override the built-in root classes', () => {
      const { container } = render(
        <Calendar captionLayout="drilldown" classNames={{ root: 'w-full p-0' }} />
      );
      const root = container.querySelector('[data-caption-layout="drilldown"]');
      expect(root).toHaveClass('w-full', 'p-0');
      expect(root).not.toHaveClass('w-fit', 'p-4');
    });

    it('moves an uncontrolled month inside new bounds', () => {
      const { rerender } = render(<Calendar captionLayout="drilldown" defaultMonth={june2024} />);
      expect(screen.getByRole('button', { name: /June, choose month/ })).toBeInTheDocument();

      rerender(
        <Calendar
          captionLayout="drilldown"
          defaultMonth={june2024}
          startMonth={new Date(2025, 2, 1)}
          endMonth={new Date(2025, 11, 1)}
        />
      );
      expect(screen.getByRole('button', { name: /March, choose month/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /2025, choose year/ })).toBeInTheDocument();
    });

    it('names the caption and cells with the dropdown formatters', async () => {
      const user = userEvent.setup();
      render(
        <Calendar
          captionLayout="drilldown"
          defaultMonth={june2024}
          formatters={{
            formatMonthDropdown: (date) => `M${date.getMonth() + 1}`,
            formatYearDropdown: (date) => `Y${date.getFullYear()}`,
          }}
        />
      );
      expect(screen.getByRole('button', { name: /^M6, choose month/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Y2024, choose year/ })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /choose month/ }));
      expect(screen.getByRole('button', { name: /June 2024/ })).toHaveTextContent('M6');

      await user.click(screen.getByRole('button', { name: /choose year/ }));
      expect(screen.getByRole('button', { name: 'Y2024' })).toBeInTheDocument();
    });

    it('keeps arrow keys from scrolling the page at the grid edge', async () => {
      const user = userEvent.setup();
      render(<Calendar captionLayout="drilldown" defaultMonth={june2024} />);
      await user.click(screen.getByRole('button', { name: /choose month/ }));

      const january = screen.getByRole('button', { name: /January 2024/ });
      january.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
        cancelable: true,
      });
      january.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(january).toHaveFocus();
    });

    it('keeps years 0 to 99 when paging and drilling down', async () => {
      const user = userEvent.setup();
      const year50 = new Date(2000, 5, 1);
      year50.setFullYear(50, 5, 1);
      render(<Calendar captionLayout="drilldown" defaultMonth={year50} />);
      expect(screen.getByRole('button', { name: /^50, choose year/ })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /next month/i }));
      expect(screen.getByRole('button', { name: /^July, choose month/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^50, choose year/ })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /choose year/ }));
      await user.click(screen.getByRole('button', { name: '51' }));
      expect(screen.getByRole('button', { name: /^51, choose year/ })).toBeInTheDocument();
    });

    it('reports arrow navigation through onPrevClick and onNextClick', async () => {
      const user = userEvent.setup();
      const onPrevClick = vi.fn();
      const onNextClick = vi.fn();
      render(
        <Calendar
          captionLayout="drilldown"
          defaultMonth={june2024}
          onPrevClick={onPrevClick}
          onNextClick={onNextClick}
        />
      );

      await user.click(screen.getByRole('button', { name: /next month/i }));
      expect(onNextClick).toHaveBeenCalledWith(new Date(2024, 6, 1));
      await user.click(screen.getByRole('button', { name: /previous month/i }));
      expect(onPrevClick).toHaveBeenCalledWith(new Date(2024, 5, 1));

      await user.click(screen.getByRole('button', { name: /choose year/ }));
      await user.click(screen.getByRole('button', { name: /next years/i }));
      expect(onNextClick).toHaveBeenCalledTimes(1);
    });

    it('writes years in the numbering system from numerals', async () => {
      const user = userEvent.setup();
      render(<Calendar captionLayout="drilldown" defaultMonth={june2024} numerals="arab" />);
      expect(screen.getByRole('button', { name: /^٢٠٢٤, choose year/ })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /choose month/ }));
      expect(screen.getByRole('group', { name: 'Months of ٢٠٢٤' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /choose year/ }));
      expect(screen.getByRole('button', { name: '٢٠٢٤' })).toBeInTheDocument();
    });

    it('draws the arrows with a custom Chevron', () => {
      render(
        <Calendar
          captionLayout="drilldown"
          defaultMonth={june2024}
          components={{
            Chevron: ({ orientation, disabled }) => (
              <span data-chevron={orientation} data-disabled={disabled || undefined} />
            ),
          }}
          endMonth={june2024}
        />
      );
      const previous = screen.getByRole('button', { name: /previous month/i });
      const next = screen.getByRole('button', { name: /next month/i });
      expect(previous.querySelector('[data-chevron="left"]')).toBeInTheDocument();
      expect(next.querySelector('[data-chevron="right"]')).toHaveAttribute('data-disabled');
    });

    it('opens on and marks the month of its timeZone', async () => {
      const original = process.env.TZ;
      process.env.TZ = 'UTC';
      vi.useFakeTimers({ toFake: ['Date'] });
      // 22:30 on 30 June in UTC is already 07:30 on 1 July in Tokyo.
      vi.setSystemTime(new Date(Date.UTC(2024, 5, 30, 22, 30)));
      try {
        const user = userEvent.setup();
        render(<Calendar captionLayout="drilldown" timeZone="Asia/Tokyo" />);
        expect(screen.getByRole('button', { name: /^July, choose month/ })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /choose month/ }));
        expect(screen.getByRole('button', { name: 'July 2024' })).toHaveAttribute(
          'aria-current',
          'date'
        );
      } finally {
        vi.useRealTimers();
        if (original === undefined) delete process.env.TZ;
        else process.env.TZ = original;
      }
    });

    it('passes the dropdown formatters dates in its timeZone', async () => {
      const original = process.env.TZ;
      process.env.TZ = 'UTC';
      // Formatters that read the date in the calendar's zone, as date-fns does with a TZDate.
      const inLA = (options: Intl.DateTimeFormatOptions) => (date: Date) =>
        new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'America/Los_Angeles' }).format(
          date
        );
      try {
        const user = userEvent.setup();
        render(
          <Calendar
            captionLayout="drilldown"
            timeZone="America/Los_Angeles"
            defaultMonth={new Date(Date.UTC(2024, 5, 15))}
            formatters={{
              formatMonthDropdown: inLA({ month: 'long' }),
              formatYearDropdown: inLA({ year: 'numeric' }),
            }}
          />
        );
        // Midnight UTC on 1 June is still 31 May in Los Angeles, and 1 January still 2023.
        expect(screen.getByRole('button', { name: /^June, choose month/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^2024, choose year/ })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /choose month/ }));
        expect(screen.getByRole('button', { name: 'June 2024' })).toHaveTextContent('June');
      } finally {
        if (original === undefined) delete process.env.TZ;
        else process.env.TZ = original;
      }
    });

    it('moves an uncontrolled month into a new timeZone', async () => {
      const original = process.env.TZ;
      process.env.TZ = 'UTC';
      vi.useFakeTimers({ toFake: ['Date'] });
      // 22:30 on 31 December 2024 in UTC is already 1 January 2025 in Tokyo.
      vi.setSystemTime(new Date(Date.UTC(2024, 11, 31, 22, 30)));
      try {
        const user = userEvent.setup();
        const { rerender } = render(<Calendar captionLayout="drilldown" timeZone="Asia/Tokyo" />);
        expect(screen.getByRole('button', { name: /^January, choose month/ })).toBeInTheDocument();

        // The same instant is still December 2024 in UTC, its month and its year page.
        rerender(<Calendar captionLayout="drilldown" timeZone="UTC" />);
        expect(screen.getByRole('button', { name: /^December, choose month/ })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /choose year/ }));
        expect(screen.getByRole('button', { name: '2024' })).toHaveAttribute(
          'aria-pressed',
          'true'
        );
      } finally {
        vi.useRealTimers();
        if (original === undefined) delete process.env.TZ;
        else process.env.TZ = original;
      }
    });

    it('has one calendar styling root in the days view', () => {
      const { container } = render(<Calendar captionLayout="drilldown" defaultMonth={june2024} />);
      expect(container.querySelectorAll('[data-slot="calendar"]')).toHaveLength(1);
    });

    it('styles the arrows with the nav, button_previous and button_next slots', () => {
      render(
        <Calendar
          captionLayout="drilldown"
          defaultMonth={june2024}
          classNames={{
            nav: 'custom-nav',
            button_previous: 'custom-prev',
            button_next: 'custom-next',
          }}
          styles={{ button_previous: { marginLeft: 3 }, button_next: { marginRight: 5 } }}
        />
      );
      const previous = screen.getByRole('button', { name: /previous month/i });
      const next = screen.getByRole('button', { name: /next month/i });
      expect(previous).toHaveClass('custom-prev');
      expect(previous.style.marginLeft).toBe('3px');
      expect(next).toHaveClass('custom-next');
      expect(next.style.marginRight).toBe('5px');
      expect(previous.parentElement).toHaveClass('custom-nav');
    });

    it('moves the year page with a controlled month', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Calendar captionLayout="drilldown" month={june2024} />);

      await user.click(screen.getByRole('button', { name: /choose year/ }));
      expect(screen.getByRole('button', { name: '2024' })).toBeInTheDocument();

      rerender(<Calendar captionLayout="drilldown" month={new Date(2040, 5, 1)} />);
      expect(screen.getByRole('button', { name: '2040' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('marks the current month and year from the today prop', async () => {
      const user = userEvent.setup();
      render(
        <Calendar captionLayout="drilldown" defaultMonth={june2024} today={new Date(2024, 2, 4)} />
      );

      await user.click(screen.getByRole('button', { name: /June, choose month/ }));
      expect(screen.getByRole('button', { name: 'March 2024' })).toHaveAttribute(
        'aria-current',
        'date'
      );

      await user.click(screen.getByRole('button', { name: /choose year/ }));
      expect(screen.getByRole('button', { name: '2024' })).toHaveAttribute('aria-current', 'date');
    });

    it('names month cells in the locale’s month and year order', async () => {
      const user = userEvent.setup();
      render(<Calendar captionLayout="drilldown" defaultMonth={june2024} locale={ja} />);

      await user.click(screen.getByRole('button', { name: /choose month/ }));
      expect(screen.getByRole('button', { name: '2024年6月' })).toBeInTheDocument();
    });

    it('keeps its id and name in the month and year views', async () => {
      const user = userEvent.setup();
      render(
        <Calendar
          captionLayout="drilldown"
          defaultMonth={june2024}
          id="due-date"
          aria-label="Due date"
        />
      );

      const root = () => screen.getByRole('group', { name: 'Due date' });
      expect(root()).toHaveAttribute('id', 'due-date');
      expect(document.querySelectorAll('#due-date')).toHaveLength(1);

      await user.click(screen.getByRole('button', { name: /June, choose month/ }));
      expect(root()).toHaveAttribute('id', 'due-date');

      await user.click(screen.getByRole('button', { name: /choose year/ }));
      expect(root()).toHaveAttribute('id', 'due-date');
    });

    it('turns off every way to change month with disableNavigation', () => {
      render(<Calendar captionLayout="drilldown" defaultMonth={june2024} disableNavigation />);
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /choose month/ })).toBeDisabled();
      expect(screen.getByRole('button', { name: /choose year/ })).toBeDisabled();
    });

    it('hides the arrows with hideNavigation', () => {
      render(<Calendar captionLayout="drilldown" defaultMonth={june2024} hideNavigation />);
      expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
    });

    it('widens for the week number column', () => {
      const { container } = render(
        <Calendar captionLayout="drilldown" defaultMonth={june2024} showWeekNumber />
      );
      const box = container.querySelector<HTMLElement>('[data-slot="calendar"] > div');
      expect(box?.style.width).toContain('+ var(--cell-size)');
    });

    it('selects a day', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <Calendar
          captionLayout="drilldown"
          mode="single"
          defaultMonth={june2024}
          onSelect={onSelect}
        />
      );

      await user.click(screen.getByText('15'));
      expect(onSelect).toHaveBeenCalled();
      expect(onSelect.mock.calls[0][0]).toEqual(new Date(2024, 5, 15));
    });

    it('has no accessibility violations in any view', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Calendar
          captionLayout="drilldown"
          mode="single"
          selected={june2024}
          defaultMonth={june2024}
        />
      );
      expect(await axe(container)).toHaveNoViolations();

      await user.click(screen.getByRole('button', { name: /June, choose month/ }));
      expect(await axe(container)).toHaveNoViolations();

      await user.click(screen.getByRole('button', { name: /choose year/ }));
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('drilldown focus', () => {
    it('focuses the first enabled year when the year in view is disabled', async () => {
      const user = userEvent.setup();
      render(
        <Calendar
          captionLayout="drilldown"
          month={new Date(2024, 5, 1)}
          startMonth={new Date(2025, 0, 1)}
          endMonth={new Date(2026, 11, 1)}
        />
      );

      await user.click(screen.getByRole('button', { name: /2024, choose year/ }));
      expect(screen.getByRole('button', { name: '2025' })).toHaveFocus();
    });
  });
});
