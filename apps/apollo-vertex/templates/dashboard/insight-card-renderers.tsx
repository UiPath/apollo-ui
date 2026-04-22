"use client";

import { useRef, useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/tooltip/tooltip";
import type { InsightCardContent } from "./glow-config";
import { useDashboardData } from "./DashboardDataProvider";
import type { InsightCardData } from "./dashboard-data";

type ViewMode = "desktop" | "compact" | "stacked";

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: 11,
  padding: "6px 10px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

// --- Truncated text with conditional tooltip ---

function TruncatedText({
  children,
  className,
}: {
  children: string | undefined;
  className?: string;
}) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const check = () => setIsTruncated(el.scrollHeight > el.clientHeight);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children]);

  const textEl = (
    <p ref={textRef} className={`line-clamp-2 ${className ?? ""}`}>
      {children}
    </p>
  );

  if (!isTruncated) return textEl;

  return (
    <UiTooltip>
      <TooltipTrigger asChild>{textEl}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64">
        {children}
      </TooltipContent>
    </UiTooltip>
  );
}

// --- Fallback sample data ---

const fallbackSparkline = [4, 7, 5, 9, 6, 8, 12, 10, 14, 11, 15, 13];
const fallbackArea = [3, 5, 4, 8, 6, 9, 7, 11, 10, 14, 12, 16];

// --- KPI ---

function KpiContent({
  cardData,
  viewMode,
}: {
  cardData: InsightCardData;
  viewMode: ViewMode;
}) {
  if (viewMode === "compact") {
    return (
      <>
        <div className="flex items-end gap-3">
          <div className="text-5xl font-normal tracking-tight leading-none bg-gradient-to-r from-insight-800 to-primary-600 dark:from-insight-500 dark:to-primary-400 bg-clip-text text-transparent">
            {cardData.kpiNumber}
          </div>
          <Badge variant="secondary" status="info" className="mb-1">
            {cardData.kpiBadge}
          </Badge>
        </div>
        <TruncatedText className="text-xs font-normal text-muted-foreground mt-auto">
          {cardData.kpiDescription}
        </TruncatedText>
      </>
    );
  }

  return (
    <>
      <div className="text-5xl font-normal tracking-tight leading-none bg-gradient-to-r from-insight-800 to-primary-600 dark:from-insight-500 dark:to-primary-400 bg-clip-text text-transparent">
        {cardData.kpiNumber}
      </div>
      <div className="mt-auto">
        <Badge variant="secondary" status="info" className="mb-2">
          {cardData.kpiBadge}
        </Badge>
        <p className="text-xs font-normal text-muted-foreground">
          {cardData.kpiDescription}
        </p>
      </div>
    </>
  );
}

// --- Donut (Recharts PieChart) ---

function DonutContent({ cardData }: { cardData: InsightCardData }) {
  const percent = cardData.donutPercent ?? 47;
  const label = cardData.donutLabel ?? "funded";
  const data = [{ value: percent }, { value: 100 - percent }];

  return (
    <div className="relative flex-1 min-h-0 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="68%"
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
            isAnimationActive={true}
          >
            <Cell fill={CHART_COLORS[0]} />
            <Cell fill="var(--color-muted)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-normal tracking-tight leading-none">
          {percent}%
        </span>
        <span className="text-[10px] text-muted-foreground mt-0.5">
          {label}
        </span>
      </div>
    </div>
  );
}

// --- Horizontal bars (CSS — kept for glow effect) ---

function HorizontalBarsContent({
  cardData,
  viewMode,
  isExpanded = false,
}: {
  cardData: InsightCardData;
  viewMode: ViewMode;
  isExpanded?: boolean;
}) {
  const bars = cardData.bars ?? [];
  const chartColors = [
    "bg-chart-1",
    "bg-chart-2",
    "bg-chart-3",
    "bg-chart-4",
    "bg-chart-5",
  ];
  const barsWithColor = bars.map((b, i) => ({
    ...b,
    color: chartColors[i % chartColors.length],
  }));

  if (viewMode === "compact" && !isExpanded) {
    const total = barsWithColor.reduce((sum, s) => sum + s.value, 0);
    return (
      <div className="flex flex-col gap-3">
        <div className="h-3 w-full rounded-full overflow-hidden flex">
          {barsWithColor.map((issue) => (
            <div
              key={issue.label}
              className={`${issue.color} relative`}
              style={{ flex: issue.value }}
            >
              <div
                className={`absolute inset-0 ${issue.color} opacity-35 dark:opacity-55 blur-[4px]`}
              />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {barsWithColor.map((issue) => {
            const pct = Math.round((issue.value / total) * 100);
            return (
              <div key={issue.label} className="flex items-center gap-1.5">
                <div className={`size-2 rounded-full ${issue.color}`} />
                <span className="text-[10px] text-muted-foreground">
                  {issue.label} {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {barsWithColor.map((issue) => (
        <div key={issue.label}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium">{issue.label}</span>
            <span className="font-bold">{issue.value}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted dark:bg-foreground/10 relative">
            <div
              className={`h-full rounded-full ${issue.color} relative`}
              style={{ width: `${issue.value}%` }}
            >
              <div
                className={`absolute inset-0 ${issue.color} rounded-full opacity-35 dark:opacity-55 blur-[4px]`}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Sparkline (Recharts LineChart) ---

function SparklineContent({ cardData }: { cardData: InsightCardData }) {
  const pts = cardData.points ?? fallbackSparkline;
  const data = pts.map((v, i) => ({ i, v }));

  return (
    <div className="flex-1 min-h-0 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
        >
          <Line
            type="monotone"
            dataKey="v"
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Area (Recharts AreaChart) ---

function AreaContent({ cardData }: { cardData: InsightCardData }) {
  const pts = cardData.points ?? fallbackArea;
  const data = pts.map((v, i) => ({ i, v }));

  return (
    <div className="flex-1 min-h-0 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
        >
          <defs>
            <linearGradient id="rcAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={CHART_COLORS[0]}
                stopOpacity={0.25}
              />
              <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={CHART_COLORS[0]}
            fill="url(#rcAreaFill)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Stacked bar (Recharts BarChart) ---

function StackedBarContent({
  cardData,
  viewMode,
  isExpanded = false,
}: {
  cardData: InsightCardData;
  viewMode: ViewMode;
  isExpanded?: boolean;
}) {
  const rawBars = cardData.stackedBars ?? [];
  const legend = cardData.stackedLegend ?? [];

  const data = rawBars.map((bar) => {
    const entry: Record<string, string | number> = { label: bar.label };
    legend.forEach((key, i) => {
      entry[key] = bar.segments[i] ?? 0;
    });
    return entry;
  });

  // Compact: CSS horizontal summary (unchanged)
  if (viewMode === "compact" && !isExpanded) {
    const cssColors = [
      "bg-chart-1",
      "bg-chart-2",
      "bg-chart-3",
      "bg-chart-4",
      "bg-chart-5",
    ];
    const totals = rawBars.reduce(
      (acc, day) => {
        day.segments.forEach((val, i) => {
          acc[i] = (acc[i] ?? 0) + val;
        });
        return acc;
      },
      {} as Record<number, number>,
    );
    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

    return (
      <div className="flex flex-col gap-3">
        <div className="h-3 w-full rounded-full overflow-hidden flex">
          {legend.map((_, i) => (
            <div
              key={i}
              className={`${cssColors[i % cssColors.length]} relative`}
              style={{ flex: totals[i] ?? 0 }}
            >
              <div
                className={`absolute inset-0 ${cssColors[i % cssColors.length]} opacity-35 dark:opacity-55 blur-[4px]`}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          {legend.map((label, i) => {
            const val = totals[i] ?? 0;
            const pct = Math.round((val / grandTotal) * 100);
            return (
              <div key={label} className="flex items-center gap-1.5">
                <div
                  className={`size-2 rounded-full ${cssColors[i % cssColors.length]}`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {label} {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: -28 }}
            barCategoryGap="32%"
          >
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
            {legend.map((key, i) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={i === legend.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {legend.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="size-2 rounded-full"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Composed (Recharts ComposedChart: bars + target line) ---

function ComposedContent({ cardData }: { cardData: InsightCardData }) {
  const rawData = cardData.composedBars ?? [];
  const hasTarget = rawData.some((d) => d.target !== undefined);

  return (
    <div className="flex-1 min-h-0 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={rawData}
          margin={{ top: 4, right: 4, bottom: 0, left: -28 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
          />
          <Bar
            dataKey="value"
            fill={CHART_COLORS[0]}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
            isAnimationActive={true}
          />
          {hasTarget && (
            <Line
              dataKey="target"
              stroke={CHART_COLORS[2]}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Multi-line (Recharts LineChart with multiple series) ---

function MultiLineContent({ cardData }: { cardData: InsightCardData }) {
  const series = cardData.multiLineSeries ?? [];
  const labels = cardData.multiLineLabels ?? [];

  const data = labels.map((label, i) => {
    const point: Record<string, string | number> = { label };
    for (const s of series) {
      point[s.name] = s.points[i] ?? 0;
    }
    return point;
  });

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: -28 }}
          >
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            {series.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 shrink-0">
        {series.map((s, i) => (
          <div key={s.name} className="flex items-center gap-1.5">
            <div
              className="size-2 rounded-full"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-[10px] text-muted-foreground">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- InsightCardBody ---

export function InsightCardBody({
  content,
  cardIndex,
  viewMode = "desktop",
  isExpanded = false,
}: {
  content: InsightCardContent;
  cardIndex: number;
  viewMode?: ViewMode;
  isExpanded?: boolean;
}) {
  const { data } = useDashboardData();
  const cardData = data.insightCards[cardIndex] ?? data.insightCards[0];

  if (content.type === "kpi") {
    return <KpiContent cardData={cardData} viewMode={viewMode} />;
  }
  if (content.chartType === "horizontal-bars") {
    return (
      <HorizontalBarsContent
        cardData={cardData}
        viewMode={viewMode}
        isExpanded={isExpanded}
      />
    );
  }
  if (content.chartType === "donut") {
    return <DonutContent cardData={cardData} />;
  }
  if (content.chartType === "sparkline") {
    return <SparklineContent cardData={cardData} />;
  }
  if (content.chartType === "stacked-bar") {
    return (
      <StackedBarContent
        cardData={cardData}
        viewMode={viewMode}
        isExpanded={isExpanded}
      />
    );
  }
  if (content.chartType === "composed") {
    return <ComposedContent cardData={cardData} />;
  }
  if (content.chartType === "multi-line") {
    return <MultiLineContent cardData={cardData} />;
  }
  return <AreaContent cardData={cardData} />;
}
