"use client";

import { Badge } from "@/components/ui/badge";
import type { InsightCardContent } from "./glow-config";

// --- Sample data per card type ---

const kpiSamples = [
  {
    title: "Upfront decision efficiency",
    number: "94.2%",
    badge: "+6.8%",
    description: "Loans finalized on first review without rework.",
  },
  {
    title: "SLA compliance",
    number: "99.5%",
    badge: "+1.2%",
    description: "Loans processed within defined SLA thresholds.",
  },
  {
    title: "Automation rate",
    number: "78.3%",
    badge: "+4.1%",
    description: "Processes completed without manual intervention.",
  },
  {
    title: "First-pass yield",
    number: "91.7%",
    badge: "+2.3%",
    description: "Documents accepted on initial submission.",
  },
];

const barSamples = [
  { label: "Risk flag in notes", value: 34, color: "bg-chart-1" },
  { label: "Credit report >120 days old", value: 29, color: "bg-chart-2" },
  { label: "Owner name mismatch", value: 23, color: "bg-chart-3" },
  { label: "High DTI ratio", value: 14, color: "bg-chart-4" },
];

const sparklinePoints = [4, 7, 5, 9, 6, 8, 12, 10, 14, 11, 15, 13];
const areaPoints = [3, 5, 4, 8, 6, 9, 7, 11, 10, 14, 12, 16];

// --- Renderers ---

function KpiContent({ title }: { title: string }) {
  const sample = kpiSamples.find((s) => s.title === title) ?? kpiSamples[0];

  return (
    <>
      <div className="text-5xl font-normal tracking-tight leading-none bg-gradient-to-r from-insight-800 to-primary-600 dark:from-insight-500 dark:to-primary-400 bg-clip-text text-transparent">
        {sample.number}
      </div>
      <div className="mt-auto">
        <Badge variant="secondary" status="info" className="mb-2">
          {sample.badge}
        </Badge>
        <p className="text-xs font-normal text-muted-foreground">
          {sample.description}
        </p>
      </div>
    </>
  );
}

function DonutContent() {
  return (
    <>
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
      <p className="text-xs font-normal text-muted-foreground mt-auto">
        $1.58M away from your $3M funded target — 3 closings to go
      </p>
    </>
  );
}

function HorizontalBarsContent() {
  return (
    <div className="flex flex-col justify-between h-4/5">
      {barSamples.map((issue) => (
        <div key={issue.label}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium">{issue.label}</span>
            <span className="font-bold">{issue.value}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${issue.color}`}
              style={{ width: `${issue.value}%` }}
            />
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
    <>
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
      <p className="text-xs font-normal text-muted-foreground mt-auto">
        Trending upward over the last 12 weeks
      </p>
    </>
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
    <>
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
      <p className="text-xs font-normal text-muted-foreground mt-auto">
        Volume trending up — 16% increase over prior period
      </p>
    </>
  );
}

export function InsightCardBody({ content }: { content: InsightCardContent }) {
  if (content.type === "kpi") {
    return <KpiContent title={content.title} />;
  }
  if (content.chartType === "horizontal-bars") return <HorizontalBarsContent />;
  if (content.chartType === "donut") return <DonutContent />;
  if (content.chartType === "sparkline") return <SparklineContent />;
  return <AreaContent />;
}
