import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { chartTheme } from './chart-palette';

const meta = {
  title: 'Components/Charts/Area Chart',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stacked
// ============================================================================

const stackedData = [
  { month: 'Jan', desktop: 186, mobile: 80 },
  { month: 'Feb', desktop: 305, mobile: 200 },
  { month: 'Mar', desktop: 237, mobile: 120 },
  { month: 'Apr', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'Jun', desktop: 214, mobile: 140 },
];

const stackedConfig = {
  desktop: { label: 'Desktop', theme: chartTheme[1] },
  mobile: { label: 'Mobile', theme: chartTheme[2] },
} satisfies ChartConfig;

export const Stacked: Story = {
  render: () => (
    <Card className="border-border-subtle bg-surface max-w-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Stacked area chart</CardTitle>
        <CardDescription className="text-foreground-muted">
          Total visitors by device — January to June 2026
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={stackedConfig}>
          <AreaChart data={stackedData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <defs>
              <linearGradient id="stackedFillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="stackedFillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#stackedFillMobile)"
              fillOpacity={0.4}
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#stackedFillDesktop)"
              fillOpacity={0.4}
              stroke="var(--color-desktop)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};

// ============================================================================
// Step
// ============================================================================

const stepData = [
  { month: 'Jan', pageViews: 1200, sessions: 820 },
  { month: 'Feb', pageViews: 1450, sessions: 960 },
  { month: 'Mar', pageViews: 1100, sessions: 740 },
  { month: 'Apr', pageViews: 1680, sessions: 1100 },
  { month: 'May', pageViews: 1520, sessions: 980 },
  { month: 'Jun', pageViews: 1790, sessions: 1250 },
];

const stepConfig = {
  pageViews: { label: 'Page views', theme: chartTheme[1] },
  sessions: { label: 'Sessions', theme: chartTheme[4] },
} satisfies ChartConfig;

export const Step: Story = {
  render: () => (
    <Card className="border-border-subtle bg-surface max-w-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Step area chart</CardTitle>
        <CardDescription className="text-foreground-muted">
          Page views and sessions with step interpolation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={stepConfig}>
          <AreaChart data={stepData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <defs>
              <linearGradient id="stepFillPageViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-pageViews)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-pageViews)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="stepFillSessions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-sessions)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-sessions)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              dataKey="sessions"
              type="step"
              fill="url(#stepFillSessions)"
              fillOpacity={0.4}
              stroke="var(--color-sessions)"
            />
            <Area
              dataKey="pageViews"
              type="step"
              fill="url(#stepFillPageViews)"
              fillOpacity={0.4}
              stroke="var(--color-pageViews)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};
