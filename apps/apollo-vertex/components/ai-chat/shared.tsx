"use client";

import { TrendingDown } from "lucide-react";

// ── Query context type + classifier ──────────────────────────────────────────

export type QueryContext =
  | "sla-risk"
  | "sla-loan-types"
  | "sla-deadline"
  | "first-pass"
  | "top-issues"
  | "loan-volume"
  | "hero-fha"
  | "hero-delays"
  | "hero-comparison"
  | "hero-analysts"
  | "card-top-issues"
  | "card-pipeline";

export interface ChartContext {
  summary: string;
  items: { n: number; title: string; detail: string }[];
}

export interface ChartSpec {
  id: string;
  type: "bar" | "area" | "donut" | "sparkline";
  title: string;
  data: { label: string; value: number; value2?: number; value3?: number }[];
  query: string;
  context?: ChartContext;
}

export function getQueryContext(query: string): QueryContext {
  const q = query.toLowerCase();
  if (q.includes("at risk")) return "sla-risk";
  if (q.includes("sla threshold") || q.includes("closest to the sla"))
    return "sla-loan-types";
  if (q.includes("approaching the sla") || q.includes("sla deadline"))
    return "sla-deadline";
  if (q.includes("first-pass") || q.includes("6.8%")) return "first-pass";
  if (
    q.includes("flagged compliance") ||
    q.includes("compliance issues") ||
    q.includes("risk phrase flag") ||
    q.includes("flag rates") ||
    q.includes("record mismatch")
  )
    return "top-issues";
  if (
    q.includes("volume increase") ||
    (q.includes("volume") && q.includes("august"))
  )
    return "loan-volume";
  if (q.includes("slowing setup") || (q.includes("fha") && q.includes("setup")))
    return "hero-fha";
  if (q.includes("delay factors")) return "hero-delays";
  if (q.includes("compare") && q.includes("last quarter"))
    return "hero-comparison";
  if (
    q.includes("top issues") ||
    q.includes("loan performance") ||
    q.includes("issue type") ||
    q.includes("reduce top issues") ||
    q.includes("impacting loan")
  )
    return "card-top-issues";
  if (
    q.includes("pipeline") ||
    q.includes("pipeline status") ||
    q.includes("pipeline health")
  )
    return "card-pipeline";
  return "hero-analysts";
}

// ── Shared primitive components ───────────────────────────────────────────────

export function AiStarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M425.012 286.136C323.744 268.976 243.832 184.675 227.568 77.8437C227.262 75.8272 224.784 75.8272 224.477 77.8437C208.214 184.675 128.302 268.976 27.0344 286.136C25.1218 286.459 25.1218 289.074 27.0344 289.397C128.302 306.553 208.214 390.858 224.477 497.689C224.784 499.706 227.262 499.706 227.568 497.689C243.832 390.858 323.744 306.553 425.012 289.397C426.923 289.074 426.923 286.459 425.012 286.136ZM325.517 288.582C274.883 297.16 234.927 339.312 226.796 392.728C226.642 393.736 225.403 393.736 225.25 392.728C217.118 339.312 177.162 297.16 126.528 288.582C125.572 288.42 125.572 287.113 126.528 286.951C177.162 278.371 217.118 236.22 225.25 182.805C225.403 181.797 226.642 181.797 226.796 182.805C234.927 236.22 274.883 278.371 325.517 286.951C326.473 287.113 326.473 288.42 325.517 288.582Z" />
      <path d="M485.683 119.333C435.049 127.911 395.093 170.064 386.962 223.479C386.808 224.487 385.569 224.487 385.416 223.479C377.284 170.064 337.328 127.911 286.694 119.333C285.738 119.171 285.738 117.864 286.694 117.702C337.328 109.123 377.284 66.9716 385.416 13.5562C385.569 12.548 386.808 12.548 386.962 13.5562C395.093 66.9716 435.049 109.123 485.683 117.702C486.639 117.864 486.639 119.171 485.683 119.333Z" />
    </svg>
  );
}

export function TrendBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
      <TrendingDown className="h-3 w-3" />
      {value}
    </span>
  );
}

export function NumberedList({
  items,
  badge = "success",
}: {
  items: { n: number; title: string; detail: string }[];
  badge?: "success" | "warning";
}) {
  const badgeClass =
    badge === "warning"
      ? "bg-warning/15 text-warning"
      : "bg-success/15 text-success";
  return (
    <div className="space-y-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-[12px]">
      {items.map(({ n, title, detail }) => (
        <div key={n} className="flex items-start gap-2">
          <span
            className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${badgeClass}`}
          >
            {n}
          </span>
          <div>
            <span className="font-medium text-foreground">{title}</span>
            <p className="mt-0.5 text-muted-foreground">{detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FollowUpChips({
  items,
  onSelect,
}: {
  items: string[];
  onSelect: (s: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {items.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[11px] text-foreground/65 transition-all hover:border-primary/40 hover:bg-background hover:text-foreground"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

export function LoanTypeRows({
  data,
}: {
  data: { type: string; rate: number; color: string }[];
}) {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.type} className="space-y-1">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-foreground/80">{item.type}</span>
            <span className="font-medium text-foreground">{item.rate}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${item.color}`}
              style={{ width: `${item.rate}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Shared data (used by more than one component) ─────────────────────────────

export const topIssues = [
  {
    label: "Flagged risk phrase in application notes",
    pct: 34,
    color: "bg-chart-1",
  },
  {
    label: "Credit report outside of 120 day compliance window",
    pct: 29,
    color: "bg-chart-2",
  },
  {
    label: "Property owner record doesn't match applicant name",
    pct: 23,
    color: "bg-chart-3",
  },
  { label: "High DTI ratio", pct: 14, color: "bg-chart-4" },
];

export const volumeData = [
  { month: "Mar", approved: 160, denied: 110, cancelled: 30 },
  { month: "Apr", approved: 155, denied: 115, cancelled: 28 },
  { month: "May", approved: 162, denied: 108, cancelled: 32 },
  { month: "Jun", approved: 170, denied: 112, cancelled: 25 },
  { month: "Jul", approved: 175, denied: 118, cancelled: 27 },
  { month: "Aug", approved: 210, denied: 130, cancelled: 35 },
  { month: "Sep", approved: 230, denied: 140, cancelled: 30 },
  { month: "Oct", approved: 250, denied: 145, cancelled: 40 },
  { month: "Nov", approved: 260, denied: 150, cancelled: 38 },
  { month: "Dec", approved: 270, denied: 155, cancelled: 42 },
  { month: "Jan", approved: 275, denied: 148, cancelled: 36 },
  { month: "Feb", approved: 280, denied: 152, cancelled: 38 },
];
