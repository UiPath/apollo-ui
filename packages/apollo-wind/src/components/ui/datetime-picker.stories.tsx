import type { Meta } from '@storybook/react-vite';
import { useState } from 'react';
import { DateTimePicker } from './datetime-picker';
import { Label } from './label';

const meta = {
  title: 'Components/Core/DateTime Picker',
  component: DateTimePicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DateTimePicker>;

export default meta;

export const Default = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    return (
      <div className="w-[400px]">
        <DateTimePicker value={date} onValueChange={setDate} />
        {date && (
          <p className="mt-4 text-sm text-muted-foreground">Selected: {date.toLocaleString()}</p>
        )}
      </div>
    );
  },
};

export const WithInitialValue = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <div className="w-[400px]">
        <DateTimePicker value={date} onValueChange={setDate} />
        {date && (
          <p className="mt-4 text-sm text-muted-foreground">Selected: {date.toLocaleString()}</p>
        )}
      </div>
    );
  },
};

export const With12HourFormat = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    return (
      <div className="w-[400px]">
        <DateTimePicker value={date} onValueChange={setDate} use12Hour={true} />
        {date && (
          <p className="mt-4 text-sm text-muted-foreground">Selected: {date.toLocaleString()}</p>
        )}
      </div>
    );
  },
};

export const Disabled = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <div className="w-[400px]">
        <DateTimePicker value={date} onValueChange={setDate} disabled />
      </div>
    );
  },
};

export const CustomPlaceholder = {
  args: {},
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    return (
      <div className="w-[400px]">
        <DateTimePicker value={date} onValueChange={setDate} placeholder="When should we meet?" />
      </div>
    );
  },
};

export const InForm = {
  args: {},
  render: () => {
    const [meetingDate, setMeetingDate] = useState<Date | undefined>();
    const [deadline, setDeadline] = useState<Date | undefined>();

    return (
      <div className="w-[400px] space-y-4">
        <div>
          <span className="text-sm font-medium mb-2 block">Meeting Date</span>
          <DateTimePicker
            value={meetingDate}
            onValueChange={setMeetingDate}
            placeholder="Select meeting date and time"
          />
        </div>
        <div>
          <span className="text-sm font-medium mb-2 block">Project Deadline</span>
          <DateTimePicker
            value={deadline}
            onValueChange={setDeadline}
            placeholder="Select deadline"
          />
        </div>
        {(meetingDate || deadline) && (
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium">Selected Times:</p>
            {meetingDate && (
              <p className="text-sm text-muted-foreground">
                Meeting: {meetingDate.toLocaleString()}
              </p>
            )}
            {deadline && (
              <p className="text-sm text-muted-foreground">Deadline: {deadline.toLocaleString()}</p>
            )}
          </div>
        )}
      </div>
    );
  },
};

export const WithInlineValidation = {
  render: () => (
    <div className="grid w-[320px] gap-1.5 [&>[data-slot=form-field-error]]:mt-0">
      <Label htmlFor="datetime-picker-deadline">Deadline</Label>
      <DateTimePicker
        id="datetime-picker-deadline"
        error="Choose a deadline that is later than the start time."
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Inline validation stays beside the control so the issue and resolution are clear in context. The trigger exposes `aria-invalid` and associates the visible message with `aria-describedby` and `aria-errormessage` automatically.',
      },
    },
  },
};
