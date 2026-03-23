"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  cardBgStyle,
  getInsightCardClasses,
  type CardConfig,
  type LayoutConfig,
} from "./glow-config";
import { InsightCardBody } from "./insight-card-renderers";

const sizeToFr: Record<string, string> = { sm: "1fr", md: "2fr", lg: "1fr" };

function ExpandIcon() {
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
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
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
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

function MinimizeIcon() {
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
      <path d="M4 14h6v6" />
      <path d="M20 10h-6V4" />
      <path d="M14 10l7-7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

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
  const gapStyle = { gap: `${layout.gap}px` };
  const visibleCards = layout.insightCards
    .map((cfg, i) => ({ cfg, idx: i }))
    .filter(({ cfg }) => cfg.visible);
  const rows: (typeof visibleCards)[] = [];
  for (let i = 0; i < visibleCards.length; i += 2) {
    rows.push(visibleCards.slice(i, i + 2));
  }
  const handleClick = (cfg: (typeof visibleCards)[0]["cfg"], idx: number) => {
    if (cfg.interaction === "expand") setExpandedIdx(idx);
  };
  return (
    <div className="relative flex flex-col" style={gapStyle}>
      {rows.map((row) => {
        const cols = row
          .map(({ cfg }) => (cfg.size === "lg" ? "1fr" : sizeToFr[cfg.size]))
          .join(" ");
        return (
          <div
            key={row.map(({ idx }) => idx).join("-")}
            className="grid flex-1"
            style={{ ...gapStyle, gridTemplateColumns: cols }}
          >
            {row.map(({ cfg, idx }) => {
              const classes = getInsightCardClasses(cfg.content);
              const isInteractive = cfg.interaction !== "static";
              const isExpanded = expandedIdx === idx;
              const isHidden = expandedIdx !== null && !isExpanded;
              return (
                <Card
                  key={idx}
                  variant="glass"
                  onClick={
                    isInteractive
                      ? () => handleClick(cfg, idx)
                      : () => {
                          /* static — no action */
                        }
                  }
                  className={`!bg-white/90 ${shared} ${classes.cardClassName} group/card relative transition-all duration-300 ${
                    isInteractive ? "cursor-pointer hover:brightness-110" : ""
                  } ${isHidden ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"} ${
                    isExpanded ? "!absolute !inset-0 !z-10" : ""
                  }`}
                  style={cardBgStyle(
                    cards.insightBg,
                    cards.insightOpacity,
                    cards.insightGradient,
                  )}
                >
                  {isInteractive && !isExpanded && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover/card:opacity-100 transition-opacity duration-150 text-muted-foreground">
                      {cfg.interaction === "expand" ? (
                        <ExpandIcon />
                      ) : (
                        <NavigateIcon />
                      )}
                    </div>
                  )}
                  {isExpanded && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedIdx(null);
                      }}
                      className="absolute top-4 right-4 z-20 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MinimizeIcon />
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
