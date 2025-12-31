import type { Meta } from '@storybook/react-vite';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { DatePicker, DateRangePicker } from './date-picker';
import { Label } from './label';

const meta = {
  title: 'Design System/Core/Date Picker',
  component: DatePicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DatePicker>;

export default meta;

export const Default = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>();

    return <DatePicker value={date} onValueChange={setDate} />;
  },
};

export const WithLabel = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>();

    return (
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="date">Appointment Date</Label>
        <DatePicker value={date} onValueChange={setDate} />
      </div>
    );
  },
};

export const WithValue = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return <DatePicker value={date} onValueChange={setDate} />;
  },
};

export const Disabled = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return <DatePicker value={date} onValueChange={setDate} disabled />;
  },
};

export const DateRangeStory = {
  args: {},
  render: () => {
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    return (
      <DateRangePicker
        value={dateRange}
        onValueChange={(range) => setDateRange(range ?? undefined)}
      />
    );
  },
};

export const DateRangeWithValue = {
  args: {},
  render: () => {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: new Date(),
      to: new Date(new Date().setDate(new Date().getDate() + 7)),
    });

    return (
      <DateRangePicker
        value={dateRange}
        onValueChange={(range) => setDateRange(range ?? undefined)}
      />
    );
  },
};
