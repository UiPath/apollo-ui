import {
  Label,
  Line,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface MultiLineChartSeries {
  id: string;
  label: string;
  color: string;
  axis: "left" | "right";
  formatValue: (value: number) => string;
  totalText: string;
  totalLabel: string;
}

export interface MultiLineChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: MultiLineChartSeries[];
}

export function MultiLineChart({ data, xKey, series }: MultiLineChartProps) {
  const left = series.find((s) => s.axis === "left");
  const right = series.find((s) => s.axis === "right");

  const config: ChartConfig = Object.fromEntries(
    series.map((s) => [s.id, { label: s.label, color: s.color }]),
  );

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full">
      <RechartsLineChart data={data} margin={{ top: 50, left: 60, right: 60 }}>
        <XAxis dataKey={xKey} />
        {left && (
          <YAxis
            yAxisId="left"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(value) => left.formatValue(Number(value))}
            padding={{ top: 20, bottom: 20 }}
          >
            <Label
              position="top"
              offset={16}
              fill={left.color}
              value={left.totalLabel}
              fontSize={16}
              fontWeight={600}
              textAnchor="start"
              dx={-30}
              dy={-20}
            />
            <Label
              position="top"
              offset={0}
              fill={left.color}
              value={left.totalText}
              fontSize={30}
              fontWeight={600}
              textAnchor="start"
              dx={-30}
              dy={-6}
            />
          </YAxis>
        )}
        {right && (
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(value) => right.formatValue(Number(value))}
            padding={{ top: 20, bottom: 20 }}
          >
            <Label
              position="top"
              offset={16}
              fill={right.color}
              value={right.totalLabel}
              fontSize={16}
              fontWeight={600}
              textAnchor="end"
              dx={30}
              dy={-20}
            />
            <Label
              position="top"
              offset={0}
              fill={right.color}
              value={right.totalText}
              fontSize={30}
              fontWeight={600}
              textAnchor="end"
              dx={30}
              dy={-6}
            />
          </YAxis>
        )}
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="max-w-[240px]"
              labelFormatter={String}
              formatter={(value, name) => {
                const matched = series.find(
                  (s) => s.label === name || s.id === name,
                );
                const formatted = matched
                  ? matched.formatValue(Number(value))
                  : String(value);
                const indicatorColor = matched?.color ?? "var(--color-primary)";
                return (
                  <>
                    <div
                      className="shrink-0 rounded-[2px] h-2.5 w-2.5"
                      style={{
                        backgroundColor: indicatorColor,
                        borderColor: indicatorColor,
                      }}
                    />
                    <div className="flex flex-1 justify-between items-center leading-none">
                      <span className="text-muted-foreground">
                        {matched?.label ?? String(name)}
                      </span>
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {formatted}
                      </span>
                    </div>
                  </>
                );
              }}
            />
          }
        />
        {series.map((s) => (
          <Line
            key={s.id}
            yAxisId={s.axis}
            type="monotone"
            dataKey={s.id}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  );
}
