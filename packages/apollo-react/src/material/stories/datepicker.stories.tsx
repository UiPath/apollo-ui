import Stack from '@mui/material/Stack';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type { Meta, StoryObj } from '@storybook/react';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { materialParameters, Section } from './storybook-helpers';

/**
 * `DatePicker` from `@mui/x-date-pickers` styled by the Apollo theme
 * overrides. Provides an accessible date selection interface with a calendar
 * popover. Every story wraps its content in a `LocalizationProvider` with the
 * dayjs adapter, exactly as consuming apps must.
 */
const meta: Meta = {
  title: 'Components/Datepicker',
  parameters: {
    ...materialParameters,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function BasicDemo() {
  const [value, setValue] = useState<Dayjs | null>(dayjs());
  return (
    <DatePicker
      label="Select Date"
      value={value}
      onChange={(newValue) => setValue(newValue)}
      sx={{ minWidth: 300 }}
    />
  );
}

export const Basic: Story = {
  render: () => (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Section
        title="Basic DatePicker"
        description="Standard date picker with Apollo theme styling."
      >
        <BasicDemo />
      </Section>
    </LocalizationProvider>
  ),
};

function RequiredDemo() {
  const [value, setValue] = useState<Dayjs | null>(null);
  return (
    <DatePicker
      label="Required Date"
      value={value}
      onChange={(newValue) => setValue(newValue)}
      slotProps={{
        textField: {
          required: true,
        },
      }}
      sx={{ minWidth: 300 }}
    />
  );
}

export const RequiredField: Story = {
  render: () => (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Section title="Required Field" description="DatePicker marked as required with asterisk.">
        <RequiredDemo />
      </Section>
    </LocalizationProvider>
  ),
};

export const ReadOnlyAndDisabled: Story = {
  render: () => (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Section title="Read-Only" description="DatePicker in read-only mode (cannot be changed).">
        <DatePicker label="Read-Only Date" value={dayjs()} readOnly sx={{ minWidth: 300 }} />
      </Section>
      <Section
        title="Disabled State"
        description="DatePicker in disabled state with muted styling."
      >
        <DatePicker label="Disabled Date" value={dayjs()} disabled sx={{ minWidth: 300 }} />
      </Section>
    </LocalizationProvider>
  ),
};

function DifferentViewsDemo() {
  const [value, setValue] = useState<Dayjs | null>(dayjs());
  return (
    <Stack spacing={3} sx={{ maxWidth: 600 }}>
      <DatePicker
        label="Year View"
        value={value}
        onChange={(newValue) => setValue(newValue)}
        views={['year', 'month', 'day']}
        openTo="year"
        sx={{ minWidth: 300 }}
      />
      <DatePicker
        label="Month View"
        value={value}
        onChange={(newValue) => setValue(newValue)}
        views={['year', 'month', 'day']}
        openTo="month"
        sx={{ minWidth: 300 }}
      />
    </Stack>
  );
}

export const DifferentViews: Story = {
  render: () => (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Section
        title="Different Views"
        description="DatePickers with different default calendar views."
      >
        <DifferentViewsDemo />
      </Section>
    </LocalizationProvider>
  ),
};

function DateConstraintsDemo() {
  const [value, setValue] = useState<Dayjs | null>(dayjs());
  return (
    <Stack spacing={3} sx={{ maxWidth: 600 }}>
      <DatePicker
        label="Future Dates Only"
        value={value}
        onChange={(newValue) => setValue(newValue)}
        minDate={dayjs()}
        sx={{ minWidth: 300 }}
      />
      <DatePicker
        label="This Month Only"
        value={value}
        onChange={(newValue) => setValue(newValue)}
        minDate={dayjs().startOf('month')}
        maxDate={dayjs().endOf('month')}
        sx={{ minWidth: 300 }}
      />
    </Stack>
  );
}

export const DateConstraints: Story = {
  render: () => (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Section
        title="Date Constraints"
        description="DatePickers with minimum and maximum date restrictions."
      >
        <DateConstraintsDemo />
      </Section>
    </LocalizationProvider>
  ),
};
