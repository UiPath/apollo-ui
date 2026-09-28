import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ChevronRight,
  Download,
  Loader2,
  Mail,
  Plus,
  Settings,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from './button';

const meta = {
  title: 'Components/Core/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'text'],
    },
    size: {
      control: 'select',
      options: ['lg', 'default', 'sm', 'xs', '2xs', '3xs', '4xs'],
    },
    icon: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
  },
};

export const Link: Story = {
  args: {
    children: 'Link',
    variant: 'link',
  },
};

export const LinkAsAnchor: Story = {
  name: 'Link as anchor',
  render: () => (
    <Button asChild variant="link" size="2xs">
      <a href="/documentation">View documentation</a>
    </Button>
  ),
};

export const Text: Story = {
  args: {
    children: 'Text',
    variant: 'text',
  },
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-row justify-center items-center gap-2">
      <Button size="lg">
        <Mail />
        Send email
      </Button>
      <Button>
        <Download />
        Download
      </Button>
      <Button size="sm">
        <Upload />
        Upload
      </Button>
      <Button size="xs">
        <Settings />
        Settings
      </Button>
      <Button size="2xs">
        <ChevronRight />
        More
      </Button>
      <Button variant="outline">
        <Loader2 className="animate-spin" />
        Loading...
      </Button>
      <Button variant="destructive" size="sm">
        <Trash2 />
        Delete
      </Button>
      <Button variant="ghost" size="sm">
        <Settings />
        Settings
      </Button>
      <Button variant="text" size="xs">
        <Plus />
        Add item
      </Button>
    </div>
  ),
};

const variants = [
  'default',
  'destructive',
  'outline',
  'secondary',
  'ghost',
  'link',
  'text',
] as const;
const sizes = ['lg', 'default', 'sm', 'xs', '2xs', '3xs', '4xs'] as const;

export const VariantSizeMatrix: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Text Buttons</h3>
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs text-muted-foreground font-normal" />
              {sizes.map((size) => (
                <th
                  key={size}
                  className="p-2 text-center text-xs text-muted-foreground font-normal"
                >
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant}>
                <td className="p-2 text-xs text-muted-foreground">{variant}</td>
                {sizes.map((size) => (
                  <td key={size} className="p-2">
                    <Button variant={variant} size={size}>
                      Button
                    </Button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Icon Buttons</h3>
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs text-muted-foreground font-normal" />
              {sizes.map((size) => (
                <th
                  key={size}
                  className="p-2 text-center text-xs text-muted-foreground font-normal"
                >
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant}>
                <td className="p-2 text-xs text-muted-foreground">{variant}</td>
                {sizes.map((size) => (
                  <td key={size} className="p-2">
                    <Button variant={variant} size={size} icon>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
};
