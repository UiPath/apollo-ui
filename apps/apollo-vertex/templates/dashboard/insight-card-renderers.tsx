"use client";

import { useRef, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/tooltip/tooltip";
import type { InsightCardContent } from "./glow-config";
import { useDashboardData } from "./dashboard-data-context";
import type { InsightCardData } from "./dashboard-data";

type ViewMode = "desktop" | "compact" | "stacked";

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
    <Tooltip>
      <TooltipTrigger asChild>{textEl}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

// --- Sample data per card type ---

const sparklinePoints = [4, 7, 5, 9, 6, 8, 12, 10, 14, 11, 15, 13];
const areaPoints = [3, 5, 4, 8, 6, 9, 7, 11, 10, 14, 12, 16];

// --- Renderers ---

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

function DonutContent() {
  return (
    <div className="flex items-center justify-center flex-1">
      <div className="relative size-3/4 aspect-square">
        <svg viewBox="0 0 36 36" className="size-full -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            className="stroke-muted"
            strokeWidth="2"
          />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            className="stroke-chart-1"
            strokeWidth="2"
            strokeDasharray="97.39"
            strokeDashoffset={97.39 * (1 - 0.47)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-normal tracking-tight leading-none">
            47%
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            funded
          </span>
        </div>
      </div>
    </div>
  );
}

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

function SparklineContent() {
  const max = Math.max(...sparklinePoints);
  const h = 40;
  const w = 120;
  const step = w / (sparklinePoints.length - 1);
  const points = sparklinePoints
    .map((v, i) => `${i * step},${h - (v / max) * h}`)
    .join(" ");

  return (
    <div className="flex items-center justify-center flex-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16" fill="none">
        <polyline
          points={points}
          className="stroke-chart-1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

function AreaContent() {
  const max = Math.max(...areaPoints);
  const h = 40;
  const w = 120;
  const step = w / (areaPoints.length - 1);
  const linePoints = areaPoints
    .map((v, i) => `${i * step},${h - (v / max) * h}`)
    .join(" ");
  const areaPath = `0,${h} ${linePoints} ${w},${h}`;

  return (
    <div className="flex items-center justify-center flex-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16" fill="none">
        <polygon points={areaPath} className="fill-chart-1/20" />
        <polyline
          points={linePoints}
          className="stroke-chart-1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

function StackedBarContent({
  cardData,
  viewMode,
  isExpanded = false,
}: {
  cardData: InsightCardData;
  viewMode: ViewMode;
  isExpanded?: boolean;
}) {
  const chartColors = [
    "bg-chart-1",
    "bg-chart-2",
    "bg-chart-3",
    "bg-chart-4",
    "bg-chart-5",
  ];
  const rawBars = cardData.stackedBars ?? [];
  const legend = (cardData.stackedLegend ?? []).map((label, i) => ({
    label,
    color: chartColors[i % chartColors.length],
  }));
  const barData = rawBars.map((bar) => ({
    label: bar.label,
    segments: bar.segments.map((value, i) => ({
      value,
      color: chartColors[i % chartColors.length],
    })),
  }));
  const maxTotal = Math.max(
    ...barData.map((d) => d.segments.reduce((sum, s) => sum + s.value, 0)),
  );

  if (viewMode === "compact" && !isExpanded) {
    // Summary: aggregate all days into one horizontal stacked bar
    const totals = barData.reduce(
      (acc, day) => {
        for (const seg of day.segments) {
          const key = seg.color;
          acc[key] = (acc[key] ?? 0) + seg.value;
        }
        return acc;
      },
      {} as Record<string, number>,
    );
    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

    return (
      <div className="flex flex-col gap-3">
        <div className="h-3 w-full rounded-full overflow-hidden flex">
          {legend.map((item) => (
            <div
              key={item.color}
              className={`${item.color} relative`}
              style={{ flex: totals[item.color] ?? 0 }}
            >
              <div
                className={`absolute inset-0 ${item.color} opacity-35 dark:opacity-55 blur-[4px]`}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          {legend.map((item) => {
            const val = totals[item.color] ?? 0;
            const pct = Math.round((val / grandTotal) * 100);
            return (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`size-2 rounded-full ${item.color}`} />
                <span className="text-[10px] text-muted-foreground">
                  {item.label} {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-end justify-between flex-1 min-h-0">
        {barData.map((bar) => {
          const total = bar.segments.reduce((sum, s) => sum + s.value, 0);
          const pct = (total / maxTotal) * 100;
          return (
            <div
              key={bar.label}
              className="w-4 flex flex-col items-center gap-1 h-full"
            >
              <div
                className="w-full flex flex-col-reverse rounded-t-sm overflow-visible relative mt-auto"
                style={{ height: `${pct}%` }}
              >
                <div className="absolute inset-0 flex flex-col-reverse rounded-t-sm overflow-hidden">
                  {bar.segments.map((seg) => (
                    <div
                      key={seg.color}
                      className={`${seg.color} relative`}
                      style={{ flex: seg.value }}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col-reverse rounded-t-sm opacity-35 dark:opacity-55 blur-[4px]">
                  {bar.segments.map((seg) => (
                    <div
                      key={`glow-${seg.color}`}
                      className={seg.color}
                      style={{ flex: seg.value }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-auto pt-4">
        {legend.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`size-2 rounded-full ${item.color}`} />
            <span className="text-[10px] text-muted-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  if (content.chartType === "horizontal-bars")
    return (
      <HorizontalBarsContent
        cardData={cardData}
        viewMode={viewMode}
        isExpanded={isExpanded}
      />
    );
  if (content.chartType === "donut") return <DonutContent />;
  if (content.chartType === "sparkline") return <SparklineContent />;
  if (content.chartType === "stacked-bar")
    return (
      <StackedBarContent
        cardData={cardData}
        viewMode={viewMode}
        isExpanded={isExpanded}
      />
    );
  return <AreaContent />;
}
