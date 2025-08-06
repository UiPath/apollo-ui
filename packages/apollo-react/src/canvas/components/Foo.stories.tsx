import type { Meta, StoryObj } from '@storybook/react';
import { Foo } from './Foo';

const meta: Meta<typeof Foo> = {
  title: 'Canvas/Components/Foo',
  component: Foo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const InContainer: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', border: '1px solid red', borderRadius: '8px' }}>
        <Story />
      </div>
    ),
  ],
};

export const WithCustomStyling: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: '#f0f0f0', padding: '16px' }}>
        <Story />
      </div>
    ),
  ],
};