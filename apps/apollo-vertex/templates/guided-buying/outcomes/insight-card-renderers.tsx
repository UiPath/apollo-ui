"use client";

import { Circle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AiCaveat } from "@/registry/ai-caveat/ai-caveat";
import { AreaContent, SparklineContent } from "./chart-stubs";
import type { InsightCardData } from "./dashboard-data";
import { useDashboardData } from "./dashboard-data-context";
import type { InsightCardContent } from "./glow-config";

const LINE_CLAMP_CLASSES = { 2: "line-clamp-2", 3: "line-clamp-3" } as const;

// A native `title` attribute, not a Radix tooltip: many of these sit
// packed close together (the stage bar labels), and a floating tooltip's
// own hover state machine was getting stuck open under quick, repeated
// hovering across several at once. `title` has no state to get stuck in.
function TruncatedText({
  children,
  className,
  lines = 2,
}: {
  children: string | undefined;
  className?: string;
  lines?: 1 | 2 | 3;
}) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const check = () =>
      setIsTruncated(
        lines === 1
          ? el.scrollWidth > el.clientWidth
          : el.scrollHeight > el.clientHeight,
      );
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, lines]);

  return (
    <p
      ref={textRef}
      {...(isTruncated ? { title: children } : {})}
      className={`${lines === 1 ? "truncate" : LINE_CLAMP_CLASSES[lines]} ${className ?? ""}`}
    >
      {children}
    </p>
  );
}

function FindingsFoot({
  lines,
  className = "",
  clampLines = 3,
}: {
  lines?: string[];
  className?: string;
  clampLines?: 2 | 3;
}) {
  if (!lines || lines.length === 0) return null;
  return (
    <div className={`space-y-1.5 ${className}`}>
      {lines.map((line) => (
        <TruncatedText
          key={line}
          className="text-xs text-muted-foreground leading-snug"
          lines={clampLines}
        >
          {line}
        </TruncatedText>
      ))}
    </div>
  );
}

const DONUT_TRACK_CIRCUMFERENCE = 97.39;
const DONUT_GRADIENT_ID = "insight-donut-gradient";

function DonutFigure({
  cardData,
  numberClassName = "text-3xl",
  labelClassName = "text-sm",
}: {
  cardData: InsightCardData;
  numberClassName?: string;
  labelClassName?: string;
}) {
  const percent = cardData.donutPercent ?? 0;
  const filled = DONUT_TRACK_CIRCUMFERENCE * (percent / 100);

  return (
    <div className="relative mx-auto aspect-square h-full max-w-full">
      <svg viewBox="0 0 36 36" className="size-full -rotate-90">
        <defs>
          <linearGradient
            id={DONUT_GRADIENT_ID}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--ai-gradient-start)" />
            <stop offset="100%" stopColor="var(--ai-gradient-end)" />
          </linearGradient>
        </defs>
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          className="stroke-muted"
          strokeWidth="1.5"
        />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke={`url(#${DONUT_GRADIENT_ID})`}
          strokeWidth="1.5"
          strokeDasharray={`${filled} ${DONUT_TRACK_CIRCUMFERENCE}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`${numberClassName} font-normal tracking-tight leading-none whitespace-nowrap bg-gradient-to-r from-insight-800 to-primary-600 dark:from-insight-500 dark:to-primary-400 bg-clip-text text-transparent`}
        >
          {cardData.kpiNumber}
        </span>
        {cardData.kpiDescription && (
          <span className={`mt-1 ${labelClassName} text-muted-foreground`}>
            {cardData.kpiDescription}
          </span>
        )}
      </div>
    </div>
  );
}

function ProportionBarVisual({ cardData }: { cardData: InsightCardData }) {
  const segments = cardData.proportionSegments ?? [];
  const onContract = segments[0];
  const offContract = segments.at(-1);
  if (!onContract || !offContract) return null;

  return (
    <div className="mt-4">
      <p className="text-[10px] text-muted-foreground">
        {cardData.proportionCaptionTotal}
      </p>
      <div className="mt-1 flex h-1.5 w-full gap-0.5">
        <div
          className="h-full rounded-l-full bg-chart-5 opacity-35"
          style={{ flex: onContract.value }}
        />
        <div
          className={`h-full rounded-r-full ${ACCENT_CLASS}`}
          style={{ flex: offContract.value }}
        />
      </div>
      <div className="mt-0.5 flex gap-0.5 text-[10px] text-muted-foreground">
        <div className="flex justify-start" style={{ flex: onContract.value }}>
          <span>{cardData.proportionCaptionLeft}</span>
        </div>
        <div className="flex justify-end" style={{ flex: offContract.value }}>
          <span className="font-semibold text-foreground">
            {cardData.proportionCaptionRight}
          </span>
        </div>
      </div>
    </div>
  );
}

const REASON_CHART_COLORS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

function IntakeQualityExpanded({ cardData }: { cardData: InsightCardData }) {
  const reasons = cardData.expandContent?.bars ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-8">
        <p className="flex-1 text-2xl leading-snug font-normal tracking-tight text-foreground">
          {cardData.expandContent?.finding}
        </p>
        <div className="size-32 shrink-0">
          <DonutFigure
            cardData={cardData}
            numberClassName="text-lg"
            labelClassName="text-[10px]"
          />
        </div>
      </div>
      <div className="mt-10 flex min-h-0 flex-1 flex-col">
        <p className="text-xs font-bold text-muted-foreground">
          {cardData.expandContent?.heading}
        </p>
        <div className="mt-4 flex flex-col gap-5">
          {reasons.map((reason, i) => (
            <div key={reason.label}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium">{reason.label}</span>
                <span className="font-bold">{reason.value}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted dark:bg-foreground/10">
                <div
                  className={`h-full rounded-full ${REASON_CHART_COLORS[i % REASON_CHART_COLORS.length]}`}
                  style={{ width: `${reason.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <AiCaveat />
    </div>
  );
}

function ProportionBarFace({
  cardData,
  showFootLine = true,
}: {
  cardData: InsightCardData;
  showFootLine?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <span className="text-4xl font-normal tracking-tight leading-none whitespace-nowrap bg-clip-text text-transparent [background-image:var(--ai-gradient-text)]">
        {cardData.kpiNumber}
      </span>
      {cardData.kpiDescription && (
        <span className="mt-1 text-sm text-muted-foreground">
          {cardData.kpiDescription}
        </span>
      )}
      <ProportionBarVisual cardData={cardData} />
      {showFootLine && (
        <div className="mt-auto space-y-1.5">
          <FindingsFoot lines={cardData.footLines} clampLines={3} />
        </div>
      )}
    </div>
  );
}

function OffContractSpendExpanded({ cardData }: { cardData: InsightCardData }) {
  const facts = cardData.expandContent?.emphasisFacts ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-8">
        <ProportionBarFace cardData={cardData} showFootLine={false} />
        <div className="flex min-h-0 flex-col justify-center gap-4">
          <p className="text-xs font-bold text-muted-foreground">
            {cardData.expandContent?.heading}
          </p>
          {facts.map((fact) => (
            <div key={fact.lead} className="flex items-start gap-2">
              <Circle
                className={`mt-1 size-2 shrink-0 fill-current ${ACCENT_TEXT_CLASS}`}
              />
              <p className="text-sm leading-relaxed text-foreground">
                <span className="font-semibold">{fact.lead}</span>
                {fact.rest}
              </p>
            </div>
          ))}
        </div>
      </div>
      <AiCaveat />
    </div>
  );
}

function KpiContent({
  cardData,
  isExpanded = false,
}: {
  cardData: InsightCardData;
  isExpanded?: boolean;
}) {
  if (cardData.chartType === "donut") {
    if (isExpanded && (cardData.expandContent?.bars?.length ?? 0) > 0) {
      return <IntakeQualityExpanded cardData={cardData} />;
    }
    return (
      <div className="flex flex-1 flex-col min-h-0 items-center">
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <DonutFigure cardData={cardData} />
        </div>
        <div className="mt-auto w-full space-y-1.5">
          <FindingsFoot lines={cardData.footLines} clampLines={3} />
        </div>
      </div>
    );
  }

  if (cardData.chartType === "proportion-bar") {
    if (isExpanded && cardData.expandContent?.emphasisFacts?.length) {
      return <OffContractSpendExpanded cardData={cardData} />;
    }
    return <ProportionBarFace cardData={cardData} />;
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <span className="text-4xl font-normal tracking-tight leading-none whitespace-nowrap bg-clip-text text-transparent [background-image:var(--ai-gradient-text)]">
        {cardData.kpiNumber}
      </span>
      {cardData.kpiDescription && (
        <span className="mt-1.5 text-sm text-muted-foreground">
          {cardData.kpiDescription}
        </span>
      )}
      <div className="mt-auto space-y-1.5">
        <FindingsFoot lines={cardData.footLines} clampLines={3} />
      </div>
    </div>
  );
}

const ACCENT_CLASS = "bg-chart-1";
const ACCENT_TEXT_CLASS = "text-chart-1";

function rankColors(
  bars: { label: string; value: number }[],
  longestColor: string,
  otherColors: string[],
) {
  const maxValue = Math.max(...bars.map((b) => b.value), 0);
  let otherIdx = 0;
  return bars.map((bar) =>
    maxValue > 0 && bar.value === maxValue
      ? longestColor
      : otherColors[otherIdx++ % otherColors.length],
  );
}

function RankedBars({
  bars,
  unit,
  colors,
}: {
  bars: { label: string; value: number }[];
  unit: string;
  colors: string[];
}) {
  const maxValue = Math.max(...bars.map((b) => b.value), 0);
  return (
    <div className="flex flex-col gap-5">
      {bars.map((bar, i) => {
        const widthPct = maxValue > 0 ? (bar.value / maxValue) * 100 : 0;
        const isLongest = maxValue > 0 && bar.value === maxValue;
        return (
          <div key={bar.label}>
            <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
              <TruncatedText className="min-w-0 flex-1 font-medium" lines={1}>
                {bar.label}
              </TruncatedText>
              <span className="shrink-0 font-bold whitespace-nowrap">
                {bar.value}
                {unit}
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-muted dark:bg-foreground/10">
              <div
                className={`h-full rounded-full ${colors[i]} ${isLongest ? "" : "opacity-35"}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const LONGEST_STAGE_COLOR = "bg-chart-3";
const STAGE_COLORS = ["bg-chart-1", "bg-chart-2", "bg-chart-4", "bg-chart-5"];
const COMMODITY_COLORS = ["bg-chart-2", "bg-chart-4"];

function StageDurationBarsContent({
  cardData,
  isExpanded = false,
}: {
  cardData: InsightCardData;
  isExpanded?: boolean;
}) {
  const bars = cardData.bars ?? [];
  const unit = cardData.barsUnit ?? "";
  const stageColors = rankColors(bars, LONGEST_STAGE_COLOR, STAGE_COLORS);

  if (isExpanded && cardData.expandContent?.bars) {
    const cmBars = cardData.expandContent.bars;
    const cmUnit = cardData.expandContent.barsUnit ?? "";
    const cmColors = rankColors(cmBars, ACCENT_CLASS, COMMODITY_COLORS);
    const average = cardData.expandContent.average ?? 0;
    const cmMax = Math.max(...cmBars.map((b) => b.value), 0);
    const markerPct = cmMax > 0 ? (average / cmMax) * 100 : 0;

    return (
      <div className="flex flex-1 flex-col min-h-0">
        <p className="text-xs font-bold text-muted-foreground">
          {cardData.expandContent.stageHeading}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {cardData.expandContent.connectingLine}
        </p>
        <div className="mt-4">
          <RankedBars bars={bars} unit={unit} colors={stageColors} />
        </div>
        <p className="mt-10 text-xs font-bold text-muted-foreground">
          {cardData.expandContent.commodityHeading}
        </p>
        <div className="relative mt-3">
          <div
            className="pointer-events-none absolute inset-y-0 w-px bg-muted-foreground/30"
            style={{ left: `${markerPct}%` }}
          />
          <RankedBars bars={cmBars} unit={cmUnit} colors={cmColors} />
        </div>
        <div className="relative mt-1 h-3.5">
          <span
            className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] text-muted-foreground"
            style={{ left: `${markerPct}%` }}
          >
            Average {average}
            {cmUnit}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <RankedBars bars={bars} unit={unit} colors={stageColors} />
      <FindingsFoot lines={cardData.footLines} className="mt-5" />
    </div>
  );
}

export function InsightCardBody({
  content,
  cardIndex,
  isExpanded = false,
}: {
  content: InsightCardContent;
  cardIndex: number;
  isExpanded?: boolean;
}) {
  const { data } = useDashboardData();
  const cardData = data.insightCards[cardIndex] ?? data.insightCards[0];

  if (content.type === "kpi") {
    return <KpiContent cardData={cardData} isExpanded={isExpanded} />;
  }
  if (content.chartType === "stage-duration-bars")
    return (
      <StageDurationBarsContent cardData={cardData} isExpanded={isExpanded} />
    );
  if (content.chartType === "sparkline") return <SparklineContent />;
  return <AreaContent />;
}
