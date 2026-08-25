"use client";

import {
  ArrowUpRight,
  Clock,
  FileCheck,
  Maximize2,
  Minimize2,
  Unlink,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AiMark } from "@/registry/ai-mark/ai-mark";
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

// One muted icon beside each card title (prompt 85), naming the card's own
// subject rather than decorating it, so it stays a text-sized visual cue
// rather than an illustration.
const CARD_TITLE_ICONS = {
  clock: Clock,
  "file-check": FileCheck,
  zap: Zap,
  unlink: Unlink,
} as const;

// How long the skeleton shows once the card has finished growing, before
// the real expanded content swaps in.
const SKELETON_MS = 350;

function ExpandSkeleton() {
  return (
    <div className="flex flex-1 flex-col min-h-0 justify-center gap-3">
      <div className="h-4 w-2/3 rounded-full bg-muted/50 animate-pulse" />
      <div className="h-4 w-1/2 rounded-full bg-muted/50 animate-pulse" />
      <div className="h-4 w-3/4 rounded-full bg-muted/50 animate-pulse" />
    </div>
  );
}

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
  onAskClick?: (() => void) | null;
  isAskActive?: boolean;
  hasActiveAsk?: boolean;
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
  onAskClick,
  isAskActive = false,
  hasActiveAsk = false,
  className = "",
  style,
}: InsightCardInnerProps) {
  const { data } = useDashboardData();
  const cardData = data.insightCards[cardIndex];
  const cardTitle = cardData?.title ?? cfg.content.title;
  const TitleIcon = cardData?.icon ? CARD_TITLE_ICONS[cardData.icon] : null;
  // The reveal sequence on expand: the face fades out quickly while the
  // card is still growing (phase "width"/"height"), a skeleton shows once
  // it has finished growing (phase "full"), then the real expanded
  // content swaps in after a brief pause, never mid-growth.
  const [skeletonElapsed, setSkeletonElapsed] = useState(false);
  useEffect(() => {
    if (isThis && isExpanding && phase === "full") {
      const t = setTimeout(() => setSkeletonElapsed(true), SKELETON_MS);
      return () => clearTimeout(t);
    }
    setSkeletonElapsed(false);
  }, [isThis, isExpanding, phase]);
  const isFading =
    isThis && isExpanding && (phase === "width" || phase === "height");
  const showSkeleton =
    isThis && isExpanding && phase === "full" && !skeletonElapsed;
  const showExpandedBody =
    isThis && isExpanding && phase === "full" && skeletonElapsed;
  // Drilldown tabs read hardcoded sample content (ExpandedInsightContent.tsx)
  // with no connection to Elena's own data, so they never fire here (prompt
  // 66); every card's expand instead reveals the same visual with its full
  // detail, via InsightCardBody's own isExpanded branch.
  const hasDrilldown = false;
  const isExpandedWithDrilldown =
    isThis && isExpanding && hasDrilldown && phase === "full";
  const classes = getInsightCardClasses(cfg.content, viewMode);
  const isInteractive = cfg.interaction !== "static";
  // Prompt 90: a card offers to answer only once its own scripted answer
  // is registered, never before, so an unanswerable card never invites
  // the question.
  const hasAsk = !!cardData?.askAnswer;
  const isDimmed = hasActiveAsk && !isAskActive;

  return (
    <Card
      variant="glass"
      className={`${(isThis && isExpanding) || isAutopilotActive ? "!bg-white dark:!bg-card !shadow-[0_2px_24px_2px_rgba(0,0,0,0.08)] dark:!shadow-[0_2px_24px_2px_rgba(0,0,0,0.2)]" : "!bg-white/70 hover:!bg-white dark:hover:!bg-card hover:!shadow-[0_2px_24px_2px_rgba(0,0,0,0.08)] dark:hover:!shadow-[0_2px_24px_2px_rgba(0,0,0,0.2)]"} ${isDimmed ? "opacity-50" : ""} ${shared} ${classes.cardClassName} !py-6 group/card relative transition-all duration-300 ease-in-out overflow-hidden ${className}`}
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
        <CardTitle className="flex min-h-7 items-center gap-1.5 self-center text-sm font-bold tracking-tight">
          {TitleIcon && (
            <TitleIcon className="size-4 shrink-0 text-muted-foreground" />
          )}
          {cardTitle}
        </CardTitle>
        {(hasAsk || (isInteractive && cfg.interaction === "expand")) && (
          <CardAction className="row-span-1 self-center">
            <div
              className={`flex items-center gap-1 transition-all duration-75 ${
                isThis || isAutopilotActive || isAskActive
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0 group-focus-within/card:opacity-100 group-focus-within/card:translate-x-0"
              }`}
            >
              {hasAsk && (
                <button
                  type="button"
                  aria-label="Ask about this card"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskClick?.();
                  }}
                  className={`size-7 rounded-md flex items-center justify-center transition-all ${
                    isAskActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <AiMark
                    size={16}
                    {...(isAskActive ? { gradientId: "gb-ai-mark" } : {})}
                  />
                </button>
              )}
              {hasAsk && isInteractive && cfg.interaction === "expand" && (
                <div className="h-4 w-px bg-border/60" />
              )}
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
              {isInteractive && cfg.interaction === "expand" && (
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
              )}
            </div>
          </CardAction>
        )}
        {isInteractive && cfg.interaction === "navigate" && !isThis && (
          <CardAction className="row-span-1 self-center">
            <button
              type="button"
              className="size-7 rounded-md flex items-center justify-center opacity-0 translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all duration-75 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <ArrowUpRight className="size-4" />
            </button>
          </CardAction>
        )}
        {/* Drilldown tabs: below title when expanded */}
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
        /* Expanded with drilldown: unified layout for all tabs */
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
        /* Default card content: not expanded or no drilldown */
        <CardContent
          className={`${classes.contentClassName} !flex-1 min-h-0 transition-opacity duration-150 ${isFading ? "!opacity-0" : "opacity-100"}`}
        >
          {showSkeleton ? (
            <ExpandSkeleton />
          ) : (
            <div
              className={
                showExpandedBody
                  ? "flex flex-1 flex-col min-h-0 [&>*>*]:animate-in [&>*>*]:fade-in [&>*>*]:fill-mode-both [&>*>*]:duration-300 [&>*>*:nth-child(2)]:delay-75 [&>*>*:nth-child(3)]:delay-150 [&>*>*:nth-child(4)]:delay-200"
                  : "flex flex-1 flex-col min-h-0"
              }
            >
              <InsightCardBody
                content={cfg.content}
                cardIndex={cardIndex}
                isExpanded={showExpandedBody}
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export type { InsightCardInnerProps };
