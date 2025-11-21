import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = {
  title: "Design System/Forms/Checkbox",
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
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="disabled" disabled />
      <Label htmlFor="disabled">Disabled checkbox</Label>
    </div>
  ),
};

export const DisabledChecked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="disabled-checked" disabled defaultChecked />
      <Label htmlFor="disabled-checked">Disabled and checked</Label>
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox id="marketing" />
        <Label htmlFor="marketing">Marketing emails</Label>
      </div>
      <p className="text-sm text-muted-foreground pl-6">
        Receive emails about new products, features, and more.
      </p>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="font-medium text-sm">Notification preferences</div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="all" defaultChecked />
          <Label htmlFor="all">All notifications</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="email" defaultChecked />
          <Label htmlFor="email">Email notifications</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="push" />
          <Label htmlFor="push">Push notifications</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="sms" />
          <Label htmlFor="sms">SMS notifications</Label>
        </div>
      </div>
    </div>
  ),
};
