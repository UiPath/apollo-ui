import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Spinner } from "./spinner";
import { Row, Column } from "./layout";

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
    <Row align="center" gap={4}>
      <Spinner size="sm" />
      <Spinner size="default" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </Row>
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
    <Row h={40} align="center" justify="center" className="rounded-md border">
      <Spinner size="lg" />
    </Row>
  ),
};

export const FullPage: Story = {
  render: () => (
    <Column
      h="300px"
      w="full"
      align="center"
      justify="center"
      gap={4}
      className="rounded-md border"
    >
      <Spinner size="xl" />
      <p className="text-sm text-muted-foreground">Loading content...</p>
    </Column>
  ),
};
