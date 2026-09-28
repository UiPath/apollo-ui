import type { Meta } from '@storybook/react-vite';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from './chart';

const meta: Meta<typeof ChartContainer> = {
  title: 'Components/Data Display/Chart',
  component: ChartContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Recharts wrapper components. ChartContainer scopes a ChartConfig to the chart, ' +
          'generating per-series CSS variables (--color-<key>) from the config color or theme entries. ' +
          'Reference those variables from recharts primitives via fill or stroke.',
      },
    },
  },
};

export default meta;

// ============================================================================
// Shared data
// ============================================================================

const monthlyData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

const barConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--color-chart-blue-secondary)',
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--color-chart-purple)',
  },
} satisfies ChartConfig;

// ============================================================================
// Bar Chart
// ============================================================================

export const BarChartStory = {
  name: 'Bar Chart',
  render: () => (
    <ChartContainer config={barConfig} className="min-h-[200px] w-full max-w-2xl">
      <BarChart accessibilityLayer data={monthlyData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value: string) => value.slice(0, 3)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

// ============================================================================
// Line Chart
// ============================================================================

const lineConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--color-chart-green)',
  },
  mobile: {
    label: 'Mobile',
    // Theme entries let a series pick a different value per theme group.
    theme: {
      light: 'var(--color-chart-pink)',
      dark: 'var(--color-chart-yellow)',
    },
  },
} satisfies ChartConfig;

export const LineChartStory = {
  name: 'Line Chart',
  render: () => (
    <ChartContainer config={lineConfig} className="min-h-[200px] w-full max-w-2xl">
      <LineChart accessibilityLayer data={monthlyData} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value: string) => value.slice(0, 3)}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="desktop"
          type="monotone"
          stroke="var(--color-desktop)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="mobile"
          type="monotone"
          stroke="var(--color-mobile)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  ),
};

// ============================================================================
// Tooltip Indicators
// ============================================================================

export const TooltipIndicators = {
  name: 'Tooltip Indicators',
  render: () => (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-2">
        <p className="text-sm font-medium">Dot indicator (default)</p>
        <ChartContainer config={barConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={monthlyData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value: string) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
          </BarChart>
        </ChartContainer>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Dashed indicator, hidden label</p>
        <ChartContainer config={barConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={monthlyData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value: string) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="dashed" hideLabel />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  ),
};
