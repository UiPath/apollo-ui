import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Spinner } from "./spinner";

const meta: Meta<typeof Spinner> = {
  title: "Design System/Feedback/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "default", "lg", "xl"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

export const ExtraLarge: Story = {
  args: {
    size: "xl",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner size="sm" />
      <Spinner size="default" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </div>
  ),
};

export const WithLabel: Story = {
  args: {
    label: "Processing your request",
    showLabel: true,
  },
};

export const InButton: Story = {
  render: () => (
    <Button disabled>
      <Spinner size="sm" className="mr-2" />
      Loading...
    </Button>
  ),
};

export const Centered: Story = {
  render: () => (
    <div className="flex h-40 items-center justify-center rounded-md border">
      <Spinner size="lg" />
    </div>
  ),
};

export const FullPage: Story = {
  render: () => (
    <div className="flex h-[300px] w-full flex-col items-center justify-center gap-4 rounded-md border">
      <Spinner size="xl" />
      <p className="text-sm text-muted-foreground">Loading content...</p>
    </div>
  ),
};
