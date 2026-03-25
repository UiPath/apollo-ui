import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from '@/components/ui/label';
import { FlowRadioGroup, FlowRadioGroupItem } from './FlowRadioGroup';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Components/UiPath/Flow Radio Group',
  component: FlowRadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FlowRadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  render: () => (
    <FlowRadioGroup defaultValue="comfortable">
      <div className="flex items-center gap-2">
        <FlowRadioGroupItem value="default" id="r1" />
        <Label htmlFor="r1">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <FlowRadioGroupItem value="comfortable" id="r2" />
        <Label htmlFor="r2">Comfortable</Label>
      </div>
      <div className="flex items-center gap-2">
        <FlowRadioGroupItem value="compact" id="r3" />
        <Label htmlFor="r3">Compact</Label>
      </div>
    </FlowRadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <FlowRadioGroup defaultValue="option-one">
      <div className="flex items-center gap-2">
        <FlowRadioGroupItem value="option-one" id="d1" />
        <Label htmlFor="d1">Option one</Label>
      </div>
      <div className="flex items-center gap-2">
        <FlowRadioGroupItem value="option-two" id="d2" disabled />
        <Label htmlFor="d2" className="opacity-50">
          Option two (disabled)
        </Label>
      </div>
    </FlowRadioGroup>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <FlowRadioGroup defaultValue="card">
      <div className="flex items-start gap-3">
        <FlowRadioGroupItem value="card" id="p1" className="mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="p1">Card</Label>
          <span className="text-xs text-foreground-subtle">Pay with credit or debit card.</span>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <FlowRadioGroupItem value="paypal" id="p2" className="mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="p2">Paypal</Label>
          <span className="text-xs text-foreground-subtle">Pay with your Paypal account.</span>
        </div>
      </div>
    </FlowRadioGroup>
  ),
};
