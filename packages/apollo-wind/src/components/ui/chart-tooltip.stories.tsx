import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { chartTheme } from './chart-palette';

const meta = {
  title: 'Components/Charts/Tooltips',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const data = [
  { month: 'Jan', revenue: 4500, expenses: 2800 },
  { month: 'Feb', revenue: 5200, expenses: 3100 },
  { month: 'Mar', revenue: 4800, expenses: 2900 },
  { month: 'Apr', revenue: 6100, expenses: 3400 },
  { month: 'May', revenue: 5800, expenses: 3200 },
  { month: 'Jun', revenue: 7200, expenses: 3800 },
];

// ============================================================================
// Dot indicator
// ============================================================================

const dotConfig = {
  revenue: { label: 'Revenue', theme: chartTheme[3] },
  expenses: { label: 'Expenses', theme: chartTheme[5] },
} satisfies ChartConfig;

export const DotIndicator: Story = {
  render: () => (
    <Card className="border-border-subtle bg-surface max-w-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Dot indicator</CardTitle>
        <CardDescription className="text-foreground-muted">
          Default dot-style tooltip indicator
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={dotConfig}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};

// ============================================================================
// Line indicator
// ============================================================================

const lineConfig = {
  revenue: { label: 'Revenue', theme: chartTheme[1] },
  expenses: { label: 'Expenses', theme: chartTheme[4] },
} satisfies ChartConfig;

export const LineIndicator: Story = {
  render: () => (
    <Card className="border-border-subtle bg-surface max-w-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Line indicator</CardTitle>
        <CardDescription className="text-foreground-muted">
          Vertical line-style tooltip indicator
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={lineConfig}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};

// ============================================================================
// Dashed indicator
// ============================================================================

const dashedConfig = {
  revenue: { label: 'Revenue', theme: chartTheme[2] },
  expenses: { label: 'Expenses', theme: chartTheme[5] },
} satisfies ChartConfig;

export const DashedIndicator: Story = {
  render: () => (
    <Card className="border-border-subtle bg-surface max-w-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Dashed indicator</CardTitle>
        <CardDescription className="text-foreground-muted">
          Dashed border-style tooltip indicator
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={dashedConfig}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};
