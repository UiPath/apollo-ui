import type { Meta } from '@storybook/react-vite';
import { useState } from 'react';
import { Calendar } from './calendar';

const meta: Meta<typeof Calendar> = {
  title: 'Components/Data Display/Calendar',
  component: Calendar,
  tags: ['autodocs'],
};

export default meta;

export const Default = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
      <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
    );
  },
};

export const DrillDown = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
      <Calendar
        mode="single"
        captionLayout="drilldown"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click the month to switch the grid to the twelve months of that year, or the year to page through twelve years at a time. Picking a year steps down to its months, and picking a month steps down to its days. The popover keeps the same size in every view. Use `startMonth` and `endMonth` to bound the range.',
      },
    },
  },
};

export const DrillDownBounded = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const year = new Date().getFullYear();

    return (
      <Calendar
        mode="single"
        captionLayout="drilldown"
        selected={date}
        onSelect={setDate}
        startMonth={new Date(year - 1, 0, 1)}
        endMonth={new Date(year + 1, 11, 1)}
        className="rounded-md border"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Months and years outside `startMonth` and `endMonth` are disabled, and the arrows stop at the bounds.',
      },
    },
  },
};

export const Compact = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
      <Calendar
        mode="single"
        size="sm"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '`size="sm"` uses 36px day cells instead of 44px, for a calendar in a popover under a 40px field.',
      },
    },
  },
};

export const MondayFirst = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
      <Calendar
        mode="single"
        weekStartsOn={1}
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'The week starts on the first day of the browser locale: Monday for most locales, Sunday for en-US. Pass `weekStartsOn` to fix it, or a date-fns `locale` to use that locale instead.',
      },
    },
  },
};
