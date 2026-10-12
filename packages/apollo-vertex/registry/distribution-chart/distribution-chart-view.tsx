import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface DistributionChartProps {
  data: Array<{ x: string; y: number }>;
  seriesLabel: string;
  formatValue: (value: number) => string;
  color?: string;
}

export function DistributionChart({
  data,
  seriesLabel,
  formatValue,
  color = "var(--color-primary)",
}: DistributionChartProps) {
  const config: ChartConfig = {
    y: { label: seriesLabel, color },
  };

  return (
    <ChartContainer config={config} className="aspect-auto h-[250px] w-full">
      <BarChart accessibilityLayer data={data} margin={{ right: 16, top: 16 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="x"
          tickLine={false}
          tickMargin={8}
          minTickGap={32}
          axisLine
        />
        <YAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatValue(Number(v))}
          tick={{ fontSize: 14 }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="w-[200px] border-0"
              nameKey="x"
              labelFormatter={String}
            />
          }
        />
        <Bar dataKey="y" fill={color} barSize={20} />
      </BarChart>
    </ChartContainer>
  );
}
