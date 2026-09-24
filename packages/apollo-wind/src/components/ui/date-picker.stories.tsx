import type { Meta } from '@storybook/react-vite';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { DatePicker, DateRangePicker } from './date-picker';
import { Label } from './label';

const meta = {
  title: 'Components/Core/Date Picker',
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

export const Bounded = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    const year = new Date().getFullYear();

    return (
      <DatePicker
        value={date}
        onValueChange={setDate}
        calendarProps={{
          startMonth: new Date(year - 20, 0, 1),
          endMonth: new Date(year + 20, 11, 1),
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'The calendar opens on the selected month and uses the drilldown caption: click the month or year to jump there. Pass `startMonth` and `endMonth` through `calendarProps` to bound how far it can go. Picking a date closes the popover.',
      },
    },
  },
};

export const CustomFormat = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return <DatePicker value={date} onValueChange={setDate} displayFormat="dd/MM/yyyy" />;
  },
  parameters: {
    docs: {
      description: {
        story: '`displayFormat` takes any date-fns format string. The default is `PPP`.',
      },
    },
  },
};

export const CompactInPanel = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>();

    return (
      <div className="grid w-[280px] gap-1.5">
        <Label htmlFor="date-picker-compact">Effective date</Label>
        <DatePicker
          id="date-picker-compact"
          value={date}
          onValueChange={setDate}
          calendarProps={{ size: 'sm' }}
          popoverProps={{ sideOffset: 8 }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'For a narrow panel, `calendarProps={{ size: "sm" }}` keeps the calendar close to the field width. `popoverProps` sets alignment, offset and class on the popover.',
      },
    },
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

export const WithInlineValidation = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="grid w-[280px] gap-1.5 [&>[data-slot=form-field-error]]:mt-0">
        <Label htmlFor="date-picker-due">Due date</Label>
        <DatePicker id="date-picker-due" error="Select a due date before saving." />
      </div>
      <div className="grid w-[300px] gap-1.5 [&>[data-slot=form-field-error]]:mt-0">
        <Label htmlFor="date-range-picker-window">Reporting window</Label>
        <DateRangePicker
          id="date-range-picker-window"
          error="Select both a start and an end date."
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Inline validation stays beside the control so the issue and resolution are clear in context. Both triggers expose `aria-invalid` and associate the visible message with `aria-describedby` and `aria-errormessage` automatically. `DatePicker` and `DateRangePicker` take the same `error` and `errorId` props.',
      },
    },
  },
};
