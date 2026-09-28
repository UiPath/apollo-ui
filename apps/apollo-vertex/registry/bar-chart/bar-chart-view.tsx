import {
  Cell,
  LabelList,
  Bar as RechartsBar,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarLabel } from "./bar-label";
import { MetricColumn } from "./metric-column";
import { COLORS, PALETTE } from "./util/colors";
import { getBarColor } from "./util/get-bar-color";
import {
  isRechartsBarData,
  type LabelListContentProps,
  type RechartsBarData,
} from "./util/recharts-bar-data";

export interface BarChartSeries {
  id: string;
  label: string;
  color?: string;
}

export interface BarChartRow {
  id: string;
  dimensions: Array<{ key: string; label: string }>;
  values: Record<string, number>;
  formattedValues: Record<string, string>;
  formattedPercents: Record<string, string>;
}

export interface BarChartProps {
  rows: BarChartRow[];
  series: BarChartSeries[];
}

const BAR_SIZE = 20;
const BAR_GAP = 4;
const CATEGORY_GAP = 8;

export function BarChart({ rows, series }: BarChartProps) {
  const dimensionKeys = rows[0]?.dimensions.map((d) => d.key) ?? [];
  const dimensionCount = dimensionKeys.length;
  const rechartsData: Array<RechartsBarData> = rows.map((row) => {
    const entry: RechartsBarData = {
      __category: row.dimensions
        .map((d) => d.label)
        .filter((v) => v !== "")
        .join(" • "),
      __id: row.id,
      __formatted: row.formattedValues,
    };
    for (const s of series) {
      entry[s.label] = row.values[s.id] ?? 0;
    }
    return entry;
  });

  const seriesCount = series.length;
  const bandPx =
    seriesCount * BAR_SIZE + (seriesCount - 1) * BAR_GAP + CATEGORY_GAP;
  const chartHeightPx = rechartsData.length * bandPx;

  const singleDimensionWidthPct = 25;
  const maxDimensionWidthPct = 35;
  const dimensionWidthPct =
    dimensionCount <= 1
      ? singleDimensionWidthPct
      : maxDimensionWidthPct / dimensionCount;
  const dimensionCols: string[] = [];
  for (let i = 0; i < dimensionCount; i++) {
    dimensionCols.push(`minmax(0, ${dimensionWidthPct}%)`);
  }
  const gridCols = `${dimensionCols.join(" ")} 1fr minmax(0, 20%) minmax(0, 15%)`;

  const chartConfig: ChartConfig = Object.fromEntries(
    series.map((s, index) => [
      s.label,
      {
        label: s.label,
        color: s.color ?? COLORS[index % COLORS.length] ?? COLORS[0],
      },
    ]),
  );

  const valueColumnRows = rows.map((row) => ({
    id: row.id,
    cells: series.map((s) => ({
      id: s.id,
      text: row.formattedValues[s.id] ?? "",
    })),
  }));
  const percentColumnRows = rows.map((row) => ({
    id: row.id,
    cells: series.map((s) => ({
      id: s.id,
      text: row.formattedPercents[s.id] ?? "",
    })),
  }));

  return (
    <div className="w-full h-full overflow-y-auto select-none [&_*]:pointer-events-auto p-2">
      <div
        className="grid gap-x-2 items-start"
        style={{ gridTemplateColumns: gridCols }}
      >
        {dimensionKeys.map((dimKey, dimIdx) => (
          <div
            key={dimKey}
            className="min-w-0 overflow-hidden"
            style={{ height: `${chartHeightPx}px` }}
          >
            {rows.map((row) => {
              const label = row.dimensions[dimIdx]?.label ?? "";
              return (
                <div
                  key={`${row.id}-${dimKey}`}
                  className="flex items-center pr-2 min-w-0 overflow-hidden"
                  style={{ height: `${bandPx}px` }}
                >
                  <span
                    className="block w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap min-w-0 text-sm"
                    title={label}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        ))}

        <ChartContainer
          config={chartConfig}
          className="aspect-auto w-full"
          style={{ height: `${chartHeightPx}px` }}
        >
          <RechartsBarChart
            data={rechartsData}
            layout="vertical"
            barGap={BAR_GAP}
            barCategoryGap={CATEGORY_GAP}
            margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
          >
            <XAxis type="number" hide padding={{ left: 12, right: 0 }} />
            <YAxis
              type="category"
              dataKey="__category"
              width={0}
              tick={false}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="max-w-[320px]"
                  nameKey="__category"
                  labelFormatter={String}
                  formatter={(value, name, item, _index, payload) => {
                    const seriesIndex = series.findIndex(
                      (s) => s.label === name,
                    );
                    const matched = series[seriesIndex];
                    if (!matched) {
                      // oxlint-disable-next-line typescript-eslint(no-unsafe-return) -- recharts payload is untyped
                      return value ?? "";
                    }
                    const payloadObj = isRechartsBarData(payload)
                      ? payload
                      : null;
                    const formatted =
                      payloadObj?.__formatted[matched.id] ?? String(value);
                    const indicatorColor = getBarColor({
                      seriesCount,
                      seriesIndex,
                      // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- recharts payload is untyped
                      item,
                      payload: payloadObj,
                      rechartsData,
                    });
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
                            {matched.label}
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
              cursor={false}
            />
            {seriesCount === 1 ? (
              <RechartsBar dataKey={series[0]?.label ?? ""} barSize={BAR_SIZE}>
                <LabelList
                  content={(props: LabelListContentProps) => {
                    const payload = isRechartsBarData(props.payload)
                      ? props.payload
                      : null;
                    const formatted =
                      payload && series[0]
                        ? (payload.__formatted[series[0].id] ?? "")
                        : "";
                    return <BarLabel {...props} formatted={formatted} />;
                  }}
                />
                {rechartsData.map((row, index) => (
                  <Cell key={row.__id} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </RechartsBar>
            ) : (
              series.map((s, idx) => (
                <RechartsBar
                  key={s.id}
                  dataKey={s.label}
                  fill={s.color ?? COLORS[idx % COLORS.length]}
                  barSize={BAR_SIZE}
                >
                  <LabelList
                    content={(props: LabelListContentProps) => {
                      const payload = isRechartsBarData(props.payload)
                        ? props.payload
                        : null;
                      const formatted = payload?.__formatted[s.id] ?? "";
                      return <BarLabel {...props} formatted={formatted} />;
                    }}
                  />
                </RechartsBar>
              ))
            )}
          </RechartsBarChart>
        </ChartContainer>

        <MetricColumn
          keyPrefix="value"
          rows={valueColumnRows}
          chartHeightPx={chartHeightPx}
          bandPx={bandPx}
          barSize={BAR_SIZE}
          barGap={BAR_GAP}
        />
        <MetricColumn
          keyPrefix="percent"
          rows={percentColumnRows}
          chartHeightPx={chartHeightPx}
          bandPx={bandPx}
          barSize={BAR_SIZE}
          barGap={BAR_GAP}
        />
      </div>
    </div>
  );
}
