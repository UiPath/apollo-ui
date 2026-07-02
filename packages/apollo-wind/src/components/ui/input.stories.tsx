import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search } from 'lucide-react';
import { Input } from './input';
import { Label } from './label';

const meta = {
  title: 'Components/Core/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'ghost'],
      description:
        'Visual style. Ghost removes the border and sets a surface background, suited for compact panel inputs.',
    },
    size: {
      control: 'select',
      options: ['default', 'xs'],
      description: 'Height and text size. xs (24px) is for compact toolbar or panel search fields.',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
} satisfies Story;

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const WithValue: Story = {
  args: {
    value: 'Pre-filled value',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'email@example.com',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    placeholder: 'Search...',
  },
};

export const CompactSearch: Story = {
  render: () => (
    <div className="relative flex items-center">
      <Search size={12} className="pointer-events-none absolute left-2 text-muted-foreground" />
      <Input
        type="text"
        variant="ghost"
        size="xs"
        placeholder="Search fields..."
        className="w-36 pl-6 focus-visible:ring-0"
      />
    </div>
  ),
};
