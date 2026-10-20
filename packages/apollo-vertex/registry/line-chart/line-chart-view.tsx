import { Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface LineChartProps {
  data: Array<{ x: string; y: number }>;
  seriesLabel: string;
  formatValue: (value: number) => string;
  color?: string;
}

export function LineChart({
  data,
  seriesLabel,
  formatValue,
  color = "var(--color-primary)",
}: LineChartProps) {
  const config: ChartConfig = {
    y: { label: seriesLabel, color },
  };

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full">
      <RechartsLineChart
        data={data}
        margin={{ top: 16, right: 16, bottom: 16, left: 0 }}
      >
        <XAxis
          dataKey="x"
          tickLine={false}
          tickMargin={8}
          minTickGap={32}
          axisLine
          tick={{ fontSize: 12 }}
        />
        <YAxis
          type="number"
          domain={["auto", "auto"]}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatValue(Number(value))}
          tick={{ fontSize: 14 }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="w-[200px] border-0"
              nameKey="y"
              labelFormatter={String}
              formatter={(value) => (
                <div className="flex w-full flex-wrap gap-2 items-center">
                  <div
                    className="shrink-0 rounded-[2px] border h-2.5 w-2.5"
                    style={{ backgroundColor: color, borderColor: color }}
                  />
                  <div className="flex flex-1 justify-between leading-none items-center">
                    <span className="text-muted-foreground">{seriesLabel}</span>
                    <span className="text-foreground font-mono font-medium tabular-nums">
                      {formatValue(Number(value))}
                    </span>
                  </div>
                </div>
              )}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="y"
          name={seriesLabel}
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </RechartsLineChart>
    </ChartContainer>
  );
}
