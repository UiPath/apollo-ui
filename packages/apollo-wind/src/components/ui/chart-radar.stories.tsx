import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';
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
  title: 'Components/Charts/Radar Chart',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Multi-series
// ============================================================================

const multiData = [
  { metric: 'Speed', desktop: 86, mobile: 65 },
  { metric: 'Reliability', desktop: 92, mobile: 78 },
  { metric: 'Scalability', desktop: 78, mobile: 60 },
  { metric: 'Security', desktop: 95, mobile: 88 },
  { metric: 'Usability', desktop: 72, mobile: 90 },
  { metric: 'Support', desktop: 81, mobile: 75 },
];

const multiConfig = {
  desktop: { label: 'Desktop', theme: { dark: '#22d3ee', light: '#0891b2' } },
  mobile: { label: 'Mobile', theme: { dark: '#818cf8', light: '#4f46e5' } },
} satisfies ChartConfig;

export const MultiSeries: Story = {
  render: () => (
    <Card className="border-border-subtle bg-surface max-w-sm">
      <CardHeader>
        <CardTitle className="text-foreground">Radar chart</CardTitle>
        <CardDescription className="text-foreground-muted">
          Platform performance across 6 dimensions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={multiConfig} className="mx-auto aspect-square max-h-[300px]">
          <RadarChart data={multiData}>
            <ChartTooltip content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="metric" />
            <PolarGrid />
            <Radar
              dataKey="desktop"
              fill="var(--color-desktop)"
              fillOpacity={0.6}
              stroke="var(--color-desktop)"
            />
            <Radar
              dataKey="mobile"
              fill="var(--color-mobile)"
              fillOpacity={0.6}
              stroke="var(--color-mobile)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};

// ============================================================================
// Dots
// ============================================================================

const dotsData = [
  { skill: 'HTML', level: 95 },
  { skill: 'CSS', level: 88 },
  { skill: 'JS', level: 92 },
  { skill: 'React', level: 85 },
  { skill: 'Node', level: 70 },
  { skill: 'SQL', level: 65 },
];

const dotsConfig = {
  level: { label: 'Proficiency', theme: { dark: '#34d399', light: '#059669' } },
} satisfies ChartConfig;

export const Dots: Story = {
  render: () => (
    <Card className="border-border-subtle bg-surface max-w-sm">
      <CardHeader>
        <CardTitle className="text-foreground">Radar chart — dots</CardTitle>
        <CardDescription className="text-foreground-muted">
          Developer skill proficiency with dot markers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={dotsConfig} className="mx-auto aspect-square max-h-[300px]">
          <RadarChart data={dotsData}>
            <ChartTooltip content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="skill" />
            <PolarGrid />
            <Radar
              dataKey="level"
              fill="var(--color-level)"
              fillOpacity={0.3}
              stroke="var(--color-level)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-level)', fillOpacity: 1 }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};
