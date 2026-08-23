"use client";

import { useEffect, useState } from "react";
import { useDashboardData } from "./dashboard-data-context";
import type { DrilldownTab } from "./drilldown-tabs";
import {
  AutopilotPrompts,
  DrilldownTabContent,
} from "./ExpandedInsightContent";
import type { CardConfig, LayoutConfig } from "./glow-config";
import { InsightCardInner } from "./InsightCardInner";

export type ExpandPhase = "idle" | "width" | "height" | "full";

const sizeToFr: Record<string, string> = { sm: "1fr", md: "2fr", lg: "1fr" };

export function InsightGrid({
  layout,
  shared,
  cards,
  viewMode = "desktop",
  onAutopilotOpen,
  autopilotActiveIdx,
}: {
  layout: LayoutConfig;
  shared: string;
  cards: CardConfig;
  viewMode?: "desktop" | "compact" | "stacked";
  onAutopilotOpen?: (sourceTitle: string, idx: number) => void;
  autopilotActiveIdx?: number | null;
}) {
  const { data } = useDashboardData();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<ExpandPhase>("idle");
  const [drilldownTab, setDrilldownTab] = useState<DrilldownTab>("overview");

  useEffect(() => {
    if (expandedIdx === null) {
      setPhase("idle");
      setDrilldownTab("overview");
      return;
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
    .map((cfg, i) => {
      const dataCard = data.insightCards[i];
      const merged = dataCard
        ? {
            ...cfg,
            size: dataCard.size ?? cfg.size,
            interaction: dataCard.interaction ?? cfg.interaction,
            content: {
              ...cfg.content,
              title: dataCard.title ?? cfg.content.title,
            },
          }
        : cfg;
      return { cfg: merged, idx: i };
    })
    .filter(({ cfg }) => cfg.visible);
  const rows: (typeof visibleCards)[] = [];
  for (let i = 0; i < visibleCards.length; i += 2) {
    rows.push(visibleCards.slice(i, i + 2));
  }

  const isExpanding = expandedIdx !== null;
  const expandedRow = isExpanding
    ? rows.findIndex((row) => row.some(({ idx }) => idx === expandedIdx))
    : -1;

  const handleClick = (
    cfg: (typeof visibleCards)[number]["cfg"],
    idx: number,
  ) => {
    if (cfg.interaction === "expand") {
      setExpandedIdx(expandedIdx === idx ? null : idx);
    }
  };

  // Build grid-template-rows
  let rowTemplates: string[];
  if (viewMode === "compact") {
    rowTemplates = visibleCards.map(({ idx }) => {
      if (!isExpanding) return "1fr";
      if (idx === expandedIdx) return "1fr";
      if (phase !== "idle") return "0fr";
      return "1fr";
    });
  } else {
    rowTemplates = rows.map((_, rowIndex) => {
      const isOtherRow = isExpanding && rowIndex !== expandedRow;
      if (isOtherRow && (phase === "height" || phase === "full")) return "0fr";
      return "1fr";
    });
  }

  const sharedProps = {
    shared,
    cards,
    isExpanding,
    phase,
    viewMode,
    drilldownTab,
    onDrilldownTabChange: setDrilldownTab,
  };

  return (
    <div
      className={`relative grid transition-all duration-300 ease-in-out ${
        viewMode === "desktop"
          ? "h-full overflow-hidden"
          : viewMode === "compact"
            ? isExpanding
              ? "h-full overflow-hidden"
              : "h-full overflow-y-auto"
            : ""
      }`}
      style={{
        gap: phase === "height" || phase === "full" ? 0 : layout.gap,
        gridTemplateRows: rowTemplates.join(" "),
      }}
    >
      {viewMode === "compact"
        ? visibleCards.map(({ cfg, idx }) => {
            const isThis = idx === expandedIdx;
            const isOther = isExpanding && !isThis;
            return (
              <div
                key={idx}
                className="overflow-hidden min-h-0 transition-all duration-300 ease-in-out"
                style={{ opacity: isOther && phase !== "idle" ? 0 : 1 }}
              >
                <InsightCardInner
                  cfg={cfg}
                  cardIndex={idx}
                  {...sharedProps}
                  isThis={isThis}
                  onExpandClick={() => handleClick(cfg, idx)}
                  onAutopilotOpen={
                    onAutopilotOpen
                      ? () =>
                          onAutopilotOpen(
                            data.insightCards[idx]?.title ?? cfg.content.title,
                            idx,
                          )
                      : null
                  }
                  isAutopilotActive={autopilotActiveIdx === idx}
                  className="h-full"
                />
              </div>
            );
          })
        : rows.map((row, rowIndex) => {
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
                className="grid transition-all duration-300 ease-in-out overflow-hidden min-h-0"
                style={
                  {
                    gridTemplateColumns: cols,
                    gap: isRowWithExpanded && phase !== "idle" ? 0 : layout.gap,
                    opacity:
                      isOtherRow && (phase === "height" || phase === "full")
                        ? 0
                        : 1,
                  } as React.CSSProperties
                }
              >
                {row.map(({ cfg, idx }) => {
                  const isThis = idx === expandedIdx;
                  const isSibling = isExpanding && !isThis && isRowWithExpanded;
                  return (
                    <InsightCardInner
                      key={idx}
                      cfg={cfg}
                      cardIndex={idx}
                      {...sharedProps}
                      isThis={isThis}
                      onExpandClick={() => handleClick(cfg, idx)}
                      onAutopilotOpen={
                        onAutopilotOpen
                          ? () =>
                              onAutopilotOpen(
                                data.insightCards[idx]?.title ??
                                  cfg.content.title,
                                idx,
                              )
                          : null
                      }
                      isAutopilotActive={autopilotActiveIdx === idx}
                      style={{
                        opacity: isSibling && phase !== "idle" ? 0 : 1,
                        transform:
                          isSibling && phase !== "idle"
                            ? "scale(0.95)"
                            : "scale(1)",
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
    </div>
  );
}

// Re-export for consumers that import these from InsightGrid
export { DrilldownTabContent, AutopilotPrompts };
export type { DrilldownTab };
