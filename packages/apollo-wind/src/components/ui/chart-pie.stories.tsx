import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Label, Pie, PieChart } from 'recharts';
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
  title: 'Components/Charts/Pie Chart',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Donut
// ============================================================================

const donutData = [
  { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
  { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { browser: 'firefox', visitors: 287, fill: 'var(--color-firefox)' },
  { browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
  { browser: 'other', visitors: 190, fill: 'var(--color-other)' },
];

const donutConfig = {
  visitors: { label: 'Visitors' },
  chrome: { label: 'Chrome', theme: chartTheme[1] },
  safari: { label: 'Safari', theme: chartTheme[2] },
  firefox: { label: 'Firefox', theme: chartTheme[3] },
  edge: { label: 'Edge', theme: chartTheme[4] },
  other: { label: 'Other', theme: chartTheme[5] },
} satisfies ChartConfig;

function DonutChart() {
  const totalVisitors = React.useMemo(() => donutData.reduce((acc, d) => acc + d.visitors, 0), []);

  return (
    <Card className="border-border-subtle bg-surface max-w-sm">
      <CardHeader>
        <CardTitle className="text-foreground">Donut chart</CardTitle>
        <CardDescription className="text-foreground-muted">
          Browser market share — January to June 2026
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={donutConfig} className="mx-auto aspect-square max-h-[300px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={donutData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Visitors
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="browser" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export const Donut: Story = {
  render: () => <DonutChart />,
};

// ============================================================================
// Simple
// ============================================================================

const simpleData = [
  { segment: 'direct', value: 420, fill: 'var(--color-direct)' },
  { segment: 'organic', value: 315, fill: 'var(--color-organic)' },
  { segment: 'referral', value: 180, fill: 'var(--color-referral)' },
  { segment: 'social', value: 135, fill: 'var(--color-social)' },
];

const simpleConfig = {
  value: { label: 'Traffic' },
  direct: { label: 'Direct', theme: chartTheme[1] },
  organic: { label: 'Organic', theme: chartTheme[3] },
  referral: { label: 'Referral', theme: chartTheme[4] },
  social: { label: 'Social', theme: chartTheme[5] },
} satisfies ChartConfig;

export const Simple: Story = {
  render: () => (
    <Card className="border-border-subtle bg-surface max-w-sm">
      <CardHeader>
        <CardTitle className="text-foreground">Pie chart</CardTitle>
        <CardDescription className="text-foreground-muted">
          Traffic sources — January to June 2026
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={simpleConfig} className="mx-auto aspect-square max-h-[300px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={simpleData}
              dataKey="value"
              nameKey="segment"
              strokeWidth={2}
              label={({ segment, percent }) =>
                `${simpleConfig[segment as keyof typeof simpleConfig]?.label ?? segment} ${(percent * 100).toFixed(0)}%`
              }
            />
            <ChartLegend content={<ChartLegendContent nameKey="segment" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};
