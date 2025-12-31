import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, CreditCard, DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { StatsCard } from './stats-card';

const meta = {
  title: 'Design System/Data Display/Stats Card',
  component: StatsCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Total Revenue',
    value: '$45,231.89',
    description: 'from last month',
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Total Revenue',
    value: '$45,231.89',
    description: 'from last month',
    icon: <DollarSign className="h-4 w-4" />,
  },
};

export const WithTrendUp: Story = {
  args: {
    title: 'Total Revenue',
    value: '$45,231.89',
    icon: <DollarSign className="h-4 w-4" />,
    trend: {
      value: 20.1,
      label: 'from last month',
    },
  },
};

export const WithTrendDown: Story = {
  args: {
    title: 'Active Users',
    value: '2,350',
    icon: <Users className="h-4 w-4" />,
    trend: {
      value: -4.5,
      label: 'from last month',
    },
  },
};

export const PrimaryVariant: Story = {
  args: {
    title: 'Total Sales',
    value: '+12,234',
    description: 'this month',
    icon: <ShoppingCart className="h-4 w-4" />,
    variant: 'primary',
  },
};

export const SuccessVariant: Story = {
  args: {
    title: 'Growth Rate',
    value: '+32%',
    icon: <TrendingUp className="h-4 w-4" />,
    variant: 'success',
    trend: {
      value: 12.5,
      label: 'from Q1',
    },
  },
};

export const WarningVariant: Story = {
  args: {
    title: 'Pending Orders',
    value: '156',
    description: 'requires attention',
    icon: <Activity className="h-4 w-4" />,
    variant: 'warning',
  },
};

export const DangerVariant: Story = {
  args: {
    title: 'Failed Transactions',
    value: '23',
    description: 'in the last 24h',
    icon: <CreditCard className="h-4 w-4" />,
    variant: 'danger',
  },
};

export const Grid = {
  // @ts-expect-error - args not needed when using render, but Storybook requires it
  args: {},
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Revenue"
        value="$45,231.89"
        icon={<DollarSign className="h-4 w-4" />}
        trend={{ value: 20.1, label: 'from last month' }}
      />
      <StatsCard
        title="Subscriptions"
        value="+2,350"
        icon={<Users className="h-4 w-4" />}
        trend={{ value: 18.1, label: 'from last month' }}
      />
      <StatsCard
        title="Sales"
        value="+12,234"
        icon={<CreditCard className="h-4 w-4" />}
        trend={{ value: 19, label: 'from last month' }}
      />
      <StatsCard
        title="Active Now"
        value="+573"
        icon={<Activity className="h-4 w-4" />}
        trend={{ value: 20.1, direction: 'up' }}
        description="from last hour"
      />
    </div>
  ),
} satisfies Story;

export const MixedTrends = {
  // @ts-expect-error - args not needed when using render, but Storybook requires it
  args: {},
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatsCard
        title="Revenue"
        value="$54,239"
        icon={<DollarSign className="h-4 w-4" />}
        trend={{ value: 12.5, label: 'from last month' }}
      />
      <StatsCard
        title="Orders"
        value="1,429"
        icon={<ShoppingCart className="h-4 w-4" />}
        trend={{ value: -3.2, label: 'from last month' }}
      />
      <StatsCard
        title="Customers"
        value="8,459"
        icon={<Users className="h-4 w-4" />}
        trend={{ value: 8.1, label: 'from last month' }}
      />
    </div>
  ),
} satisfies Story;
