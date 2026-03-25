import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from '@/components/ui/label';
import { FlowCheckbox } from './FlowCheckbox';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Components/UiPath/Flow Checkbox',
  component: FlowCheckbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FlowCheckbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <FlowCheckbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <FlowCheckbox id="disabled" disabled />
      <Label htmlFor="disabled">Disabled</Label>
    </div>
  ),
};

export const DisabledChecked: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <FlowCheckbox id="disabled-checked" disabled defaultChecked />
      <Label htmlFor="disabled-checked">Disabled and checked</Label>
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <FlowCheckbox id="marketing" />
        <Label htmlFor="marketing">Marketing emails</Label>
      </div>
      <p className="pl-6 text-sm text-foreground-subtle">
        Receive emails about new products, features, and more.
      </p>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-foreground">Notification preferences</span>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <FlowCheckbox id="all" defaultChecked />
          <Label htmlFor="all">All notifications</Label>
        </div>
        <div className="flex items-center gap-2">
          <FlowCheckbox id="email" defaultChecked />
          <Label htmlFor="email">Email notifications</Label>
        </div>
        <div className="flex items-center gap-2">
          <FlowCheckbox id="push" />
          <Label htmlFor="push">Push notifications</Label>
        </div>
        <div className="flex items-center gap-2">
          <FlowCheckbox id="sms" />
          <Label htmlFor="sms">SMS notifications</Label>
        </div>
      </div>
    </div>
  ),
};
