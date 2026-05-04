"use client";

import { ArrowUpRight, Maximize2, Minimize2 } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboardData } from "./dashboard-data-context";
import { type DrilldownTab, drilldownTabs } from "./drilldown-tabs";
import {
  AutopilotPrompts,
  DrilldownTabContent,
} from "./ExpandedInsightContent";
import {
  type CardConfig,
  cardBgStyle,
  getInsightCardClasses,
  type InsightCardConfig,
} from "./glow-config";
import type { ExpandPhase } from "./InsightGrid";
import { InsightCardBody } from "./insight-card-renderers";

interface InsightCardInnerProps {
  cfg: InsightCardConfig;
  cardIndex: number;
  shared: string;
  cards: CardConfig;
  isExpanding: boolean;
  isThis: boolean;
  phase: ExpandPhase;
  viewMode: "desktop" | "compact" | "stacked";
  drilldownTab: DrilldownTab;
  onDrilldownTabChange: (tab: DrilldownTab) => void;
  onExpandClick: () => void;
  onAutopilotOpen?: (() => void) | null;
  isAutopilotActive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function InsightCardInner({
  cfg,
  cardIndex,
  shared,
  cards,
  isExpanding,
  isThis,
  phase,
  viewMode,
  onExpandClick,
  onAutopilotOpen,
  drilldownTab,
  onDrilldownTabChange,
  isAutopilotActive = false,
  className = "",
  style,
}: InsightCardInnerProps) {
  const { data } = useDashboardData();
  const cardTitle = data.insightCards[cardIndex]?.title ?? cfg.content.title;
  const hasDrilldown = cfg.content.chartType === "horizontal-bars";
  const isExpandedWithDrilldown =
    isThis && isExpanding && hasDrilldown && phase === "full";
  const classes = getInsightCardClasses(cfg.content, viewMode);
  const isInteractive = cfg.interaction !== "static";

  return (
    <Card
      variant="glass"
      className={`${(isThis && isExpanding) || isAutopilotActive ? "!bg-white dark:!bg-card !shadow-[0_2px_24px_2px_rgba(0,0,0,0.08)] dark:!shadow-[0_2px_24px_2px_rgba(0,0,0,0.2)]" : "!bg-white/70"} ${shared} ${classes.cardClassName} group/card relative transition-all duration-300 ease-in-out overflow-hidden ${className}`}
      style={{
        ...cardBgStyle(
          cards.insightBg,
          cards.insightOpacity,
          cards.insightGradient,
        ),
        ...style,
      }}
    >
      <CardHeader className="shrink-0">
        <CardTitle className="text-sm font-bold tracking-tight">
          {cardTitle}
        </CardTitle>
        {isInteractive && cfg.interaction === "expand" && (
          <CardAction>
            <div
              className={`flex items-center gap-1 transition-all duration-75 ${
                isThis || isAutopilotActive
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0"
              }`}
            >
              {onAutopilotOpen && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAutopilotOpen();
                  }}
                  className={`size-7 rounded-md flex items-center justify-center transition-all ${
                    isAutopilotActive
                      ? "bg-gradient-to-br from-insight-500 to-primary-400 text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {isAutopilotActive ? (
                    <img
                      src="/Autopilot_light.svg"
                      alt="AI Assistant"
                      className="size-4"
                    />
                  ) : (
                    <>
                      <img
                        src="/Autopilot_dark.svg"
                        alt="AI Assistant"
                        className="size-4 block dark:hidden"
                      />
                      <img
                        src="/Autopilot_light.svg"
                        alt="AI Assistant"
                        className="size-4 hidden dark:block"
                      />
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={onExpandClick}
                className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                {isThis && isExpanding ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </button>
            </div>
          </CardAction>
        )}
        {isInteractive && cfg.interaction === "navigate" && !isThis && (
          <CardAction>
            <button
              type="button"
              className="size-7 rounded-md flex items-center justify-center opacity-0 translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all duration-75 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <ArrowUpRight className="size-4" />
            </button>
          </CardAction>
        )}
        {/* Drilldown tabs — below title when expanded */}
        {isThis &&
          isExpanding &&
          hasDrilldown &&
          (phase === "height" || phase === "full") &&
          (() => {
            const visibleTabs = drilldownTabs.slice(0, 4);
            const overflowTabs = drilldownTabs.slice(4);
            const isOverflowActive = overflowTabs.some(
              (t) => t.key === drilldownTab,
            );
            return (
              <div
                className={`flex gap-0.5 items-center transition-opacity duration-300 mt-3 mb-1 -ml-2 ${phase === "full" ? "opacity-100" : "opacity-0"}`}
              >
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => onDrilldownTabChange(tab.key)}
                    className={`px-2 py-1 text-xs rounded transition-colors font-medium ${
                      drilldownTab === tab.key
                        ? "bg-muted dark:bg-foreground/15"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-foreground/15"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                {overflowTabs.length > 0 && (
                  <div className="relative">
                    <select
                      value={isOverflowActive ? drilldownTab : ""}
                      onChange={(e) => {
                        const tab = drilldownTabs.find(
                          (t) => t.key === e.target.value,
                        );
                        if (tab) onDrilldownTabChange(tab.key);
                      }}
                      className={`appearance-none px-2 py-1 text-xs rounded transition-colors cursor-pointer bg-transparent pr-5 ${
                        isOverflowActive
                          ? "bg-muted font-medium"
                          : "font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {!isOverflowActive && <option value="">More…</option>}
                      {overflowTabs.map((tab) => (
                        <option key={tab.key} value={tab.key}>
                          {tab.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-1 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 5l3 3 3-3" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })()}
      </CardHeader>
      {isExpandedWithDrilldown ? (
        /* Expanded with drilldown — unified layout for all tabs */
        <div className="flex-1 min-h-0 flex flex-col px-6 !-mt-2">
          <div className="flex-1 min-h-0 relative">
            <div
              className="absolute inset-0 overflow-y-auto pb-8"
              style={{
                maskImage:
                  "linear-gradient(to bottom, black 85%, transparent 100%)",
              }}
            >
              {drilldownTab === "overview" ? (
                <InsightCardBody
                  content={cfg.content}
                  cardIndex={cardIndex}
                  viewMode={viewMode}
                  isExpanded={isThis && isExpanding}
                />
              ) : (
                <DrilldownTabContent tab={drilldownTab} />
              )}
            </div>
          </div>
          <div className="shrink-0 pb-2">
            <AutopilotPrompts onPromptSelect={() => onAutopilotOpen?.()} />
          </div>
        </div>
      ) : (
        /* Default card content — not expanded or no drilldown */
        <CardContent className={`${classes.contentClassName} !flex-1 min-h-0`}>
          <InsightCardBody
            content={cfg.content}
            cardIndex={cardIndex}
            viewMode={viewMode}
            isExpanded={isThis && isExpanding}
          />
        </CardContent>
      )}
      {/* Non-drilldown expanded content (other card types) */}
      {isThis &&
        isExpanding &&
        !hasDrilldown &&
        (phase === "height" || phase === "full") && (
          <div
            className={`flex-1 mx-6 mb-6 rounded-lg overflow-hidden transition-all duration-300 ${
              phase === "full"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }`}
          >
            {phase === "full" ? (
              <div className="h-full border border-dashed border-muted-foreground/15 bg-muted/30 rounded-lg flex items-center justify-center">
                <span className="text-xs text-muted-foreground/40">
                  Additional content
                </span>
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
}

export type { InsightCardInnerProps };
