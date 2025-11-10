import type { Meta, StoryObj } from '@storybook/react';
import { cn } from '@uipath/apollo-wind-ui';

const meta = {
  title: 'Utils/cn',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <div className={cn('p-4', 'bg-primary', 'text-primary-foreground')}>
      Example of cn() utility merging classes
    </div>
  ),
};

export const ConditionalClasses: Story = {
  render: () => {
    const isActive = true;
    return (
      <div className={cn('p-4', 'border', isActive && 'bg-accent', 'rounded')}>
        Conditional classes example
      </div>
    );
  },
};

export const TailwindMerge: Story = {
  render: () => (
    <div className={cn('px-2 py-1', 'px-4')}>Tailwind merge: px-2 is overridden by px-4</div>
  ),
};
