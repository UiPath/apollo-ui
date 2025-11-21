import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DatePicker, DateRangePicker } from "./date-picker";
import { Label } from "./label";

const meta = {
  title: "Design System/Forms/Date Picker",
  component: DatePicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>();

    return <DatePicker value={date} onValueChange={setDate} />;
  },
};

export const WithLabel: Story = {
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

export const WithValue: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return <DatePicker value={date} onValueChange={setDate} />;
  },
};

export const Disabled: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return <DatePicker value={date} onValueChange={setDate} disabled />;
  },
};

export const DateRange: Story = {
  render: () => {
    const [dateRange, setDateRange] = useState<{
      from: Date | undefined;
      to?: Date | undefined;
    }>();

    return <DateRangePicker value={dateRange} onValueChange={setDateRange} />;
  },
};

export const DateRangeWithValue: Story = {
  render: () => {
    const [dateRange, setDateRange] = useState<{
      from: Date | undefined;
      to?: Date | undefined;
    }>({
      from: new Date(),
      to: new Date(new Date().setDate(new Date().getDate() + 7)),
    });

    return <DateRangePicker value={dateRange} onValueChange={setDateRange} />;
  },
};
