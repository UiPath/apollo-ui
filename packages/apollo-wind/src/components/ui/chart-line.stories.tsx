import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const meta = {
  title: 'Components/Charts/Line Chart',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Multi-line
// ============================================================================

const multiData = [
  { month: 'Jan', desktop: 186, mobile: 80, tablet: 45 },
  { month: 'Feb', desktop: 305, mobile: 200, tablet: 98 },
  { month: 'Mar', desktop: 237, mobile: 120, tablet: 65 },
  { month: 'Apr', desktop: 73, mobile: 190, tablet: 140 },
  { month: 'May', desktop: 209, mobile: 130, tablet: 87 },
  { month: 'Jun', desktop: 214, mobile: 140, tablet: 112 },
];

const multiConfig = {
  desktop: { label: 'Desktop', theme: { dark: '#22d3ee', light: '#0891b2' } },
  mobile: { label: 'Mobile', theme: { dark: '#818cf8', light: '#4f46e5' } },
  tablet: { label: 'Tablet', theme: { dark: '#34d399', light: '#059669' } },
} satisfies ChartConfig;

export const MultiLine: Story = {
  render: () => (
    <Card className="border-border-subtle bg-surface max-w-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Multi-line chart</CardTitle>
        <CardDescription className="text-foreground-muted">
          Visitors across three device types — January to June 2026
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={multiConfig}>
          <LineChart data={multiData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="desktop"
              type="monotone"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-desktop)', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              dataKey="mobile"
              type="monotone"
              stroke="var(--color-mobile)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-mobile)', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              dataKey="tablet"
              type="monotone"
              stroke="var(--color-tablet)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-tablet)', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};

// ============================================================================
// Curved
// ============================================================================

const curvedData = [
  { month: 'Jan', revenue: 2400, profit: 1200 },
  { month: 'Feb', revenue: 1398, profit: 900 },
  { month: 'Mar', revenue: 3800, profit: 2100 },
  { month: 'Apr', revenue: 3908, profit: 2400 },
  { month: 'May', revenue: 4800, profit: 2800 },
  { month: 'Jun', revenue: 3490, profit: 1900 },
];

const curvedConfig = {
  revenue: { label: 'Revenue', theme: { dark: '#fbbf24', light: '#d97706' } },
  profit: { label: 'Profit', theme: { dark: '#34d399', light: '#059669' } },
} satisfies ChartConfig;

export const Curved: Story = {
  render: () => (
    <Card className="border-border-subtle bg-surface max-w-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Curved line chart</CardTitle>
        <CardDescription className="text-foreground-muted">
          Revenue vs profit with natural curve interpolation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={curvedConfig}>
          <LineChart data={curvedData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="revenue"
              type="natural"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="profit"
              type="natural"
              stroke="var(--color-profit)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};
