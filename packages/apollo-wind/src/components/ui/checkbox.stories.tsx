import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './checkbox';
import { Label } from './label';
import { Row, Column } from './layout';

const meta = {
  title: 'Components/Core/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithLabel = {
  render: () => (
    <Row gap={2} align="center">
      <Checkbox id="terms" />
      <Label htmlFor="terms" className="future:text-foreground future:font-normal">
        Accept terms and conditions
      </Label>
    </Row>
  ),
} satisfies Story;

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled = {
  render: () => (
    <Row gap={2} align="center">
      <Checkbox id="disabled" disabled />
      <Label htmlFor="disabled" className="future:font-normal future:text-foreground">
        Disabled checkbox
      </Label>
    </Row>
  ),
} satisfies Story;

export const DisabledChecked = {
  render: () => (
    <Row gap={2} align="center">
      <Checkbox id="disabled-checked" disabled defaultChecked />
      <Label htmlFor="disabled-checked" className="future:font-normal future:text-foreground">
        Disabled and checked
      </Label>
    </Row>
  ),
} satisfies Story;

export const WithDescription = {
  render: () => (
    <Column gap={2}>
      <Row gap={2} align="center">
        <Checkbox id="marketing" />
        <Label htmlFor="marketing" className="future:font-normal future:text-foreground">
          Marketing emails
        </Label>
      </Row>
      <p className="text-sm text-muted-foreground pl-6">
        Receive emails about new products, features, and more.
      </p>
    </Column>
  ),
} satisfies Story;

export const Group = {
  render: () => (
    <Column gap={3}>
      <div className="font-medium text-sm">Notification preferences</div>
      <Column gap={2}>
        <Row gap={2} align="center">
          <Checkbox id="all" defaultChecked />
          <Label htmlFor="all" className="future:font-normal future:text-foreground">
            All notifications
          </Label>
        </Row>
        <Row gap={2} align="center">
          <Checkbox id="email" defaultChecked />
          <Label htmlFor="email" className="future:font-normal future:text-foreground">
            Email notifications
          </Label>
        </Row>
        <Row gap={2} align="center">
          <Checkbox id="push" />
          <Label htmlFor="push" className="future:font-normal future:text-foreground">
            Push notifications
          </Label>
        </Row>
        <Row gap={2} align="center">
          <Checkbox id="sms" />
          <Label htmlFor="sms" className="future:font-normal future:text-foreground">
            SMS notifications
          </Label>
        </Row>
      </Column>
    </Column>
  ),
} satisfies Story;
