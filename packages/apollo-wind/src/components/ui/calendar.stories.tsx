import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Calendar } from "./calendar";

const meta: Meta<typeof Calendar> = {
  title: "Design System/Data Display/Calendar",
  component: Calendar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
      <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
    );
  },
};
