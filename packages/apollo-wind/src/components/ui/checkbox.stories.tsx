import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./checkbox";
import { Label } from "./label";
import { Row, Column } from "./layout";

const meta = {
  title: "Design System/Core/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithLabel: Story = {
  render: () => (
    <Row gap={2} align="center">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </Row>
  ),
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  render: () => (
    <Row gap={2} align="center">
      <Checkbox id="disabled" disabled />
      <Label htmlFor="disabled">Disabled checkbox</Label>
    </Row>
  ),
};

export const DisabledChecked: Story = {
  render: () => (
    <Row gap={2} align="center">
      <Checkbox id="disabled-checked" disabled defaultChecked />
      <Label htmlFor="disabled-checked">Disabled and checked</Label>
    </Row>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Column gap={2}>
      <Row gap={2} align="center">
        <Checkbox id="marketing" />
        <Label htmlFor="marketing">Marketing emails</Label>
      </Row>
      <p className="text-sm text-muted-foreground pl-6">
        Receive emails about new products, features, and more.
      </p>
    </Column>
  ),
};

export const Group: Story = {
  render: () => (
    <Column gap={3}>
      <div className="font-medium text-sm">Notification preferences</div>
      <Column gap={2}>
        <Row gap={2} align="center">
          <Checkbox id="all" defaultChecked />
          <Label htmlFor="all">All notifications</Label>
        </Row>
        <Row gap={2} align="center">
          <Checkbox id="email" defaultChecked />
          <Label htmlFor="email">Email notifications</Label>
        </Row>
        <Row gap={2} align="center">
          <Checkbox id="push" />
          <Label htmlFor="push">Push notifications</Label>
        </Row>
        <Row gap={2} align="center">
          <Checkbox id="sms" />
          <Label htmlFor="sms">SMS notifications</Label>
        </Row>
      </Column>
    </Column>
  ),
};
