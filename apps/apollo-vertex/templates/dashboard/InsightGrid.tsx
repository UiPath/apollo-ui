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

type ExpandPhase = "idle" | "width" | "full";

export function InsightGrid({
  layout,
  shared,
  cards,
}: {
  layout: LayoutConfig;
  shared: string;
  cards: CardConfig;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<ExpandPhase>("idle");

  useEffect(() => {
    if (expandedIdx === null) {
      setPhase("idle");
      return;
    }
    // Start with width expansion
    requestAnimationFrame(() => setPhase("width"));
    const timer = setTimeout(() => setPhase("full"), 300);
    return () => clearTimeout(timer);
  }, [expandedIdx]);

  const gapStyle = { gap: `${layout.gap}px` };
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

  return (
    <div className="relative flex flex-col h-full" style={gapStyle}>
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
            className="grid transition-all duration-300 ease-in-out overflow-hidden"
            style={{
              ...gapStyle,
              gridTemplateColumns: cols,
              flex: isOtherRow && phase === "full" ? "0" : "1",
              opacity: isOtherRow && phase === "full" ? 0 : 1,
              minHeight: isOtherRow && phase === "full" ? 0 : "auto",
            }}
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
                  className={`!bg-white/90 ${shared} ${classes.cardClassName} group/card relative transition-all duration-300 ease-in-out overflow-hidden`}
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
                  <CardHeader>
                    <CardTitle className="text-sm font-bold tracking-tight">
                      {cfg.content.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={classes.contentClassName}>
                    <InsightCardBody content={cfg.content} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
