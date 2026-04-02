"use client";

import { motion } from "framer-motion";
import { ArrowRight, Pin, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { cardVariants } from "@/registry/card/card";
import {
  AiStarIcon,
  type ChartSpec,
  FollowUpChips,
  getQueryContext,
  NumberedList,
} from "./shared";

// ── Component-local data ──────────────────────────────────────────────────────

const analystData = [
  {
    name: "Sarah K.",
    days: 17.3,
    loanType: "FHA",
    note: "Title search delays, Harris County",
  },
  {
    name: "Marcus L.",
    days: 16.8,
    loanType: "Conventional",
    note: "Mixed complexity queue",
  },
  {
    name: "Dana R.",
    days: 16.1,
    loanType: "Jumbo",
    note: "Documentation backlog",
  },
  {
    name: "Wei C.",
    days: 15.6,
    loanType: "VA",
    note: "New analyst, onboarding",
  },
  {
    name: "Priya S.",
    days: 15.2,
    loanType: "FHA",
    note: "2 cases pending supervisor review",
  },
];

const chatFollowUps = [
  "Show Sarah's open cases",
  "What's causing the Harris County delays?",
  "Draft a coaching note for Marcus",
  "Flag these 5 for supervisor review",
];

const heroFhaFollowUps = [
  "Show FHA cases assigned to Sarah K.",
  "Avg title search time in Harris County?",
  "Which other counties have similar delays?",
  "Draft an escalation for Harris County",
];

const heroDelaysFollowUps = [
  "Which delay factor grew most this quarter?",
  "Show cases affected by title search delays",
  "Compare delay factors vs. last quarter",
  "What would reduce delays the fastest?",
];

const heroComparisonFollowUps = [
  "Show month-over-month breakdown",
  "Which loan type improved most in Feb?",
  "What drove the February improvement?",
  "Export this comparison report",
];

const topIssuesFollowUps = [
  "Show cases flagged for risk phrases",
  "Which loan types have the most credit report flags?",
  "What would cut compliance flags by 30%?",
  "Trend these issues over the last 6 months",
];

const pipelineFollowUps = [
  "Which stage has the longest average dwell time?",
  "Show cases stuck in underwriting >5 days",
  "Compare pipeline velocity vs. last month",
  "Flag cases at risk of missing SLA",
];

// Chart data for card-chat responses
const topIssuesChartData = [
  { label: "Risk phrase flag", value: 34 },
  { label: "Credit report age", value: 29 },
  { label: "Owner name mismatch", value: 23 },
  { label: "High DTI ratio", value: 14 },
  { label: "Missing appraisal", value: 11 },
];

const pipelineChartData = [
  { label: "Mon", value: 42, value2: 18, value3: 8 },
  { label: "Tue", value: 38, value2: 22, value3: 11 },
  { label: "Wed", value: 51, value2: 15, value3: 9 },
  { label: "Thu", value: 45, value2: 20, value3: 14 },
  { label: "Fri", value: 39, value2: 25, value3: 7 },
];

// ── ChartBlock ────────────────────────────────────────────────────────────────

type ChartType = "bar" | "area" | "donut" | "sparkline";

const CHART_TYPES: ChartType[] = ["bar", "area", "donut", "sparkline"];
const CHART_LABELS: Record<ChartType, string> = {
  bar: "Bar",
  area: "Area",
  donut: "Donut",
  sparkline: "Spark",
};

function ChartDisplay({
  type,
  data,
}: {
  type: ChartType;
  data: ChartSpec["data"];
}) {
  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={120}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
          barSize={14}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              borderRadius: 6,
              border: "1px solid var(--border)",
            }}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
        >
          <defs>
            <linearGradient id="chat-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              borderRadius: 6,
              border: "1px solid var(--border)",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#chat-area-fill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === "donut") {
    const total = data.reduce((s, d) => s + d.value, 0);
    return (
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={100} height={100}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={28}
              outerRadius={44}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-1 min-w-0">
          {data.slice(0, 4).map((d, i) => (
            <div
              key={d.label}
              className="flex items-center gap-1.5 text-[11px]"
            >
              <div
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: `var(--chart-${(i % 5) + 1})` }}
              />
              <span className="text-muted-foreground truncate">{d.label}</span>
              <span className="ml-auto font-medium text-foreground pl-2">
                {Math.round((d.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // sparkline
  const max = Math.max(...data.map((d) => d.value));
  const w = 200;
  const h = 50;
  const step = w / (data.length - 1);
  const points = data
    .map((d, i) => `${i * step},${h - (d.value / max) * (h - 6) - 3}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14" fill="none">
      <polyline
        points={points}
        stroke="var(--chart-1)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={parseFloat(points.split(" ").at(-1)!.split(",")[0])}
        cy={parseFloat(points.split(" ").at(-1)!.split(",")[1])}
        r="3"
        fill="var(--chart-1)"
      />
    </svg>
  );
}

function ChartBlock({
  spec,
  context,
  onPin,
}: {
  spec: ChartSpec;
  context?: ChartSpec["context"];
  onPin: (spec: ChartSpec) => void;
}) {
  const [chartType, setChartType] = useState<ChartType>(spec.type);

  return (
    <div className="rounded-lg border border-border bg-background/60 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium text-foreground">{spec.title}</p>
        <button
          type="button"
          onClick={() => onPin({ ...spec, type: chartType, context })}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <Pin className="h-3 w-3" />
          Pin
        </button>
      </div>
      <ChartDisplay type={chartType} data={spec.data} />
      <div className="flex gap-1">
        {CHART_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setChartType(t)}
            className={cn(
              "rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
              chartType === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {CHART_LABELS[t]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  query?: string;
  onClose: () => void;
  direction?: "left" | "right";
  onPinChart?: (spec: ChartSpec) => void;
  onSubmit?: (q: string) => void;
}

export function ChatPanel({
  query,
  onClose,
  direction = "left",
  onPinChart,
  onSubmit,
}: ChatPanelProps) {
  const [showResponse, setShowResponse] = useState(false);
  const [followUp, setFollowUp] = useState("");

  useEffect(() => {
    if (!query) return;
    setShowResponse(false);
    const t = setTimeout(() => setShowResponse(true), 900);
    return () => clearTimeout(t);
  }, [query]);

  const ctx = query ? getQueryContext(query) : null;

  const topIssuesChartSpec: ChartSpec = {
    id: "top-issues-chart",
    type: "bar",
    title: "Issue frequency by type",
    data: topIssuesChartData,
    query: query ?? "",
  };

  const pipelineChartSpec: ChartSpec = {
    id: "pipeline-chart",
    type: "bar",
    title: "Pipeline by stage (this week)",
    data: pipelineChartData,
    query: query ?? "",
  };

  return (
    <motion.div
      className={cn(
        cardVariants({ variant: "glass" }),
        "flex flex-col overflow-hidden gap-0 p-0 h-full",
        direction === "left" && "rounded-tl-none rounded-bl-none",
      )}
      variants={{
        hidden: { opacity: 0, x: direction === "left" ? "-100%" : 48 },
        visible: {
          opacity: 1,
          x: 0,
          transition: {
            type: "spring",
            stiffness: 220,
            damping: 30,
            mass: 0.8,
          },
        },
        exit: {
          opacity: 0,
          x: direction === "left" ? "-100%" : 48,
          transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
        },
      }}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border/60 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <AiStarIcon className="h-4 w-4 text-primary" />
          <span className="text-[13px] font-semibold text-foreground">
            Autopilot
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {!query ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 px-2 py-6">
            <div className="text-center">
              <p className="text-xl font-semibold tracking-tight text-foreground">
                Ask Autopilot
              </p>
              <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
                Ask anything about your pipeline, team, or data.
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full">
              {[
                "What's driving the drop in first-pass decisions this week?",
                "Which analysts have the most cases approaching SLA?",
                "What's the best way to reduce title search delays?",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onSubmit?.(q)}
                  className="group flex items-start gap-2.5 rounded-xl border border-border/50 bg-card/40 px-3.5 py-2.5 text-left transition-all hover:border-primary/30 hover:bg-card/70"
                >
                  <AiStarIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary/40 group-hover:text-primary transition-colors" />
                  <span className="text-[12.5px] text-foreground/65 leading-snug group-hover:text-foreground transition-colors">
                    {q}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-end">
              <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-[13px] leading-relaxed text-primary-foreground">
                {query}
              </div>
            </div>

            {!showResponse ? (
              <div className="flex items-center gap-2.5">
                <AiStarIcon className="h-4 w-4 flex-shrink-0 text-primary" />
                <div className="flex gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <motion.div
                className="flex gap-2.5"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <AiStarIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <div className="min-w-0 flex-1 space-y-3 text-[13px] leading-relaxed text-foreground/90">
                  {ctx === "card-top-issues" && (
                    <>
                      <p>
                        The top 3 issue types account for{" "}
                        <span className="font-semibold text-foreground">
                          86%
                        </span>{" "}
                        of flagged cases this quarter. Risk phrase flags are the
                        largest driver at 34%, growing 12% since last quarter.
                      </p>
                      <ChartBlock
                        spec={topIssuesChartSpec}
                        context={{
                          summary:
                            "The top 3 issue types account for 86% of flagged cases this quarter. Risk phrase flags are the largest driver at 34%, growing 12% since last quarter.",
                          items: [
                            {
                              n: 1,
                              title: "Risk phrase flags (+12% QoQ)",
                              detail:
                                "Mostly in FHA application notes — 'financial hardship' triggers auto-flag in 28% of cases",
                            },
                            {
                              n: 2,
                              title: "Credit report age violations",
                              detail:
                                "29% of flagged cases have reports older than 120 days at submission — intake gap",
                            },
                            {
                              n: 3,
                              title: "Owner name mismatches",
                              detail:
                                "23% — typically aliases or legal name variations; most resolvable in <15 min",
                            },
                          ],
                        }}
                        onPin={(s) => onPinChart?.(s)}
                      />
                      <NumberedList
                        badge="warning"
                        items={[
                          {
                            n: 1,
                            title: "Risk phrase flags (+12% QoQ)",
                            detail:
                              "Mostly in FHA application notes — 'financial hardship' triggers auto-flag in 28% of cases",
                          },
                          {
                            n: 2,
                            title: "Credit report age violations",
                            detail:
                              "29% of flagged cases have reports older than 120 days at submission — intake gap",
                          },
                          {
                            n: 3,
                            title: "Owner name mismatches",
                            detail:
                              "23% — typically aliases or legal name variations; most resolvable in <15 min",
                          },
                        ]}
                      />
                      <FollowUpChips
                        items={topIssuesFollowUps}
                        onSelect={setFollowUp}
                      />
                    </>
                  )}

                  {ctx === "card-pipeline" && (
                    <>
                      <p>
                        Pipeline is{" "}
                        <span className="font-semibold text-foreground">
                          280 active cases
                        </span>{" "}
                        this week, up 13% from last month. Underwriting is the
                        primary bottleneck — average dwell time is 4.2 days vs.
                        a 2.5 day target.
                      </p>
                      <ChartBlock
                        spec={pipelineChartSpec}
                        context={{
                          summary:
                            "Pipeline is 280 active cases this week, up 13% from last month. Underwriting is the primary bottleneck — average dwell time is 4.2 days vs. a 2.5 day target.",
                          items: [
                            {
                              n: 1,
                              title: "Underwriting backlog",
                              detail:
                                "42 cases waiting >3 days — 18 are FHA, 14 are Jumbo. Capacity issue on complex loans.",
                            },
                            {
                              n: 2,
                              title: "Approval pending docs",
                              detail:
                                "25 cases stalled awaiting applicant follow-up. Avg response time 2.8 days.",
                            },
                            {
                              n: 3,
                              title: "SLA at-risk cases",
                              detail:
                                "8 cases are within 1 day of breaching SLA — recommend immediate escalation.",
                            },
                          ],
                        }}
                        onPin={(s) => onPinChart?.(s)}
                      />
                      <NumberedList
                        badge="warning"
                        items={[
                          {
                            n: 1,
                            title: "Underwriting backlog",
                            detail:
                              "42 cases waiting >3 days — 18 are FHA, 14 are Jumbo. Capacity issue on complex loans.",
                          },
                          {
                            n: 2,
                            title: "Approval pending docs",
                            detail:
                              "25 cases stalled awaiting applicant follow-up. Avg response time 2.8 days.",
                          },
                          {
                            n: 3,
                            title: "SLA at-risk cases",
                            detail:
                              "8 cases are within 1 day of breaching SLA — recommend immediate escalation.",
                          },
                        ]}
                      />
                      <FollowUpChips
                        items={pipelineFollowUps}
                        onSelect={setFollowUp}
                      />
                    </>
                  )}

                  {ctx === "hero-fha" && (
                    <>
                      <p>
                        FHA setup time is averaging{" "}
                        <span className="font-semibold text-foreground">
                          16.1 days
                        </span>{" "}
                        — 2.1 days above the 14-day target. The primary blocker
                        is title search turnaround in Harris County.
                      </p>
                      <NumberedList
                        badge="warning"
                        items={[
                          {
                            n: 1,
                            title: "Harris County title search delays",
                            detail:
                              "Third-party vendor averaging 8.3 days vs 4.1 day benchmark — affects 34% of FHA cases in queue",
                          },
                          {
                            n: 2,
                            title: "Documentation completeness at intake",
                            detail:
                              "FHA requires 2.4 more documents on average than Conventional — 28% arrive incomplete",
                          },
                          {
                            n: 3,
                            title: "Analyst FHA specialization gap",
                            detail:
                              "Only 3 of 12 analysts are FHA-certified; overflow cases go to generalists averaging +2.8 days",
                          },
                        ]}
                      />
                      <p className="text-foreground/75">
                        Sarah K. handles the most FHA volume and is the most
                        impacted — 7 of her 12 open cases are FHA with Harris
                        County title holds.
                      </p>
                      <FollowUpChips
                        items={heroFhaFollowUps}
                        onSelect={setFollowUp}
                      />
                    </>
                  )}

                  {ctx === "hero-delays" && (
                    <>
                      <p>
                        Three delay categories account for{" "}
                        <span className="font-semibold text-foreground">
                          81% of above-target cases
                        </span>{" "}
                        this quarter:
                      </p>
                      <NumberedList
                        badge="warning"
                        items={[
                          {
                            n: 1,
                            title: "Third-party title search",
                            detail:
                              "Avg 6.8 days in affected counties — up from 4.2 days last quarter. Accounts for 44% of total delay",
                          },
                          {
                            n: 2,
                            title: "Incomplete documentation at intake",
                            detail:
                              "Missing docs require analyst follow-up adding 2.3 days avg. 28% of FHA and 19% of Jumbo cases affected",
                          },
                          {
                            n: 3,
                            title: "Supervisor review queue backlog",
                            detail:
                              "High-complexity cases waiting avg 1.9 days for supervisor sign-off — backlog grew 22% in Feb",
                          },
                        ]}
                      />
                      <p className="text-foreground/75">
                        Title search delays are the fastest-growing factor — up
                        62% quarter-over-quarter.
                      </p>
                      <FollowUpChips
                        items={heroDelaysFollowUps}
                        onSelect={setFollowUp}
                      />
                    </>
                  )}

                  {ctx === "hero-comparison" && (
                    <>
                      <p>
                        Setup time improved{" "}
                        <span className="font-semibold text-foreground">
                          3.5 days (21%)
                        </span>{" "}
                        from last quarter to Feb. Key shifts:
                      </p>
                      <div className="overflow-hidden rounded-lg border border-border">
                        <table className="w-full text-[12px]">
                          <thead>
                            <tr className="border-b border-border bg-muted/40">
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                Metric
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                Q4 avg
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                Feb
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                Change
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              {
                                metric: "Avg setup time",
                                q4: "16.4d",
                                feb: "12.9d",
                                change: "−3.5d",
                                good: true,
                              },
                              {
                                metric: "First-pass rate",
                                q4: "87.4%",
                                feb: "94.2%",
                                change: "+6.8%",
                                good: true,
                              },
                              {
                                metric: "SLA compliance",
                                q4: "98.3%",
                                feb: "99.5%",
                                change: "+1.2%",
                                good: true,
                              },
                              {
                                metric: "Volume (apps)",
                                q4: "248",
                                feb: "280",
                                change: "+13%",
                                good: false,
                              },
                            ].map((row, i, arr) => (
                              <tr
                                key={row.metric}
                                className={
                                  i < arr.length - 1
                                    ? "border-b border-border/60"
                                    : ""
                                }
                              >
                                <td className="px-3 py-2 text-muted-foreground">
                                  {row.metric}
                                </td>
                                <td className="px-3 py-2 text-foreground">
                                  {row.q4}
                                </td>
                                <td className="px-3 py-2 font-medium text-foreground">
                                  {row.feb}
                                </td>
                                <td
                                  className={`px-3 py-2 font-medium ${row.good ? "text-success" : "text-warning"}`}
                                >
                                  {row.change}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <FollowUpChips
                        items={heroComparisonFollowUps}
                        onSelect={setFollowUp}
                      />
                    </>
                  )}

                  {ctx === "hero-analysts" && (
                    <>
                      <p>
                        Based on February data,{" "}
                        <span className="font-semibold text-foreground">
                          8 analysts
                        </span>{" "}
                        are averaging above the 14-day target. Here are the top
                        5:
                      </p>
                      <div className="overflow-hidden rounded-lg border border-border">
                        <table className="w-full text-[12px]">
                          <thead>
                            <tr className="border-b border-border bg-muted/40">
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                Analyst
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                Avg Days
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                Loan Type
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                Note
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {analystData.map((a, i) => (
                              <tr
                                key={a.name}
                                className={
                                  i < analystData.length - 1
                                    ? "border-b border-border/60"
                                    : ""
                                }
                              >
                                <td className="px-3 py-2 font-medium text-foreground">
                                  {a.name}
                                </td>
                                <td className="px-3 py-2 font-medium text-warning">
                                  {a.days} days
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">
                                  {a.loanType}
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">
                                  {a.note}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <FollowUpChips
                        items={chatFollowUps}
                        onSelect={setFollowUp}
                      />
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border/60 p-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2.5 transition-colors focus-within:border-primary/40">
          <input
            type="text"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && followUp.trim()) {
                onSubmit?.(followUp.trim());
                setFollowUp("");
              }
            }}
            placeholder={
              query ? "Ask a follow-up…" : "Ask anything about your dashboard…"
            }
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
          <button
            type="button"
            disabled={!followUp.trim()}
            onClick={() => {
              if (followUp.trim()) {
                onSubmit?.(followUp.trim());
                setFollowUp("");
              }
            }}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
