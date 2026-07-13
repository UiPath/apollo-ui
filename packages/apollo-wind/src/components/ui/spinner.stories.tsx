import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './button';
import { Column, Row } from './layout';
import { Spinner } from './spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Components/Feedback/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl'],
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'foreground', 'destructive'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
};

export const AllSizes = {
  render: () => (
    <Row align="center" gap={4}>
      <Spinner size="sm" />
      <Spinner size="default" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </Row>
  ),
} satisfies Story;
export const AllVariants = {
  render: () => (
    <Row align="center" gap={8}>
      <Column align="center" gap={2}>
        <Spinner variant="default" />
        <span className="text-xs text-muted-foreground">Default</span>
      </Column>
      <Column align="center" gap={2}>
        <Spinner variant="foreground" />
        <span className="text-xs text-muted-foreground">Foreground</span>
      </Column>
      <Column align="center" gap={2}>
        <Spinner variant="primary" />
        <span className="text-xs text-muted-foreground">Primary</span>
      </Column>
    </Row>
  ),
} satisfies Story;

export const WithLabel: Story = {
  args: {
    label: 'Processing your request',
    showLabel: true,
  },
};

export const InButton = {
  render: () => (
    <Button disabled>
      <Spinner size="sm" className="mr-2" />
      Loading...
    </Button>
  ),
} satisfies Story;

export const Centered = {
  render: () => (
    <Row h={40} align="center" justify="center" className="rounded-md border">
      <Spinner size="lg" />
    </Row>
  ),
} satisfies Story;

export const FullPage = {
  render: () => (
    <Column
      w="full"
      align="center"
      justify="center"
      gap={4}
      className="h-[300px] rounded-md border"
    >
      <Spinner size="xl" />
      <p className="text-sm text-muted-foreground">Loading content...</p>
    </Column>
  ),
} satisfies Story;
