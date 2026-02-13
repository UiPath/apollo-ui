import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from 'recharts';

import { MaestroTemplate } from './template-maestro';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Templates/Maestro',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Chart color palette (theme-aware)
// ============================================================================

const palette = {
  cyan: { dark: '#22d3ee', light: '#0891b2' },
  indigo: { dark: '#818cf8', light: '#4f46e5' },
  emerald: { dark: '#34d399', light: '#059669' },
  amber: { dark: '#fbbf24', light: '#d97706' },
  rose: { dark: '#fb7185', light: '#e11d48' },
  violet: { dark: '#a78bfa', light: '#7c3aed' },
  sky: { dark: '#38bdf8', light: '#0284c7' },
} as const;

function themed(key: keyof typeof palette) {
  return { dark: palette[key].dark, light: palette[key].light };
}

// ============================================================================
// Tab definitions
// ============================================================================

const TABS = [
  'Area Charts',
  'Bar Charts',
  'Line Charts',
  'Pie Charts',
  'Radar Charts',
  'Radial Charts',
  'Tooltips',
] as const;

type Tab = (typeof TABS)[number];

// ============================================================================
// Mock data
// ============================================================================

const areaData = [
  { month: 'Jan', desktop: 186, mobile: 80 },
  { month: 'Feb', desktop: 305, mobile: 200 },
  { month: 'Mar', desktop: 237, mobile: 120 },
  { month: 'Apr', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'Jun', desktop: 214, mobile: 140 },
];

const barData = [
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

const lineData = [
  { month: 'Jan', desktop: 186, mobile: 80, tablet: 45 },
  { month: 'Feb', desktop: 305, mobile: 200, tablet: 98 },
  { month: 'Mar', desktop: 237, mobile: 120, tablet: 65 },
  { month: 'Apr', desktop: 73, mobile: 190, tablet: 140 },
  { month: 'May', desktop: 209, mobile: 130, tablet: 87 },
  { month: 'Jun', desktop: 214, mobile: 140, tablet: 112 },
];

const pieData = [
  { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
  { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { browser: 'firefox', visitors: 287, fill: 'var(--color-firefox)' },
  { browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
  { browser: 'other', visitors: 190, fill: 'var(--color-other)' },
];

const radarData = [
  { metric: 'Speed', desktop: 86, mobile: 65 },
  { metric: 'Reliability', desktop: 92, mobile: 78 },
  { metric: 'Scalability', desktop: 78, mobile: 60 },
  { metric: 'Security', desktop: 95, mobile: 88 },
  { metric: 'Usability', desktop: 72, mobile: 90 },
  { metric: 'Support', desktop: 81, mobile: 75 },
];

const radialData = [
  { name: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { name: 'firefox', visitors: 287, fill: 'var(--color-firefox)' },
  { name: 'edge', visitors: 173, fill: 'var(--color-edge)' },
  { name: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
];

// --- Second chart variants ---

const areaStepData = [
  { month: 'Jan', pageViews: 1200, sessions: 820 },
  { month: 'Feb', pageViews: 1450, sessions: 960 },
  { month: 'Mar', pageViews: 1100, sessions: 740 },
  { month: 'Apr', pageViews: 1680, sessions: 1100 },
  { month: 'May', pageViews: 1520, sessions: 980 },
  { month: 'Jun', pageViews: 1790, sessions: 1250 },
];

const barHorizontalData = [
  { category: 'React', value: 42 },
  { category: 'Vue', value: 28 },
  { category: 'Angular', value: 19 },
  { category: 'Svelte', value: 15 },
  { category: 'Solid', value: 8 },
];

const pieSimpleData = [
  { segment: 'direct', value: 420, fill: 'var(--color-direct)' },
  { segment: 'organic', value: 315, fill: 'var(--color-organic)' },
  { segment: 'referral', value: 180, fill: 'var(--color-referral)' },
  { segment: 'social', value: 135, fill: 'var(--color-social)' },
];

const lineCurvedData = [
  { month: 'Jan', revenue: 2400, profit: 1200 },
  { month: 'Feb', revenue: 1398, profit: 900 },
  { month: 'Mar', revenue: 3800, profit: 2100 },
  { month: 'Apr', revenue: 3908, profit: 2400 },
  { month: 'May', revenue: 4800, profit: 2800 },
  { month: 'Jun', revenue: 3490, profit: 1900 },
];

const radarSkillsData = [
  { skill: 'HTML', level: 95 },
  { skill: 'CSS', level: 88 },
  { skill: 'JS', level: 92 },
  { skill: 'React', level: 85 },
  { skill: 'Node', level: 70 },
  { skill: 'SQL', level: 65 },
];

const radialGaugeData = [
  { name: 'progress', value: 72, fill: 'var(--color-progress)' },
];

const tooltipData = [
  { month: 'Jan', revenue: 4500, expenses: 2800 },
  { month: 'Feb', revenue: 5200, expenses: 3100 },
  { month: 'Mar', revenue: 4800, expenses: 2900 },
  { month: 'Apr', revenue: 6100, expenses: 3400 },
  { month: 'May', revenue: 5800, expenses: 3200 },
  { month: 'Jun', revenue: 7200, expenses: 3800 },
];

// ============================================================================
// Chart configs
// ============================================================================

const areaConfig = {
  desktop: { label: 'Desktop', theme: themed('cyan') },
  mobile: { label: 'Mobile', theme: themed('indigo') },
} satisfies ChartConfig;

const barConfig = {
  desktop: { label: 'Desktop', theme: themed('cyan') },
  mobile: { label: 'Mobile', theme: themed('indigo') },
} satisfies ChartConfig;

const lineConfig = {
  desktop: { label: 'Desktop', theme: themed('cyan') },
  mobile: { label: 'Mobile', theme: themed('indigo') },
  tablet: { label: 'Tablet', theme: themed('emerald') },
} satisfies ChartConfig;

const pieConfig = {
  visitors: { label: 'Visitors' },
  chrome: { label: 'Chrome', theme: themed('cyan') },
  safari: { label: 'Safari', theme: themed('indigo') },
  firefox: { label: 'Firefox', theme: themed('emerald') },
  edge: { label: 'Edge', theme: themed('amber') },
  other: { label: 'Other', theme: themed('rose') },
} satisfies ChartConfig;

const radarConfig = {
  desktop: { label: 'Desktop', theme: themed('cyan') },
  mobile: { label: 'Mobile', theme: themed('indigo') },
} satisfies ChartConfig;

const radialConfig = {
  visitors: { label: 'Visitors' },
  chrome: { label: 'Chrome', theme: themed('cyan') },
  safari: { label: 'Safari', theme: themed('indigo') },
  firefox: { label: 'Firefox', theme: themed('emerald') },
  edge: { label: 'Edge', theme: themed('amber') },
} satisfies ChartConfig;

// --- Second chart variant configs ---

const areaStepConfig = {
  pageViews: { label: 'Page Views', theme: themed('emerald') },
  sessions: { label: 'Sessions', theme: themed('amber') },
} satisfies ChartConfig;

const barHorizontalConfig = {
  value: { label: 'Popularity %', theme: themed('violet') },
} satisfies ChartConfig;

const lineCurvedConfig = {
  revenue: { label: 'Revenue', theme: themed('amber') },
  profit: { label: 'Profit', theme: themed('emerald') },
} satisfies ChartConfig;

const pieSimpleConfig = {
  value: { label: 'Traffic' },
  direct: { label: 'Direct', theme: themed('cyan') },
  organic: { label: 'Organic', theme: themed('emerald') },
  referral: { label: 'Referral', theme: themed('amber') },
  social: { label: 'Social', theme: themed('rose') },
} satisfies ChartConfig;

const radarSkillsConfig = {
  level: { label: 'Proficiency', theme: themed('emerald') },
} satisfies ChartConfig;

const radialGaugeConfig = {
  progress: { label: 'Completion', theme: themed('cyan') },
} satisfies ChartConfig;

const tooltipDotConfig = {
  revenue: { label: 'Revenue', theme: themed('emerald') },
  expenses: { label: 'Expenses', theme: themed('rose') },
} satisfies ChartConfig;

const tooltipLineConfig = {
  revenue: { label: 'Revenue', theme: themed('cyan') },
  expenses: { label: 'Expenses', theme: themed('amber') },
} satisfies ChartConfig;

const tooltipDashedConfig = {
  revenue: { label: 'Revenue', theme: themed('violet') },
  expenses: { label: 'Expenses', theme: themed('sky') },
} satisfies ChartConfig;

// ============================================================================
// Chart sections
// ============================================================================

function AreaChartSection() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Stacked area */}
      <Card className="border-future-border-subtle bg-future-surface">
        <CardHeader>
          <CardTitle className="text-future-foreground">Stacked Area Chart</CardTitle>
          <CardDescription className="text-future-foreground-muted">
            Total visitors by device over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={areaConfig}>
            <AreaChart data={areaData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <defs>
                <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area dataKey="mobile" type="natural" fill="url(#fillMobile)" fillOpacity={0.4} stroke="var(--color-mobile)" stackId="a" />
              <Area dataKey="desktop" type="natural" fill="url(#fillDesktop)" fillOpacity={0.4} stroke="var(--color-desktop)" stackId="a" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Step area */}
      <Card className="border-future-border-subtle bg-future-surface">
        <CardHeader>
          <CardTitle className="text-future-foreground">Step Area Chart</CardTitle>
          <CardDescription className="text-future-foreground-muted">
            Page views and sessions with step interpolation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={areaStepConfig}>
            <AreaChart data={areaStepData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <defs>
                <linearGradient id="fillPageViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-pageViews)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-pageViews)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-sessions)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-sessions)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area dataKey="sessions" type="step" fill="url(#fillSessions)" fillOpacity={0.4} stroke="var(--color-sessions)" />
              <Area dataKey="pageViews" type="step" fill="url(#fillPageViews)" fillOpacity={0.4} stroke="var(--color-pageViews)" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function BarChartSection() {
  const [activeKey, setActiveKey] = React.useState<'desktop' | 'mobile'>('desktop');
  const total = React.useMemo(
    () => ({
      desktop: barData.reduce((acc, d) => acc + d.desktop, 0),
      mobile: barData.reduce((acc, d) => acc + d.mobile, 0),
    }),
    [],
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Interactive vertical bar */}
      <Card className="border-future-border-subtle bg-future-surface">
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-future-border-subtle p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle className="text-future-foreground">Interactive Bar Chart</CardTitle>
            <CardDescription className="text-future-foreground-muted">
              Daily visitors — click a toggle to filter
            </CardDescription>
          </div>
          <div className="flex">
            {(['desktop', 'mobile'] as const).map((key) => (
              <button
                key={key}
                data-active={activeKey === key}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-future-border-subtle px-6 py-4 text-left even:border-l data-[active=true]:bg-future-surface-overlay sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveKey(key)}
              >
                <span className="text-xs text-future-foreground-muted">
                  {barConfig[key].label}
                </span>
                <span className="text-lg font-bold leading-none text-future-foreground sm:text-3xl">
                  {total[key].toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barConfig} className="aspect-auto h-[250px] w-full">
            <BarChart data={barData} margin={{ left: 12, right: 12 }}>
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
                    labelFormatter={(v: string) => {
                      return new Date(v).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                    }}
                  />
                }
              />
              <Bar dataKey={activeKey} fill={`var(--color-${activeKey})`} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Horizontal bar */}
      <Card className="border-future-border-subtle bg-future-surface">
        <CardHeader>
          <CardTitle className="text-future-foreground">Horizontal Bar Chart</CardTitle>
          <CardDescription className="text-future-foreground-muted">
            Framework popularity — developer survey 2026
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barHorizontalConfig} className="aspect-auto h-[250px] w-full">
            <BarChart data={barHorizontalData} layout="vertical" margin={{ left: 24, right: 24 }}>
              <CartesianGrid horizontal={false} />
              <YAxis dataKey="category" type="category" tickLine={false} axisLine={false} tickMargin={8} width={60} />
              <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function LineChartSection() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Multi-line with dots */}
      <Card className="border-future-border-subtle bg-future-surface">
        <CardHeader>
          <CardTitle className="text-future-foreground">Multi-Line Chart</CardTitle>
          <CardDescription className="text-future-foreground-muted">
            Visitors across three device types with dots and grid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineConfig}>
            <LineChart data={lineData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line dataKey="desktop" type="monotone" stroke="var(--color-desktop)" strokeWidth={2} dot={{ fill: 'var(--color-desktop)', r: 4 }} activeDot={{ r: 6 }} />
              <Line dataKey="mobile" type="monotone" stroke="var(--color-mobile)" strokeWidth={2} dot={{ fill: 'var(--color-mobile)', r: 4 }} activeDot={{ r: 6 }} />
              <Line dataKey="tablet" type="monotone" stroke="var(--color-tablet)" strokeWidth={2} dot={{ fill: 'var(--color-tablet)', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Curved line — no dots */}
      <Card className="border-future-border-subtle bg-future-surface">
        <CardHeader>
          <CardTitle className="text-future-foreground">Curved Line Chart</CardTitle>
          <CardDescription className="text-future-foreground-muted">
            Revenue vs profit with natural curve interpolation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineCurvedConfig}>
            <LineChart data={lineCurvedData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line dataKey="revenue" type="natural" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
              <Line dataKey="profit" type="natural" stroke="var(--color-profit)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function PieChartSection() {
  const totalVisitors = React.useMemo(
    () => pieData.reduce((acc, d) => acc + d.visitors, 0),
    [],
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Donut chart */}
      <Card className="border-future-border-subtle bg-future-surface">
        <CardHeader>
          <CardTitle className="text-future-foreground">Donut Chart</CardTitle>
          <CardDescription className="text-future-foreground-muted">
            Browser market share — January–June 2026
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[300px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={pieData}
                dataKey="visitors"
                nameKey="browser"
                innerRadius={60}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                            {totalVisitors.toLocaleString()}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
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

      {/* Simple pie */}
      <Card className="border-future-border-subtle bg-future-surface">
        <CardHeader>
          <CardTitle className="text-future-foreground">Pie Chart</CardTitle>
          <CardDescription className="text-future-foreground-muted">
            Traffic sources — January–June 2026
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pieSimpleConfig} className="mx-auto aspect-square max-h-[300px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={pieSimpleData}
                dataKey="value"
                nameKey="segment"
                strokeWidth={2}
                label={({ segment, percent }) =>
                  `${pieSimpleConfig[segment as keyof typeof pieSimpleConfig]?.label ?? segment} ${(percent * 100).toFixed(0)}%`
                }
              />
              <ChartLegend content={<ChartLegendContent nameKey="segment" />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function RadarChartSection() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Multi-series radar */}
      <Card className="border-future-border-subtle bg-future-surface">
        <CardHeader>
          <CardTitle className="text-future-foreground">Radar Chart</CardTitle>
          <CardDescription className="text-future-foreground-muted">
            Platform performance across 6 dimensions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={radarConfig} className="mx-auto aspect-square max-h-[300px]">
            <RadarChart data={radarData}>
              <ChartTooltip content={<ChartTooltipContent />} />
              <PolarAngleAxis dataKey="metric" />
              <PolarGrid />
              <Radar dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.6} stroke="var(--color-desktop)" />
              <Radar dataKey="mobile" fill="var(--color-mobile)" fillOpacity={0.6} stroke="var(--color-mobile)" />
              <ChartLegend content={<ChartLegendContent />} />
            </RadarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Single-series radar (dots) */}
      <Card className="border-future-border-subtle bg-future-surface">
        <CardHeader>
          <CardTitle className="text-future-foreground">Radar — Dots</CardTitle>
          <CardDescription className="text-future-foreground-muted">
            Developer skill proficiency radar with dots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={radarSkillsConfig} className="mx-auto aspect-square max-h-[300px]">
            <RadarChart data={radarSkillsData}>
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
    </div>
  );
}

function RadialChartSection() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Multi-segment radial bar */}
      <Card className="border-future-border-subtle bg-future-surface">
        <CardHeader>
          <CardTitle className="text-future-foreground">Radial Bar Chart</CardTitle>
          <CardDescription className="text-future-foreground-muted">
            Browser visitors as stacked radial segments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={radialConfig} className="mx-auto aspect-square max-h-[300px]">
            <RadialBarChart
              data={radialData}
              startAngle={-90}
              endAngle={380}
              innerRadius={30}
              outerRadius={110}
            >
              <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
              <RadialBar dataKey="visitors" background>
                {radialData.map((entry) => (
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

      {/* Semi-circle gauge */}
      <Card className="border-future-border-subtle bg-future-surface">
        <CardHeader>
          <CardTitle className="text-future-foreground">Radial Gauge</CardTitle>
          <CardDescription className="text-future-foreground-muted">
            Sprint completion progress — 72%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={radialGaugeConfig} className="mx-auto aspect-square max-h-[300px]">
            <RadialBarChart
              data={radialGaugeData}
              startAngle={180}
              endAngle={180 - (360 * 0.72)}
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
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-4xl font-bold">
                          72%
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 28} className="fill-muted-foreground text-sm">
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
    </div>
  );
}

function TooltipShowcase() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Dot indicator */}
      <Card className="border-future-border-subtle bg-future-surface">
        <CardHeader>
          <CardTitle className="text-future-foreground">Dot Indicator</CardTitle>
          <CardDescription className="text-future-foreground-muted">
            Default dot-style tooltip indicator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={tooltipDotConfig}>
            <BarChart data={tooltipData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
              <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Line indicator */}
      <Card className="border-future-border-subtle bg-future-surface">
        <CardHeader>
          <CardTitle className="text-future-foreground">Line Indicator</CardTitle>
          <CardDescription className="text-future-foreground-muted">
            Vertical line-style tooltip indicator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={tooltipLineConfig}>
            <BarChart data={tooltipData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
              <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Dashed indicator */}
      <Card className="border-future-border-subtle bg-future-surface">
        <CardHeader>
          <CardTitle className="text-future-foreground">Dashed Indicator</CardTitle>
          <CardDescription className="text-future-foreground-muted">
            Dashed border-style tooltip indicator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={tooltipDashedConfig}>
            <BarChart data={tooltipData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
              <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Panel chart examples (compact for left/right panels)
// ============================================================================

function LeftPanelCharts() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <p className="mb-2 text-xs font-medium text-future-foreground-muted">Traffic sources</p>
        <ChartContainer config={pieSimpleConfig} className="aspect-square max-h-[120px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={pieSimpleData}
              dataKey="value"
              nameKey="segment"
              strokeWidth={2}
              innerRadius={28}
            />
            <ChartLegend content={<ChartLegendContent nameKey="segment" />} className="flex-wrap gap-1 text-xs [&>*]:basis-1/2" />
          </PieChart>
        </ChartContainer>
      </div>
      <Separator className="bg-future-border-subtle" />
      <div>
        <p className="mb-2 text-xs font-medium text-future-foreground-muted">Framework popularity</p>
        <ChartContainer config={barHorizontalConfig} className="aspect-auto h-[140px] w-full">
          <BarChart data={barHorizontalData} layout="vertical" margin={{ left: 40, right: 12 }}>
            <CartesianGrid horizontal={false} />
            <YAxis dataKey="category" type="category" tickLine={false} axisLine={false} tickMargin={4} width={36} tick={{ fontSize: 10 }} />
            <XAxis type="number" tickLine={false} axisLine={false} tickMargin={4} tick={{ fontSize: 10 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={4} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}

function RightPanelCharts() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="w-full">
        <p className="mb-2 text-xs font-medium text-future-foreground-muted">Dot Indicator</p>
        <ChartContainer config={tooltipDotConfig} className="w-full aspect-auto h-[120px] justify-start">
          <BarChart data={tooltipData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={4} tick={{ fontSize: 10 }} />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
          </BarChart>
        </ChartContainer>
      </div>
      <Separator className="bg-future-border-subtle" />
      <div className="w-full">
        <p className="mb-2 text-xs font-medium text-future-foreground-muted">Dashed Indicator</p>
        <ChartContainer config={tooltipDashedConfig} className="w-full aspect-auto h-[120px] justify-start">
          <BarChart data={tooltipData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={4} tick={{ fontSize: 10 }} />
            <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}

// ============================================================================
// Main content component
// ============================================================================

function VisualizationContent() {
  const [activeTab, setActiveTab] = React.useState<Tab>('Area Charts');

  const content: Record<Tab, React.ReactNode> = {
    'Area Charts': <AreaChartSection />,
    'Bar Charts': <BarChartSection />,
    'Line Charts': <LineChartSection />,
    'Pie Charts': <PieChartSection />,
    'Radar Charts': <RadarChartSection />,
    'Radial Charts': <RadialChartSection />,
    Tooltips: <TooltipShowcase />,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Intro — charts stack and usage */}
      <Card className="border-future-border-subtle bg-future-surface">
        <CardHeader>
          <CardTitle className="text-future-foreground">How to use</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-future-foreground">
            <a
              href="https://ui.shadcn.com/charts/area"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-future-accent-foreground underline underline-offset-2 hover:text-future-accent-foreground/80"
            >
              Recharts
            </a>{' '}
            powers these visuals. Wrap Recharts primitives with{' '}
            <code className="rounded bg-future-surface-overlay px-1.5 py-0.5 font-mono text-xs">ChartContainer</code>,{' '}
            <code className="rounded bg-future-surface-overlay px-1.5 py-0.5 font-mono text-xs">ChartTooltip</code>, and{' '}
            <code className="rounded bg-future-surface-overlay px-1.5 py-0.5 font-mono text-xs">ChartLegend</code> from{' '}
            <code className="rounded bg-future-surface-overlay px-1.5 py-0.5 font-mono text-xs">@/components/ui/chart</code>. Provide a <code className="rounded bg-future-surface-overlay px-1.5 py-0.5 font-mono text-xs">ChartConfig</code> for theming.
          </p>
        </CardContent>
      </Card>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-future-border-subtle">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`shrink-0 px-4 pb-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-future-accent text-future-foreground'
                : 'text-future-foreground-muted hover:text-future-foreground'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Active chart */}
      {content[activeTab]}
    </div>
  );
}

// ============================================================================
// Story
// ============================================================================

export const Visualization: Story = {
  name: 'Visualization',
  render: (_, { globals }) => (
    <MaestroTemplate
      theme={globals.futureTheme || 'dark'}
      title="Maestro"
      defaultLeftPanelCollapsed
      defaultRightPanelCollapsed
      leftPanelContent={<LeftPanelCharts />}
      rightPanelContent={<RightPanelCharts />}
    >
      <VisualizationContent />
    </MaestroTemplate>
  ),
};
