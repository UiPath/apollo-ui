"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  cardBgStyle,
  getInsightCardClasses,
  type CardConfig,
  type LayoutConfig,
} from "./glow-config";
import { InsightCardBody } from "./insight-card-renderers";

const sizeToFr: Record<string, string> = { sm: "1fr", md: "2fr", lg: "1fr" };

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
  viewMode = "desktop",
}: {
  layout: LayoutConfig;
  shared: string;
  cards: CardConfig;
  viewMode?: "desktop" | "compact" | "stacked";
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<ExpandPhase>("idle");

  useEffect(() => {
    if (expandedIdx === null) {
      setPhase("idle");
      return;
    }
    if (viewMode === "compact") {
      // Compact: "width" phase = other row collapses (grows top)
      // "height" phase = expanding row stretches (grows bottom)
      requestAnimationFrame(() => setPhase("width"));
      const t1 = setTimeout(() => setPhase("height"), 300);
      const t2 = setTimeout(() => setPhase("full"), 600);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    requestAnimationFrame(() => setPhase("width"));
    const t1 = setTimeout(() => setPhase("height"), 300);
    const t2 = setTimeout(() => setPhase("full"), 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [expandedIdx]);

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

  const handleClick = (cfg: (typeof visibleCards)[0]["cfg"], idx: number) => {
    if (cfg.interaction === "expand") {
      setExpandedIdx(expandedIdx === idx ? null : idx);
    }
  };

  // Build grid-template-rows for smooth animation
  let rowTemplates: string[];
  if (viewMode === "compact") {
    // In compact, each card is its own row
    rowTemplates = visibleCards.map(({ idx }) => {
      if (!isExpanding) return "1fr";
      if (idx === expandedIdx) return "1fr";
      if (phase !== "idle") return "0fr";
      return "1fr";
    });
  } else {
    rowTemplates = rows.map((_, rowIndex) => {
      const isRowWithExpanded = rowIndex === expandedRow;
      const isOtherRow = isExpanding && !isRowWithExpanded;
      if (isOtherRow && (phase === "height" || phase === "full")) return "0fr";
      return "1fr";
    });
  }

  return (
    <div
      className={`relative grid transition-all duration-300 ease-in-out ${
        viewMode === "desktop" ? "h-full overflow-hidden" :
        viewMode === "compact" ? (isExpanding ? "h-full overflow-hidden" : "h-full overflow-y-auto") :
        ""
      }`}
      style={{
        gap: (phase === "height" || phase === "full") ? 0 : layout.gap,
        gridTemplateRows: rowTemplates.join(" "),
      }}
    >
      {viewMode === "compact"
        ? visibleCards.map(({ cfg, idx }) => {
            const classes = getInsightCardClasses(cfg.content);
            const isInteractive = cfg.interaction !== "static";
            const isThis = idx === expandedIdx;
            const isOther = isExpanding && !isThis;
            return (
              <div
                key={idx}
                className="overflow-hidden min-h-0 transition-all duration-300 ease-in-out"
                style={{ opacity: isOther && phase !== "idle" ? 0 : 1 }}
              >
                <Card
                  variant="glass"
                  className={`${isThis && isExpanding ? "!bg-white dark:!bg-card" : "!bg-white/70"} ${shared} ${classes.cardClassName} group/card relative transition-all duration-300 ease-in-out overflow-hidden h-full`}
                  style={cardBgStyle(cards.insightBg, cards.insightOpacity, cards.insightGradient)}
                >
                  {isInteractive && cfg.interaction === "expand" && (
                    <button
                      type="button"
                      onClick={() => handleClick(cfg, idx)}
                      className={`absolute top-5 right-5 z-20 size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-75 ${
                        isThis
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0"
                      }`}
                    >
                      <DiagonalArrow collapsed={isThis && isExpanding} />
                    </button>
                  )}
                  {isInteractive && cfg.interaction === "navigate" && !isThis && (
                    <button
                      type="button"
                      className="absolute top-5 right-5 size-7 rounded-md flex items-center justify-center opacity-0 translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all duration-75 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                      <NavigateIcon />
                    </button>
                  )}
                  <CardHeader>
                    <CardTitle className="text-sm font-bold tracking-tight">
                      {cfg.content.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={classes.contentClassName}>
                    <InsightCardBody content={cfg.content} />
                  </CardContent>
                  {isThis && isExpanding && (phase === "height" || phase === "full") && (
                    <div
                      className={`flex-1 mx-6 mb-6 rounded-lg overflow-hidden transition-all duration-300 ${
                        phase === "full" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                      }`}
                    >
                      {phase === "full" ? (
                        <div className="h-full border border-dashed border-muted-foreground/15 bg-muted/30 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-muted-foreground/40">Additional content</span>
                        </div>
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
              </div>
            );
          })
        : rows.map((row, rowIndex) => {
            const isRowWithExpanded = rowIndex === expandedRow;
            const isOtherRow = isExpanding && !isRowWithExpanded;
            const cols = row
              .map(({ cfg, idx }) => {
                if (!isExpanding) return cfg.size === "lg" ? "1fr" : sizeToFr[cfg.size];
                if (idx === expandedIdx) return phase === "idle" ? (cfg.size === "lg" ? "1fr" : sizeToFr[cfg.size]) : "1fr";
                if (isRowWithExpanded) return phase === "idle" ? (cfg.size === "lg" ? "1fr" : sizeToFr[cfg.size]) : "0fr";
                return cfg.size === "lg" ? "1fr" : sizeToFr[cfg.size];
              })
              .join(" ");
            return (
              <div
                key={row.map(({ idx }) => idx).join("-")}
                className="grid transition-all duration-300 ease-in-out overflow-hidden min-h-0"
                style={{
                  gridTemplateColumns: cols,
                  gap: isRowWithExpanded && phase !== "idle" ? 0 : layout.gap,
                  opacity: isOtherRow && (phase === "height" || phase === "full") ? 0 : 1,
                } as React.CSSProperties}
              >
                {row.map(({ cfg, idx }) => {
                  const classes = getInsightCardClasses(cfg.content);
                  const isInteractive = cfg.interaction !== "static";
                  const isThis = idx === expandedIdx;
                  const isSibling = isExpanding && !isThis && isRowWithExpanded;
                  return (
                    <Card
                      key={idx}
                      variant="glass"
                      className={`${isThis && isExpanding ? "!bg-white dark:!bg-card" : "!bg-white/70"} ${shared} ${classes.cardClassName} group/card relative transition-all duration-300 ease-in-out overflow-hidden`}
                      style={{
                        ...cardBgStyle(cards.insightBg, cards.insightOpacity, cards.insightGradient),
                        opacity: isSibling && phase !== "idle" ? 0 : 1,
                        transform: isSibling && phase !== "idle" ? "scale(0.95)" : "scale(1)",
                      }}
                    >
                      {isInteractive && cfg.interaction === "expand" && (
                        <button
                          type="button"
                          onClick={() => handleClick(cfg, idx)}
                          className={`absolute top-5 right-5 z-20 size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-75 ${
                            isThis
                              ? "opacity-100 translate-x-0"
                              : "opacity-0 translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0"
                          }`}
                        >
                          <DiagonalArrow collapsed={isThis && isExpanding} />
                        </button>
                      )}
                      {isInteractive && cfg.interaction === "navigate" && !isThis && (
                        <button
                          type="button"
                          className="absolute top-5 right-5 size-7 rounded-md flex items-center justify-center opacity-0 translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all duration-75 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        >
                          <NavigateIcon />
                        </button>
                      )}
                      <CardHeader>
                        <CardTitle className="text-sm font-bold tracking-tight">
                          {cfg.content.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className={classes.contentClassName}>
                        <InsightCardBody content={cfg.content} />
                      </CardContent>
                      {isThis && isExpanding && (phase === "height" || phase === "full") && (
                        <div
                          className={`flex-1 mx-6 mb-6 rounded-lg overflow-hidden transition-all duration-300 ${
                            phase === "full" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                          }`}
                        >
                          {phase === "full" ? (
                            <div className="h-full border border-dashed border-muted-foreground/15 bg-muted/30 rounded-lg flex items-center justify-center">
                              <span className="text-xs text-muted-foreground/40">Additional content</span>
                            </div>
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
