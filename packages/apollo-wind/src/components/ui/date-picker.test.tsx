import { render, screen, waitFor } from '@testing-library/react';
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
