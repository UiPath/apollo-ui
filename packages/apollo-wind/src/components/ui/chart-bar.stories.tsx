import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const meta = {
  title: 'Components/Charts/Bar Chart',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Vertical
// ============================================================================

const verticalData = [
  { month: 'Jan', desktop: 186, mobile: 80 },
  { month: 'Feb', desktop: 305, mobile: 200 },
  { month: 'Mar', desktop: 237, mobile: 120 },
  { month: 'Apr', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'Jun', desktop: 214, mobile: 140 },
];

const verticalConfig = {
  desktop: { label: 'Desktop', theme: { dark: '#22d3ee', light: '#0891b2' } },
  mobile: { label: 'Mobile', theme: { dark: '#818cf8', light: '#4f46e5' } },
} satisfies ChartConfig;

export const Vertical: Story = {
  render: () => (
    <Card className="border-border-subtle bg-surface max-w-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Bar chart</CardTitle>
        <CardDescription className="text-foreground-muted">
          Visitors by device — January to June 2026
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={verticalConfig}>
          <BarChart data={verticalData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};

// ============================================================================
// Horizontal
// ============================================================================

const horizontalData = [
  { category: 'React', value: 42 },
  { category: 'Vue', value: 28 },
  { category: 'Angular', value: 19 },
  { category: 'Svelte', value: 15 },
  { category: 'Solid', value: 8 },
];

const horizontalConfig = {
  value: { label: 'Popularity %', theme: { dark: '#a78bfa', light: '#7c3aed' } },
} satisfies ChartConfig;

export const Horizontal: Story = {
  render: () => (
    <Card className="border-border-subtle bg-surface max-w-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Horizontal bar chart</CardTitle>
        <CardDescription className="text-foreground-muted">
          Framework popularity — developer survey 2026
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={horizontalConfig} className="aspect-auto h-[250px] w-full">
          <BarChart data={horizontalData} layout="vertical" margin={{ left: 24, right: 24 }}>
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={60}
            />
            <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};

// ============================================================================
// Interactive
// ============================================================================

const interactiveData = [
  { date: '2026-01-01', desktop: 222, mobile: 150 },
  { date: '2026-01-02', desktop: 97, mobile: 180 },
  { date: '2026-01-03', desktop: 167, mobile: 120 },
  { date: '2026-01-04', desktop: 242, mobile: 260 },
  { date: '2026-01-05', desktop: 373, mobile: 290 },
  { date: '2026-01-06', desktop: 301, mobile: 340 },
  { date: '2026-01-07', desktop: 245, mobile: 180 },
  { date: '2026-01-08', desktop: 409, mobile: 320 },
  { date: '2026-01-09', desktop: 59, mobile: 110 },
  { date: '2026-01-10', desktop: 261, mobile: 190 },
  { date: '2026-01-11', desktop: 327, mobile: 350 },
  { date: '2026-01-12', desktop: 292, mobile: 210 },
];

const interactiveConfig = {
  desktop: { label: 'Desktop', theme: { dark: '#22d3ee', light: '#0891b2' } },
  mobile: { label: 'Mobile', theme: { dark: '#818cf8', light: '#4f46e5' } },
} satisfies ChartConfig;

function InteractiveBarChart() {
  const [activeKey, setActiveKey] = React.useState<'desktop' | 'mobile'>('desktop');
  const total = React.useMemo(
    () => ({
      desktop: interactiveData.reduce((acc, d) => acc + d.desktop, 0),
      mobile: interactiveData.reduce((acc, d) => acc + d.mobile, 0),
    }),
    []
  );

  return (
    <Card className="border-border-subtle bg-surface max-w-xl">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-border-subtle p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle className="text-foreground">Interactive bar chart</CardTitle>
          <CardDescription className="text-foreground-muted">
            Daily visitors — click a toggle to filter
          </CardDescription>
        </div>
        <div className="flex">
          {(['desktop', 'mobile'] as const).map((key) => (
            <button
              type="button"
              key={key}
              data-active={activeKey === key}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-border-subtle px-6 py-4 text-left even:border-l data-[active=true]:bg-surface-overlay sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
              onClick={() => setActiveKey(key)}
            >
              <span className="text-xs text-foreground-muted">{interactiveConfig[key].label}</span>
              <span className="text-lg font-bold leading-none text-foreground sm:text-3xl">
                {total[key].toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={interactiveConfig} className="aspect-auto h-[250px] w-full">
          <BarChart data={interactiveData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(v: string) =>
                    new Date(v).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  }
                />
              }
            />
            <Bar dataKey={activeKey} fill={`var(--color-${activeKey})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveBarChart />,
};
