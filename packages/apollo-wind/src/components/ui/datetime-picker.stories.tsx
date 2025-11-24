import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DateTimePicker } from "./datetime-picker";

const meta = {
  title: "Design System/Forms/DateTime Picker",
  component: DateTimePicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DateTimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
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

export const WithInitialValue: Story = {
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

export const With12HourFormat: Story = {
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

export const Disabled: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <div className="w-[400px]">
        <DateTimePicker value={date} onValueChange={setDate} disabled />
      </div>
    );
  },
};

export const CustomPlaceholder: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    return (
      <div className="w-[400px]">
        <DateTimePicker value={date} onValueChange={setDate} placeholder="When should we meet?" />
      </div>
    );
  },
};

export const InForm: Story = {
  render: () => {
    const [meetingDate, setMeetingDate] = useState<Date | undefined>();
    const [deadline, setDeadline] = useState<Date | undefined>();

    return (
      <div className="w-[400px] space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Meeting Date</label>
          <DateTimePicker
            value={meetingDate}
            onValueChange={setMeetingDate}
            placeholder="Select meeting date and time"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Project Deadline</label>
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
