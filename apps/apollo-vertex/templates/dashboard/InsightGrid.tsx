"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AiStarIcon, type ChartSpec } from "@/components/ai-chat/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type CardConfig,
  cardBgStyle,
  getInsightCardClasses,
  type LayoutConfig,
} from "./glow-config";
import { InsightCardBody } from "./insight-card-renderers";

const sizeToFr: Record<string, string> = { sm: "1fr", md: "2fr", lg: "1fr" };

// ── Pinned chart renderer — mirrors ChatPanel's ChartDisplay, sized for cards ──

function PinnedChartDisplay({ spec }: { spec: ChartSpec }) {
  const { type, data, id } = spec;

  const canRender =
    data.length >= 1 &&
    (type === "bar" ||
      (type === "area" && data.length >= 2) ||
      (type === "donut" && data.length >= 2) ||
      (type === "sparkline" && data.length >= 2));

  if (!canRender) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-center">
        <p className="text-xs text-muted-foreground/50">
          Not enough data to display as {type}
        </p>
      </div>
    );
  }

  if (type === "bar") {
    return (
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: -22, bottom: 0 }}
            barSize={14}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
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
      </div>
    );
  }

  if (type === "area") {
    const gradId = `pinned-area-${id}`;
    return (
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: -22, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.3}
                />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
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
              fill={`url(#${gradId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "donut") {
    const total = data.reduce((s, d) => s + d.value, 0);
    return (
      <div className="flex-1 flex flex-col min-h-0 gap-2">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius="40%"
                outerRadius="65%"
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {data.slice(0, 5).map((d, i) => (
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
  const h = 56;
  const step = w / (data.length - 1);
  const pts = data
    .map((d, i) => `${i * step},${h - (d.value / max) * (h - 8) - 4}`)
    .join(" ");
  const last = pts.split(" ").at(-1)!.split(",");
  return (
    <div className="flex-1 flex flex-col min-h-0 justify-center gap-1">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        style={{ flex: "1", maxHeight: 80 }}
        fill="none"
      >
        <polyline
          points={pts}
          stroke="var(--chart-1)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={parseFloat(last[0])}
          cy={parseFloat(last[1])}
          r="3"
          fill="var(--chart-1)"
        />
      </svg>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 shrink-0">
        <span>{data[0].label}</span>
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}

function AiPromptPill({
  question,
  onClick,
}: {
  question: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-left text-[12px] text-foreground/70 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-background hover:text-foreground"
    >
      <AiStarIcon className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
      {question}
    </button>
  );
}

function DiagonalArrow({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

function NavigateIcon() {
  return (
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
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  );
}

type ExpandPhase = "idle" | "width" | "height" | "full";

export function InsightGrid({
  layout,
  shared,
  cards,
  promptChips,
  onCardChat,
  askAutopilotIdx,
  expandedPrompts,
  pinnedCharts,
  onAskAutopilotExpand,
}: {
  layout: LayoutConfig;
  shared: string;
  cards: CardConfig;
  promptChips?: (string | null)[];
  onCardChat?: (q: string, cardIdx: number) => void;
  askAutopilotIdx?: number;
  expandedPrompts?: Record<number, string[]>;
  pinnedCharts?: Record<number, ChartSpec>;
  onAskAutopilotExpand?: (expanded: boolean) => void;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<ExpandPhase>("idle");
  const [expandedInput, setExpandedInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expandedIdx === null) {
      setPhase("idle");
      return;
    }
    requestAnimationFrame(() => setPhase("width"));
    const t1 = setTimeout(() => setPhase("height"), 120);
    const t2 = setTimeout(() => setPhase("full"), 220);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [expandedIdx]);

  // Notify parent when Ask Autopilot card expands/collapses
  useEffect(() => {
    if (askAutopilotIdx === undefined) return;
    onAskAutopilotExpand?.(expandedIdx === askAutopilotIdx);
  }, [expandedIdx, askAutopilotIdx, onAskAutopilotExpand]);

  // Focus the inline input when the Ask Autopilot card reaches full expansion
  useEffect(() => {
    if (phase === "full" && expandedIdx === askAutopilotIdx) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [phase, expandedIdx, askAutopilotIdx]);

  const visibleCards = layout.insightCards
    .map((cfg, i) => ({ cfg, idx: i }))
    .filter(({ cfg }) => cfg.visible);
  const rows: (typeof visibleCards)[] = [];
  for (let i = 0; i < visibleCards.length; i += 2) {
    rows.push(visibleCards.slice(i, i + 2));
  }

  const isExpanding = expandedIdx !== null;
  const expandedRow = isExpanding
    ? rows.findIndex((row) => row.some(({ idx }) => idx === expandedIdx))
    : -1;

  const handleExpandClick = (
    cfg: (typeof visibleCards)[0]["cfg"],
    idx: number,
  ) => {
    if (cfg.interaction === "expand" || pinnedCharts?.[idx]) {
      setExpandedIdx(expandedIdx === idx ? null : idx);
    }
  };

  const handleCardChatSubmit = (q: string, cardIdx: number) => {
    if (!q.trim()) return;
    setExpandedInput("");
    onCardChat?.(q.trim(), cardIdx);
  };

  return (
    <div
      className="relative flex flex-col h-full transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ gap: phase === "height" || phase === "full" ? 0 : layout.gap }}
    >
      {rows.map((row, rowIndex) => {
        const isRowWithExpanded = rowIndex === expandedRow;
        const isOtherRow = isExpanding && !isRowWithExpanded;
        const cols = row
          .map(({ cfg, idx }) => {
            if (!isExpanding)
              return cfg.size === "lg" ? "1fr" : sizeToFr[cfg.size];
            if (idx === expandedIdx)
              return phase === "idle"
                ? cfg.size === "lg"
                  ? "1fr"
                  : sizeToFr[cfg.size]
                : "1fr";
            if (isRowWithExpanded)
              return phase === "idle"
                ? cfg.size === "lg"
                  ? "1fr"
                  : sizeToFr[cfg.size]
                : "0fr";
            return cfg.size === "lg" ? "1fr" : sizeToFr[cfg.size];
          })
          .join(" ");
        return (
          <div
            key={row.map(({ idx }) => idx).join("-")}
            className="grid transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden"
            style={{
              gap: isRowWithExpanded && phase !== "idle" ? 0 : layout.gap,
              gridTemplateColumns: cols,
              flex:
                isOtherRow && (phase === "height" || phase === "full")
                  ? "0"
                  : "1",
              maxHeight: isOtherRow && phase === "full" ? 0 : 9999,
              opacity:
                isOtherRow && (phase === "height" || phase === "full") ? 0 : 1,
              transform:
                isOtherRow && (phase === "height" || phase === "full")
                  ? "scale(0.95)"
                  : "scale(1)",
            }}
          >
            {row.map(({ cfg, idx }) => {
              const classes = getInsightCardClasses(cfg.content);
              const isInteractive = cfg.interaction !== "static";
              const isThis = idx === expandedIdx;
              const isSibling = isExpanding && !isThis && isRowWithExpanded;
              const isAskAutopilot = idx === askAutopilotIdx;
              const cardPrompts = expandedPrompts?.[idx] ?? [];
              return (
                <Card
                  key={idx}
                  variant="glass"
                  className={`${isThis && isExpanding ? "!bg-white dark:!bg-card" : "!bg-white/70"} ${shared} ${classes.cardClassName} group/card relative transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden`}
                  style={{
                    ...cardBgStyle(
                      cards.insightBg,
                      cards.insightOpacity,
                      cards.insightGradient,
                    ),
                    opacity: isSibling && phase !== "idle" ? 0 : 1,
                    transform:
                      isSibling && phase !== "idle"
                        ? "scale(0.95)"
                        : "scale(1)",
                  }}
                >
                  {/* Expand button — always shown for pinned cards, otherwise only for "expand" interaction */}
                  {(pinnedCharts?.[idx] || (isInteractive && cfg.interaction === "expand")) && (
                    <button
                      type="button"
                      onClick={() => handleExpandClick(cfg, idx)}
                      className={`absolute top-5 right-5 z-20 size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-75 ${
                        isThis
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0"
                      }`}
                    >
                      <DiagonalArrow collapsed={isThis && isExpanding} />
                    </button>
                  )}
                  {/* Navigate button */}
                  {isInteractive &&
                    cfg.interaction === "navigate" &&
                    !isThis && (
                      <button
                        type="button"
                        className="absolute top-5 right-5 size-7 rounded-md flex items-center justify-center opacity-0 translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all duration-75 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      >
                        <NavigateIcon />
                      </button>
                    )}
                  {pinnedCharts?.[idx] ? (
                    <>
                      <CardHeader>
                        <CardTitle className="text-sm font-bold tracking-tight truncate">
                          {pinnedCharts[idx].title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col min-h-0">
                        <PinnedChartDisplay spec={pinnedCharts[idx]} />
                      </CardContent>
                    </>
                  ) : (
                    <>
                      <CardHeader className="flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold tracking-tight">
                          {cfg.content.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className={classes.contentClassName}>
                        <InsightCardBody content={cfg.content} />
                        {!isAskAutopilot &&
                          promptChips?.[idx] &&
                          onCardChat && (
                            <AiPromptPill
                              question={promptChips[idx]!}
                              onClick={() => onCardChat(promptChips[idx]!, idx)}
                            />
                          )}
                      </CardContent>
                    </>
                  )}
                  {/* Ask Autopilot — pinned to card bottom */}
                  {isAskAutopilot && !isThis && (
                    <div className="px-6 pb-5 pt-2">
                      <button
                        type="button"
                        onClick={() => handleExpandClick(cfg, idx)}
                        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-medium text-primary transition-colors hover:bg-primary/10"
                      >
                        <AiStarIcon className="h-3 w-3 flex-shrink-0" />
                        Ask Autopilot
                      </button>
                    </div>
                  )}
                  {/* Expanded area */}
                  {isThis &&
                    isExpanding &&
                    (phase === "height" || phase === "full") && (
                      <div
                        className={`flex-1 mx-6 mb-6 rounded-lg overflow-hidden transition-all duration-300 ${
                          phase === "full"
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-2"
                        }`}
                      >
                        {phase === "full" ? (
                          isAskAutopilot && cardPrompts.length > 0 ? (
                            // Ask Autopilot expanded content: prompts + input
                            <div className="h-full flex flex-col gap-3 p-4 border border-border/40 bg-muted/20 rounded-lg">
                              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                                Suggested questions
                              </p>
                              <div className="flex flex-col gap-2">
                                {cardPrompts.map((prompt) => (
                                  <button
                                    key={prompt}
                                    type="button"
                                    onClick={() =>
                                      handleCardChatSubmit(prompt, idx)
                                    }
                                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-left text-[12px] text-foreground/75 transition-all hover:border-primary/40 hover:bg-background hover:text-foreground"
                                  >
                                    <AiStarIcon className="h-3 w-3 flex-shrink-0 text-primary/60" />
                                    {prompt}
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 mt-auto transition-colors focus-within:border-primary/40">
                                <input
                                  ref={inputRef}
                                  type="text"
                                  value={expandedInput}
                                  onChange={(e) =>
                                    setExpandedInput(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleCardChatSubmit(expandedInput, idx);
                                  }}
                                  placeholder="Or ask your own question…"
                                  className="min-w-0 flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none"
                                />
                                <button
                                  type="button"
                                  disabled={!expandedInput.trim()}
                                  onClick={() =>
                                    handleCardChatSubmit(expandedInput, idx)
                                  }
                                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ) : pinnedCharts?.[idx]?.context ? (
                            // Pinned chart context — summary + numbered breakdown
                            <div className="h-full flex flex-col gap-3 p-4 border border-border/40 bg-muted/20 rounded-lg overflow-y-auto">
                              <p className="text-[12px] leading-relaxed text-foreground/80">
                                {pinnedCharts[idx].context!.summary}
                              </p>
                              <div className="space-y-2.5">
                                {pinnedCharts[idx].context!.items.map(
                                  ({ n, title, detail }) => (
                                    <div
                                      key={n}
                                      className="flex items-start gap-2 text-[11px]"
                                    >
                                      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-warning/15 text-[9px] font-bold text-warning">
                                        {n}
                                      </span>
                                      <div>
                                        <span className="font-medium text-foreground">
                                          {title}
                                        </span>
                                        <p className="mt-0.5 text-muted-foreground">
                                          {detail}
                                        </p>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="h-full border border-dashed border-muted-foreground/15 bg-muted/30 rounded-lg flex items-center justify-center">
                              <span className="text-xs text-muted-foreground/40">
                                No context available
                              </span>
                            </div>
                          )
                        ) : (
                          <div className="h-full space-y-3 p-4">
                            <div className="h-3 w-2/3 rounded-full bg-muted/50 animate-pulse" />
                            <div className="h-3 w-1/2 rounded-full bg-muted/50 animate-pulse" />
                            <div className="h-3 w-3/4 rounded-full bg-muted/50 animate-pulse" />
                          </div>
                        )}
                      </div>
                    )}
                </Card>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
