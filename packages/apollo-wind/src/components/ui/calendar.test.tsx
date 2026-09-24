import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
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
