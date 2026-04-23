"use client";

import { useChat } from "@tanstack/ai-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  MessagesSquare,
  Minimize2,
  MoreHorizontal,
  Pin,
  X,
} from "lucide-react";
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
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { createAgentHubConnection } from "@/registry/ai-chat/adapters/agenthub/adapter";
import { AiChatLoading } from "@/registry/ai-chat/components/ai-chat-loading";
import { AiChatMessage } from "@/registry/ai-chat/components/ai-chat-message";
import { AiChatProvider } from "@/registry/ai-chat/components/ai-chat-provider";
import { AutopilotGradientIcon } from "@/registry/ai-chat/components/icons/autopilot-gradient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/alert-dialog/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/dropdown-menu/dropdown-menu";
import { useDashboardChat } from "./DashboardChatProvider";
import { useDashboardData } from "./DashboardDataProvider";
import type { InsightCardData } from "./dashboard-data";
import { createDemoConnection } from "./demo-connection";
import type { CardConfig, CardGradient } from "./glow-config";

type PendingScreen = { label: string; cards: InsightCardData[] };

const CHIP_EASE = [0.22, 1, 0.36, 1] as const;

// --- Mini chart preview components ---

function parsePercent(s?: string): number {
  if (!s) return 0.72;
  const m = s.match(/([\d.]+)%/);
  return m ? Math.min(1, parseFloat(m[1]) / 100) : 0.72;
}

function MiniDonut({ card }: { card: InsightCardData }) {
  const pct = card.donutPercent ?? parsePercent(card.kpiNumber);
  const r = 13;
  const cx = 18;
  const cy = 18;
  const sw = 4;
  const circ = 2 * Math.PI * r;
  return (
    <svg
      viewBox="0 0 36 36"
      className="w-9 h-9"
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--color-muted-foreground)"
        strokeWidth={sw}
        strokeOpacity="0.15"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--color-muted-foreground)"
        strokeWidth={sw}
        strokeOpacity="0.55"
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

function MiniHBars({ card }: { card: InsightCardData }) {
  const bars = (card.bars ?? []).slice(0, 4);
  if (!bars.length) return <div className="h-10 rounded bg-muted/20" />;
  const max = Math.max(...bars.map((b) => b.value));
  return (
    <div className="flex flex-col justify-center gap-1 h-10">
      {bars.map((b, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full bg-muted-foreground/30"
          style={{ width: `${Math.max(8, (b.value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function MiniStackedBars({ card }: { card: InsightCardData }) {
  const bars = (card.stackedBars ?? []).slice(0, 5);
  if (!bars.length) return <div className="h-10 rounded bg-muted/20" />;
  const maxTotal = Math.max(
    ...bars.map((b) => b.segments.reduce((a, c) => a + c, 0)),
  );
  const opacities = ["0.5", "0.3", "0.15"];
  return (
    <div className="flex items-end gap-0.5 h-10">
      {bars.map((bar, i) => {
        const total = bar.segments.reduce((a, c) => a + c, 0);
        const hPct = (total / maxTotal) * 100;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col-reverse rounded-[2px] overflow-hidden"
            style={{ height: `${hPct}%` }}
          >
            {bar.segments.map((seg, j) => (
              <div
                key={j}
                style={{
                  flex: seg,
                  background: `color-mix(in srgb, var(--color-muted-foreground) ${Number(opacities[j % opacities.length]) * 100}%, transparent)`,
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function MiniArea({ card }: { card: InsightCardData }) {
  const pts = card.points ?? [30, 38, 34, 45, 42, 55, 50, 62];
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const W = 108;
  const H = 36;
  const step = W / (pts.length - 1);
  const coords = pts.map(
    (v, i) => `${i * step},${H - ((v - min) / range) * (H - 4) - 2}`,
  );
  const line = coords.join(" ");
  const area = `M0,${H} ${coords.map((c) => `L${c}`).join(" ")} L${W},${H} Z`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-9"
      preserveAspectRatio="none"
    >
      <path d={area} fill="var(--color-muted-foreground)" fillOpacity="0.1" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--color-muted-foreground)"
        strokeWidth="1.5"
        strokeOpacity="0.45"
      />
    </svg>
  );
}

function MiniComposed({ card }: { card: InsightCardData }) {
  const bars = (card.composedBars ?? []).slice(0, 6);
  if (!bars.length) return <div className="h-9 rounded bg-muted/20" />;
  const allVals = bars.flatMap((b) => [b.value, b.target ?? 0]);
  const max = Math.max(...allVals);
  const hasTarget = bars.some((b) => b.target !== undefined);
  const W = 108;
  const H = 36;
  const step = W / bars.length;
  const bw = step * 0.55;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-9"
      preserveAspectRatio="none"
    >
      {bars.map((b, i) => (
        <rect
          key={i}
          x={i * step + (step - bw) / 2}
          y={H - (b.value / max) * H}
          width={bw}
          height={(b.value / max) * H}
          fill="var(--color-muted-foreground)"
          fillOpacity="0.3"
          rx="1"
        />
      ))}
      {hasTarget && (
        <polyline
          points={bars
            .map(
              (b, i) =>
                `${i * step + step / 2},${H - ((b.target ?? 0) / max) * H}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--color-muted-foreground)"
          strokeWidth="1.5"
          strokeDasharray="3 2"
          strokeOpacity="0.6"
        />
      )}
    </svg>
  );
}

function MiniMultiLine({ card }: { card: InsightCardData }) {
  const series = (card.multiLineSeries ?? []).slice(0, 3);
  if (!series.length) return <div className="h-9 rounded bg-muted/20" />;
  const allPts = series.flatMap((s) => s.points);
  const min = Math.min(...allPts);
  const max = Math.max(...allPts);
  const range = max - min || 1;
  const W = 108;
  const H = 36;
  const opacities = [0.6, 0.35, 0.2];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-9"
      preserveAspectRatio="none"
    >
      {series.map((s, li) => {
        const step = W / (s.points.length - 1);
        const pts = s.points
          .map((v, i) => `${i * step},${H - ((v - min) / range) * (H - 4) - 2}`)
          .join(" ");
        return (
          <polyline
            key={li}
            points={pts}
            fill="none"
            stroke="var(--color-muted-foreground)"
            strokeWidth="1.5"
            strokeOpacity={opacities[li]}
          />
        );
      })}
    </svg>
  );
}

function MiniCardPreview({ card }: { card: InsightCardData }) {
  if (card.type === "kpi") {
    return (
      <div className="flex flex-col gap-0.5 pt-1">
        <span className="text-base font-bold leading-none tabular-nums">
          {card.kpiNumber ?? "—"}
        </span>
        {card.kpiBadge && (
          <span className="text-[10px] text-muted-foreground">
            {card.kpiBadge}
          </span>
        )}
      </div>
    );
  }
  switch (card.chartType) {
    case "donut":
      return <MiniDonut card={card} />;
    case "horizontal-bars":
      return <MiniHBars card={card} />;
    case "stacked-bar":
      return <MiniStackedBars card={card} />;
    case "area":
    case "sparkline":
      return <MiniArea card={card} />;
    case "composed":
      return <MiniComposed card={card} />;
    case "multi-line":
      return <MiniMultiLine card={card} />;
    default:
      return <div className="h-9 rounded bg-muted/20" />;
  }
}

// --- Inline chart data and detection ---

const INLINE_CHART_DATA: Record<string, InsightCardData> = {
  cycleTime: {
    title: "Cycle time vs target",
    type: "chart",
    chartType: "composed",
    size: "md",
    interaction: "expand",
    expandContent: {
      summary:
        "Cycle time down 38% over 8 weeks — target of 2.0 days within reach",
      details: ["Two approval bottlenecks remain, each adding ~0.5 days"],
    },
    composedBars: [
      { label: "W1", value: 3.4, target: 2.0 },
      { label: "W2", value: 3.1, target: 2.0 },
      { label: "W3", value: 2.9, target: 2.0 },
      { label: "W4", value: 2.8, target: 2.0 },
      { label: "W5", value: 2.6, target: 2.0 },
      { label: "W6", value: 2.4, target: 2.0 },
      { label: "W7", value: 2.3, target: 2.0 },
      { label: "W8", value: 2.1, target: 2.0 },
    ],
  },
  topExceptions: {
    title: "Top exceptions",
    type: "chart",
    chartType: "horizontal-bars",
    size: "md",
    interaction: "expand",
    expandContent: {
      summary: "Top 2 categories account for 65% of all manual intervention",
      details: ["Add PO validation gate at invoice submission"],
    },
    bars: [
      { label: "Missing PO number", value: 38 },
      { label: "Amount mismatch", value: 27 },
      { label: "Duplicate invoice", value: 19 },
      { label: "Vendor not in system", value: 11 },
      { label: "Approval timeout", value: 5 },
    ],
  },
  stpRate: {
    title: "STP rate",
    type: "kpi",
    chartType: "donut",
    size: "sm",
    interaction: "static",
    kpiNumber: "78.4%",
    kpiBadge: "+5.2 pts",
    kpiDescription: "Invoices processed end-to-end without human intervention.",
    donutPercent: 0.784,
  },
  savings: {
    title: "Savings trajectory",
    type: "chart",
    chartType: "composed",
    size: "md",
    interaction: "expand",
    expandContent: {
      summary: "Actual savings tracking $0.4M above projection through W8",
      details: [
        "PO validation outperformance is pulling total above the forecast line",
      ],
    },
    composedBars: [
      { label: "W1", value: 18, target: 14 },
      { label: "W2", value: 41, target: 32 },
      { label: "W3", value: 88, target: 72 },
      { label: "W4", value: 142, target: 120 },
      { label: "W5", value: 194, target: 168 },
      { label: "W6", value: 245, target: 216 },
      { label: "W7", value: 293, target: 264 },
      { label: "W8", value: 338, target: 312 },
    ],
  },
  weeklyPipeline: {
    title: "Weekly pipeline",
    type: "chart",
    chartType: "stacked-bar",
    size: "md",
    interaction: "expand",
    expandContent: {
      summary: "Automation absorbing 78% of weekly volume with a Thursday peak",
      details: ["Thursday spike aligns with supplier payment terms"],
    },
    stackedBars: [
      { label: "Mon", segments: [175, 32, 18] },
      { label: "Tue", segments: [198, 27, 14] },
      { label: "Wed", segments: [188, 38, 21] },
      { label: "Thu", segments: [244, 22, 12] },
      { label: "Fri", segments: [226, 29, 16] },
    ],
    stackedLegend: ["Automated", "Manual", "Pending"],
  },
  slaBreach: {
    title: "Daily breach trend",
    type: "chart",
    chartType: "composed",
    size: "md",
    interaction: "expand",
    expandContent: {
      summary:
        "Wednesday breach rate exceeded the 5% SLA threshold again this week",
      details: ["Midweek PO discrepancy batches are the likely driver"],
    },
    composedBars: [
      { label: "Mon", value: 2.9, target: 5.0 },
      { label: "Tue", value: 3.7, target: 5.0 },
      { label: "Wed", value: 5.8, target: 5.0 },
      { label: "Thu", value: 4.6, target: 5.0 },
      { label: "Fri", value: 3.2, target: 5.0 },
    ],
  },
  volumeGrowth: {
    title: "Volume growth",
    type: "chart",
    chartType: "area",
    size: "sm",
    interaction: "expand",
    expandContent: {
      summary: "15% sustained volume growth without added headcount",
      details: [
        "Capacity headroom estimated at +22% before intervention needed",
      ],
    },
    points: [208, 218, 229, 238, 251, 263, 276, 288, 301, 316, 329, 344],
  },
};

function detectInlineChart(query: string): InsightCardData | null {
  const q = query.toLowerCase();
  if (/cycle.?time|avg.?time|processing.?time/.test(q))
    return INLINE_CHART_DATA.cycleTime;
  if (
    /exception.?volume|exception.?trend|exception.?breakdown|show.+exception|top.+exception/.test(
      q,
    )
  )
    return INLINE_CHART_DATA.topExceptions;
  if (/stp.?rate|straight.?through|automation.?rate/.test(q))
    return INLINE_CHART_DATA.stpRate;
  if (/saving.?trajectory|savings.?progress|projected.?saving/.test(q))
    return INLINE_CHART_DATA.savings;
  if (/weekly.+pipeline|pipeline.+breakdown|pipeline.+status/.test(q))
    return INLINE_CHART_DATA.weeklyPipeline;
  if (/sla.?breach|breach.?rate|daily.?breach/.test(q))
    return INLINE_CHART_DATA.slaBreach;
  if (/volume.?growth|growth.?trend/.test(q))
    return INLINE_CHART_DATA.volumeGrowth;
  return null;
}

// --- Inline chart renderer (Recharts) ---

function InlineChartRenderer({ chart }: { chart: InsightCardData }) {
  if (chart.chartType === "composed" && chart.composedBars) {
    const hasTarget = chart.composedBars.some((b) => b.target !== undefined);
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chart.composedBars}
          margin={{ top: 6, right: 6, bottom: 0, left: -20 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Bar
            dataKey="value"
            fill="var(--color-insight-500)"
            fillOpacity={0.65}
            radius={[2, 2, 0, 0]}
          />
          {hasTarget && (
            <Line
              type="monotone"
              dataKey="target"
              stroke="var(--color-primary-400)"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 3"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  if (chart.chartType === "horizontal-bars" && chart.bars) {
    const data = chart.bars.slice(0, 5);
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 2, right: 8, bottom: 2, left: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
            width={110}
            axisLine={false}
            tickLine={false}
          />
          <Bar
            dataKey="value"
            fill="var(--color-insight-500)"
            fillOpacity={0.65}
            radius={[0, 2, 2, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart.chartType === "area" && chart.points) {
    const data = chart.points.map((v, i) => ({ i, value: v }));
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 6, right: 6, bottom: 0, left: -20 }}
        >
          <defs>
            <linearGradient id="ic-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-insight-500)"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="var(--color-insight-500)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-insight-500)"
            fill="url(#ic-area-grad)"
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (chart.chartType === "donut" && chart.donutPercent !== undefined) {
    const pct = chart.donutPercent;
    const pieData = [{ value: pct }, { value: 1 - pct }];
    return (
      <div className="h-full flex flex-col items-center justify-center gap-1">
        <ResponsiveContainer width={90} height={90}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="75%"
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill="var(--color-insight-500)" fillOpacity={0.85} />
              <Cell fill="var(--color-muted-foreground)" fillOpacity={0.12} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <p className="text-xl font-bold tabular-nums">{chart.kpiNumber}</p>
        {chart.kpiBadge && (
          <p className="text-xs text-muted-foreground">{chart.kpiBadge}</p>
        )}
      </div>
    );
  }

  if (chart.chartType === "stacked-bar" && chart.stackedBars) {
    const keys = chart.stackedLegend ?? [];
    const data = chart.stackedBars.map((b) => ({
      label: b.label,
      ...Object.fromEntries(keys.map((k, i) => [k, b.segments[i] ?? 0])),
    }));
    const opacities = [0.75, 0.45, 0.22];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 6, right: 6, bottom: 0, left: -20 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          {keys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="s"
              fill="var(--color-insight-500)"
              fillOpacity={opacities[i] ?? 0.15}
              radius={i === keys.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart.chartType === "multi-line" && chart.multiLineSeries) {
    const labels =
      chart.multiLineLabels ??
      chart.multiLineSeries[0]?.points.map((_, i) => String(i)) ??
      [];
    const data = labels.map((label, i) => ({
      label,
      ...Object.fromEntries(
        chart.multiLineSeries!.map((s) => [s.name, s.points[i]]),
      ),
    }));
    const opacities = [0.85, 0.5, 0.25];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 6, right: 6, bottom: 0, left: -20 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          {chart.multiLineSeries.map((s, i) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke="var(--color-insight-500)"
              strokeOpacity={opacities[i] ?? 0.2}
              strokeWidth={1.5}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return null;
}

// --- Inline chart card (shown in chat after response) ---

function InlineChartCard({
  chart,
  aiScreenLabels,
  onPin,
  isPinned,
}: {
  chart: InsightCardData;
  aiScreenLabels?: string[];
  onPin?: (screenIdx: number) => void;
  isPinned?: boolean;
}) {
  const hasScreens = (aiScreenLabels?.length ?? 0) > 0;
  const isKPI = chart.type === "kpi";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-border/50 bg-card/70 backdrop-blur-sm overflow-hidden"
    >
      <div className="px-4 pt-3 pb-1.5">
        <p className="text-xs font-semibold text-foreground">{chart.title}</p>
        {chart.kpiDescription && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {chart.kpiDescription}
          </p>
        )}
      </div>
      <div
        className={`px-3 ${isKPI ? "py-2" : "pb-3"}`}
        style={{ height: isKPI ? "auto" : "136px" }}
      >
        <InlineChartRenderer chart={chart} />
      </div>
      {hasScreens && (
        <div className="px-4 py-2 flex items-center justify-end border-t border-border/30">
          {isPinned ? (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Check className="size-3" />
              Pinned to dashboard
            </span>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pin className="size-3" />
                  Pin to dashboard
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                {aiScreenLabels?.map((label, i) => (
                  <DropdownMenuItem key={i} onClick={() => onPin?.(i)}>
                    ✦ {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </motion.div>
  );
}

// --- Card selection carousel ---

function CardSelectionCarousel({
  screen,
  selectedIndices,
  onToggle,
  onConfirm,
  onCancel,
}: {
  screen: PendingScreen;
  selectedIndices: number[];
  onToggle: (idx: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const count = selectedIndices.length;
  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: CHIP_EASE }}
    >
      <p className="text-sm text-muted-foreground">
        Choose cards for the{" "}
        <span className="font-semibold text-foreground">✦ {screen.label}</span>{" "}
        view
      </p>

      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
        {screen.cards.map((card, idx) => {
          const isSelected = selectedIndices.includes(idx);
          return (
            <motion.button
              key={idx}
              type="button"
              onClick={() => onToggle(idx)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.22,
                ease: CHIP_EASE,
                delay: idx * 0.06,
              }}
              whileHover={{ scale: 1.02 }}
              className={`shrink-0 w-36 rounded-xl border p-3 flex flex-col gap-2 text-left transition-all duration-200 ${
                isSelected
                  ? "border-insight-500/50 bg-card shadow-sm"
                  : "border-border/40 bg-muted/20 opacity-40"
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <p className="text-[11px] font-semibold leading-tight line-clamp-2 flex-1">
                  {card.title}
                </p>
                <div
                  className={`shrink-0 size-4 rounded-full flex items-center justify-center mt-0.5 transition-all duration-200 ${
                    isSelected
                      ? "bg-insight-500"
                      : "border border-border/60 bg-transparent"
                  }`}
                >
                  {isSelected && (
                    <svg
                      viewBox="0 0 10 10"
                      className="size-2.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                    </svg>
                  )}
                </div>
              </div>
              <MiniCardPreview card={card} />
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <motion.button
          type="button"
          onClick={onConfirm}
          disabled={count === 0}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: CHIP_EASE, delay: 0.14 }}
          whileHover={{ scale: 1.02 }}
          className="h-auto py-2 px-4 rounded-full text-xs font-semibold border border-input bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-30"
        >
          ✦ Build view
          {count < screen.cards.length
            ? ` with ${count} card${count !== 1 ? "s" : ""}`
            : ""}
        </motion.button>
        <motion.button
          type="button"
          onClick={onCancel}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: CHIP_EASE, delay: 0.19 }}
          whileHover={{ scale: 1.02 }}
          className="h-auto py-2 px-4 rounded-full text-xs font-semibold border border-input bg-background text-foreground hover:bg-muted transition-colors"
        >
          Dismiss
        </motion.button>
      </div>
    </motion.div>
  );
}

function cardBgStyle(
  bg: string,
  opacity: number,
  gradient: CardGradient,
): React.CSSProperties {
  if (gradient.enabled) {
    const alpha = gradient.opacity / 100;
    return {
      "--card-bg-override": `linear-gradient(${gradient.angle}deg, color-mix(in srgb, ${gradient.start} ${alpha * 100}%, transparent), color-mix(in srgb, ${gradient.end} ${alpha * 100}%, transparent))`,
      borderColor: "transparent",
    } as React.CSSProperties;
  }
  const value =
    bg === "white"
      ? `rgba(255,255,255,${opacity / 100})`
      : `color-mix(in srgb, var(--${bg}) ${opacity}%, transparent)`;
  return { "--card-bg-override": value } as React.CSSProperties;
}

export function PromptBar({
  shared,
  cards,
  isExpanded = false,
  onSubmit,
  onExpand,
  onCollapse,
  sourceTitle = "Dashboard",
  pendingScreen = null,
  onConfirmBuild,
  onCancelBuild,
  aiScreenLabels,
  onPinChart,
}: {
  shared: string;
  cards: CardConfig;
  isExpanded?: boolean;
  onSubmit?: (query: string) => void;
  onExpand?: () => void;
  onCollapse?: () => void;
  sourceTitle?: string;
  pendingScreen?: PendingScreen | null;
  onConfirmBuild?: (selectedIndices: number[]) => void;
  onCancelBuild?: () => void;
  aiScreenLabels?: string[];
  onPinChart?: (card: InsightCardData, screenIdx: number) => void;
}) {
  const { data } = useDashboardData();
  const { accessToken, orgTenant, demo } = useDashboardChat();
  const [value, setValue] = useState("");
  const [quotedText, setQuotedText] = useState<string | null>(null);
  const [selectedCardIndices, setSelectedCardIndices] = useState<number[]>([]);
  const [isLatestResponseAnimating, setIsLatestResponseAnimating] =
    useState(false);
  const [conversationCopied, setConversationCopied] = useState(false);
  const [messageCharts, setMessageCharts] = useState<
    Map<string, InsightCardData>
  >(() => new Map());
  const [pinnedMessageIds, setPinnedMessageIds] = useState<Set<string>>(
    () => new Set(),
  );
  const processedMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (pendingScreen) {
      setSelectedCardIndices(pendingScreen.cards.map((_, i) => i));
    }
  }, [pendingScreen]);
  const hasInput = value.trim().length > 0;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;

  const [connection] = useState(() =>
    demo || !orgTenant
      ? createDemoConnection(sourceTitle)
      : createAgentHubConnection({
          baseUrl: `/api/agenthub/${orgTenant.orgName}/${orgTenant.tenantName}/agenthub_/llm/api`,
          model: { vendor: "openai", name: "gpt-4.1-mini-2025-04-14" },
          accessToken: () => accessTokenRef.current!,
          systemPrompt: `You are an AI assistant for a business dashboard. Provide concise, data-driven analysis and actionable recommendations. Always respond using markdown format.`,
        }),
  );

  const { messages, sendMessage, isLoading, reload, setMessages, clear } =
    useChat({ connection });

  const lastMessage = messages.at(-1);
  const lastAssistantHasText =
    lastMessage?.role === "assistant" &&
    lastMessage.parts.some((p) => p.type === "text" && p.content);
  const latestAssistantMessageId =
    messages.findLast((m) => m.role === "assistant")?.id ?? null;
  const showLoadingIndicator = isLoading && !lastAssistantHasText;
  const hasMessages = messages.length > 0;
  const isResponseComplete = isExpanded && hasMessages && !isLoading;
  const showRecommendation =
    !!pendingScreen && !isLoading && hasMessages && !isLatestResponseAnimating;

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  // Detect chart queries and associate chart data with the assistant message that answered them
  useEffect(() => {
    if (isLoading || isLatestResponseAnimating || !hasMessages) return;
    const lastAssistant = messages.findLast((m) => m.role === "assistant");
    if (!lastAssistant || processedMessageIdsRef.current.has(lastAssistant.id))
      return;
    const assistantIdx = messages.indexOf(lastAssistant);
    const lastUser = messages
      .slice(0, assistantIdx)
      .findLast((m) => m.role === "user");
    if (!lastUser) return;
    processedMessageIdsRef.current.add(lastAssistant.id);
    const userText = lastUser.parts
      .filter((p): p is { type: "text"; content: string } => p.type === "text")
      .map((p) => p.content)
      .join("");
    const chart = detectInlineChart(userText);
    if (chart) {
      setMessageCharts((prev) => new Map(prev).set(lastAssistant.id, chart));
    }
  }, [isLoading, isLatestResponseAnimating, hasMessages, messages]);

  const handleCopyConversation = async () => {
    const text = messages
      .map((m) => {
        const content = m.parts
          .filter(
            (p): p is { type: "text"; content: string } =>
              p.type === "text" && "content" in p,
          )
          .map((p) => p.content)
          .join("");
        if (!content) return null;
        return `${m.role === "user" ? "You" : "AI assistant"}: ${content}`;
      })
      .filter(Boolean)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setConversationCopied(true);
    setTimeout(() => setConversationCopied(false), 2000);
  };

  const handleEditMessage = (messageId: string, content: string) => {
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;
    const updated = messages
      .slice(0, idx + 1)
      .map((m, i) =>
        i === idx ? { ...m, parts: [{ type: "text" as const, content }] } : m,
      );
    setMessages(updated);
    void reload();
  };

  const handleSubmit = () => {
    if (hasInput) {
      const base = value;
      const query = quotedText ? `> ${quotedText}\n\n${base}` : base;
      setValue("");
      setQuotedText(null);
      void sendMessage(query);
      onSubmit?.(base);
    }
  };

  const handleChipClick = (suggestion: string) => {
    void sendMessage(suggestion);
    onSubmit?.(suggestion);
  };

  return (
    <div
      className={`group flex flex-col rounded-2xl p-[2px] transition-all duration-500 ${
        isExpanded
          ? `flex-1 min-h-0 overflow-hidden bg-gradient-to-r ${
              isResponseComplete
                ? "from-insight-500/20 to-primary-400/20"
                : "from-insight-500/75 to-primary-400/75"
            }`
          : "focus-within:bg-gradient-to-r focus-within:from-insight-500/75 focus-within:to-primary-400/75"
      }`}
    >
      {/* Expanded response area */}
      {isExpanded && (
        <div className="flex-1 flex flex-col rounded-t-[14px] !bg-white/90 dark:!bg-background/90 backdrop-blur-sm overflow-hidden min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between px-7 pt-5 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <AutopilotGradientIcon size={20} />
              <div>
                <p className="text-sm font-bold tracking-tight leading-tight">
                  AI assistant
                </p>
                <p className="text-xs text-muted-foreground leading-tight">
                  Ask me anything
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {hasMessages && (
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                        aria-label="More options"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          void handleCopyConversation();
                        }}
                      >
                        {conversationCopied ? "Copied!" : "Copy conversation"}
                      </DropdownMenuItem>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem>New conversation</DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Start a new conversation?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will clear all messages and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clear}>
                        New conversation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {onCollapse && (
                <button
                  type="button"
                  onClick={onCollapse}
                  className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  <Minimize2 className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto min-h-0 px-7 pb-4"
          >
            {messages.length === 0 && !isLoading ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground/50">
                  Responses will appear here
                </p>
              </div>
            ) : (
              <AiChatProvider
                isLoading={isLoading}
                latestAssistantMessageId={latestAssistantMessageId}
                isLatestResponseAnimating={isLatestResponseAnimating}
                setIsLatestResponseAnimating={setIsLatestResponseAnimating}
                onRegenerate={() => void reload()}
                onEditMessage={handleEditMessage}
                onQuoteSelect={setQuotedText}
              >
                <div className="flex flex-col gap-4 py-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex flex-col gap-3">
                      <AiChatMessage message={msg} />
                      {msg.role === "assistant" &&
                        messageCharts.has(msg.id) && (
                          <InlineChartCard
                            chart={messageCharts.get(msg.id)!}
                            aiScreenLabels={aiScreenLabels}
                            isPinned={pinnedMessageIds.has(msg.id)}
                            onPin={(screenIdx) => {
                              onPinChart?.(
                                messageCharts.get(msg.id)!,
                                screenIdx,
                              );
                              setPinnedMessageIds((prev) =>
                                new Set(prev).add(msg.id),
                              );
                            }}
                          />
                        )}
                    </div>
                  ))}
                  <AnimatePresence>
                    {showLoadingIndicator && <AiChatLoading />}
                  </AnimatePresence>
                  {showRecommendation && (
                    <CardSelectionCarousel
                      screen={pendingScreen!}
                      selectedIndices={selectedCardIndices}
                      onToggle={(idx) =>
                        setSelectedCardIndices((prev) => {
                          if (prev.includes(idx)) {
                            if (prev.length === 1) return prev;
                            return prev.filter((i) => i !== idx);
                          }
                          return [...prev, idx].sort((a, b) => a - b);
                        })
                      }
                      onConfirm={() => onConfirmBuild?.(selectedCardIndices)}
                      onCancel={() => onCancelBuild?.()}
                    />
                  )}
                </div>
              </AiChatProvider>
            )}
          </div>

          <div className="border-t border-border shrink-0" />
        </div>
      )}

      {/* Suggestion badges — hidden when expanded */}
      {!isExpanded && (
        <div className="grid grid-rows-[0fr] focus-within:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] transition-[grid-template-rows] duration-300">
          <div className="overflow-hidden">
            <div className="px-3 pt-2 pb-2 flex gap-2">
              <Badge
                variant="secondary"
                status="info"
                className="!bg-white/35 !text-foreground opacity-0 translate-y-2 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-300 cursor-pointer max-w-[200px]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  handleChipClick(
                    data.promptSuggestions[0] ?? "Show me top risk factors",
                  )
                }
              >
                <span className="truncate">
                  {data.promptSuggestions[0] ?? "Show me top risk factors"}
                </span>
              </Badge>
              <Badge
                variant="secondary"
                status="info"
                className="!bg-white/35 !text-foreground opacity-0 translate-y-2 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-300 delay-75 cursor-pointer max-w-[200px]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  handleChipClick(
                    data.promptSuggestions[1] ?? "Compare Q1 vs Q2 performance",
                  )
                }
              >
                <span className="truncate">
                  {data.promptSuggestions[1] ?? "Compare Q1 vs Q2 performance"}
                </span>
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div
        className={`flex flex-col px-4 py-3 !bg-white/80 backdrop-blur-sm transition-colors ${shared} ${
          isExpanded ? "rounded-b-[14px]" : "rounded-[14px]"
        }`}
        style={cardBgStyle(
          cards.promptBg,
          cards.promptOpacity,
          cards.promptGradient,
        )}
      >
        {/* Quoted text indicator */}
        {quotedText && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-md bg-muted/60 text-xs text-muted-foreground">
            <span className="flex-1 truncate italic">"{quotedText}"</span>
            <button
              type="button"
              onClick={() => setQuotedText(null)}
              className="shrink-0 hover:text-foreground transition-colors"
            >
              <X className="size-3" />
            </button>
          </div>
        )}
        <div className="flex items-center">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder={data.promptPlaceholder}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-2 ml-3">
            {hasMessages && !isExpanded && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onExpand}
                className="relative size-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                aria-label="Open chat"
              >
                <MessagesSquare className="size-4" />
                <span
                  className={`absolute top-1 right-1 size-2 rounded-full bg-insight-500 ${isLoading ? "animate-pulse" : ""}`}
                />
              </button>
            )}
            <button
              type="button"
              disabled={!hasInput}
              onClick={handleSubmit}
              className="size-8 rounded-full bg-gradient-to-br from-insight-500 to-primary-400 flex items-center justify-center text-white transition-opacity disabled:opacity-30"
              aria-label="Submit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="m5 12 7-7 7 7" />
                <path d="M12 19V5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
