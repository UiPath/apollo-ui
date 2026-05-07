import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Cell, Label, RadialBar, RadialBarChart } from 'recharts';
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
  title: 'Components/Charts/Radial Chart',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Bar
// ============================================================================

const barData = [
  { name: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { name: 'firefox', visitors: 287, fill: 'var(--color-firefox)' },
  { name: 'edge', visitors: 173, fill: 'var(--color-edge)' },
  { name: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
];

const barConfig = {
  visitors: { label: 'Visitors' },
  chrome: { label: 'Chrome', theme: chartTheme[1] },
  safari: { label: 'Safari', theme: chartTheme[2] },
  firefox: { label: 'Firefox', theme: chartTheme[3] },
  edge: { label: 'Edge', theme: chartTheme[4] },
} satisfies ChartConfig;

export const Bar: Story = {
  render: () => (
    <Card className="border-border-subtle bg-surface max-w-sm">
      <CardHeader>
        <CardTitle className="text-foreground">Radial bar chart</CardTitle>
        <CardDescription className="text-foreground-muted">
          Browser visitors as stacked radial segments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={barConfig} className="mx-auto aspect-square max-h-[300px]">
          <RadialBarChart
            data={barData}
            startAngle={-90}
            endAngle={380}
            innerRadius={30}
            outerRadius={110}
          >
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
            <RadialBar dataKey="visitors" background>
              {barData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </RadialBar>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};

// ============================================================================
// Gauge
// ============================================================================

const GAUGE_VALUE = 72;
const gaugeData = [{ name: 'progress', value: GAUGE_VALUE, fill: 'var(--color-progress)' }];

const gaugeConfig = {
  progress: { label: 'Completion', theme: chartTheme[1] },
} satisfies ChartConfig;

export const Gauge: Story = {
  render: () => (
    <Card className="border-border-subtle bg-surface max-w-sm">
      <CardHeader>
        <CardTitle className="text-foreground">Radial gauge</CardTitle>
        <CardDescription className="text-foreground-muted">
          Sprint completion progress — {GAUGE_VALUE}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={gaugeConfig} className="mx-auto aspect-square max-h-[300px]">
          <RadialBarChart
            data={gaugeData}
            startAngle={180}
            endAngle={180 - 360 * (GAUGE_VALUE / 100)}
            innerRadius={80}
            outerRadius={110}
          >
            <RadialBar dataKey="value" background cornerRadius={10}>
              <Cell fill="var(--color-progress)" />
            </RadialBar>
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
                        className="fill-foreground text-4xl font-bold"
                      >
                        {GAUGE_VALUE}%
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 28}
                        className="fill-muted-foreground text-sm"
                      >
                        Completed
                      </tspan>
                    </text>
                  );
                }
                return null;
              }}
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};
