import type { Meta, StoryObj } from '@storybook/react-vite';
import { Check, CreditCard, Info, Loader2, Mail, Search } from 'lucide-react';
import { FlowInput, FlowInputAddon, FlowInputGroup } from './FlowInput';

// Classes to reset FlowInput container styles when used inside a FlowInputGroup
const groupInputCn = 'flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0';

const meta = {
  title: 'Components/UiPath/Flow Input',
  component: FlowInput,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof FlowInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: 'Enter text...' },
};

export const Disabled: Story = {
  args: { placeholder: 'Disabled input', disabled: true },
};

export const WithValue: Story = {
  args: { defaultValue: 'https://x.com/shadcn' },
};

export const WithLeadingIcon: StoryObj = {
  render: () => (
    <FlowInputGroup className="w-[280px]">
      <FlowInputAddon><Search /></FlowInputAddon>
      <FlowInput className={groupInputCn} placeholder="Search..." />
      <FlowInputAddon>12 results</FlowInputAddon>
    </FlowInputGroup>
  ),
};

export const WithLeadingText: StoryObj = {
  render: () => (
    <FlowInputGroup className="w-[280px]">
      <FlowInputAddon>https://</FlowInputAddon>
      <FlowInput className={groupInputCn} placeholder="example.com" />
      <FlowInputAddon><Info /></FlowInputAddon>
    </FlowInputGroup>
  ),
};

export const WithTrailingStatus: StoryObj = {
  render: () => (
    <FlowInputGroup className="w-[280px]">
      <FlowInputAddon>https://</FlowInputAddon>
      <FlowInput className={groupInputCn} defaultValue="@shadcn" />
      <FlowInputAddon>
        <span className="flex size-4 items-center justify-center rounded-full bg-surface-hover">
          <Check className="size-3 text-foreground" />
        </span>
      </FlowInputAddon>
    </FlowInputGroup>
  ),
};

export const WithLeadingIconOnly: StoryObj = {
  render: () => (
    <FlowInputGroup className="w-[280px]">
      <FlowInputAddon><Mail /></FlowInputAddon>
      <FlowInput className={groupInputCn} placeholder="Enter your email..." />
    </FlowInputGroup>
  ),
};

export const WithCurrencyAddons: StoryObj = {
  render: () => (
    <FlowInputGroup className="w-[280px]">
      <FlowInputAddon>$</FlowInputAddon>
      <FlowInput className={groupInputCn} placeholder="0.00" />
      <FlowInputAddon>USD</FlowInputAddon>
    </FlowInputGroup>
  ),
};

export const WithCreditCard: StoryObj = {
  render: () => (
    <FlowInputGroup className="w-[280px]">
      <FlowInputAddon><CreditCard /></FlowInputAddon>
      <FlowInput className={groupInputCn} placeholder="Card number" />
      <FlowInputAddon><Check /></FlowInputAddon>
    </FlowInputGroup>
  ),
};

export const Loading: StoryObj = {
  render: () => (
    <FlowInputGroup className="w-[280px]">
      <FlowInput className={groupInputCn} placeholder="Searching..." disabled />
      <FlowInputAddon><Loader2 className="animate-spin" /></FlowInputAddon>
    </FlowInputGroup>
  ),
};
