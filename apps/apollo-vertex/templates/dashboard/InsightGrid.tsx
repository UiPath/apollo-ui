"use client";

import {
  ArrowUpRight,
  GripVertical,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboardData } from "./DashboardDataProvider";
import {
  AutopilotPrompts,
  type DrilldownTab,
  DrilldownTabContent,
  drilldownTabs,
} from "./ExpandedInsightContent";
import {
  type CardConfig,
  cardBgStyle,
  getInsightCardClasses,
  type InsightCardConfig,
  type LayoutConfig,
} from "./glow-config";
import { InsightCardBody } from "./insight-card-renderers";

const sizeToFr: Record<string, string> = { sm: "1fr", md: "2fr", lg: "1fr" };

// --- Edit mode types and components ---

interface EditCardItem {
  id: string;
  title: string;
  size: "sm" | "md" | "lg";
}

function SkeletonEditCard({
  item,
  cardRef,
  isDragging,
  isDropTarget,
  onGripPointerDown,
  onRemove,
  onResize,
}: {
  item: EditCardItem;
  cardRef: (el: HTMLDivElement | null) => void;
  isDragging: boolean;
  isDropTarget: boolean;
  onGripPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onRemove: () => void;
  onResize: (size: "sm" | "md" | "lg") => void;
}) {
  return (
    <div
      ref={cardRef}
      className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-150 bg-card/50 dark:bg-card/40 ${
        isDragging ? "opacity-40 scale-[0.97]" : ""
      } ${isDropTarget ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
    >
      {/* Title */}
      <div className="px-4 pt-3.5 pb-2 shrink-0">
        <span className="text-xs font-semibold text-foreground/50 truncate block pr-6">
          {item.title}
        </span>
      </div>

      {/* Static skeleton bars */}
      <div className="flex-1 min-h-0 px-4 pb-10 flex items-end gap-1">
        {[38, 62, 48, 72, 55, 80, 44].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-muted-foreground/[0.07]"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>

      {/* Drag grip — top left */}
      <div
        onPointerDown={onGripPointerDown}
        className="absolute top-3 left-3 size-5 flex items-center justify-center cursor-grab active:cursor-grabbing rounded hover:bg-muted/40 transition-colors touch-none select-none"
      >
        <GripVertical className="size-3.5 text-muted-foreground/30" />
      </div>

      {/* Remove — top right */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2.5 right-2.5 size-5 flex items-center justify-center rounded text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <X className="size-3" />
      </button>

      {/* Size toggles — bottom right */}
      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-0.5">
        {(["sm", "md", "lg"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onResize(s)}
            className={`w-6 h-5 text-[10px] rounded font-semibold transition-colors ${
              item.size === s
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {s === "sm" ? "S" : s === "md" ? "M" : "L"}
          </button>
        ))}
      </div>
    </div>
  );
}

function EditSkeletonGrid({
  editItems,
  onReorderEditItems,
  onRemoveEditItem,
  onResizeEditItem,
  gap,
}: {
  editItems: EditCardItem[];
  onReorderEditItems?: (items: EditCardItem[]) => void;
  onRemoveEditItem?: (id: string) => void;
  onResizeEditItem?: (id: string, size: "sm" | "md" | "lg") => void;
  gap: number;
}) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  const getNearestIdx = useCallback(
    (clientX: number, clientY: number, excludeIdx: number): number | null => {
      let closest: number | null = null;
      let closestDist = Infinity;
      cardRefs.current.forEach((ref, i) => {
        if (i === excludeIdx || !ref) return;
        const r = ref.getBoundingClientRect();
        const d = Math.hypot(
          clientX - (r.left + r.width / 2),
          clientY - (r.top + r.height / 2),
        );
        if (d < closestDist) {
          closestDist = d;
          closest = i;
        }
      });
      return closest;
    },
    [],
  );

  const handleGripPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, fromIdx: number) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDraggingIdx(fromIdx);
      setDropIdx(null);
      let currentDrop: number | null = null;
      const el = e.currentTarget;
      const onMove = (me: PointerEvent) => {
        currentDrop = getNearestIdx(me.clientX, me.clientY, fromIdx);
        setDropIdx(currentDrop);
      };
      const onUp = () => {
        if (currentDrop !== null && currentDrop !== fromIdx) {
          const next = [...editItems];
          [next[fromIdx], next[currentDrop]] = [
            next[currentDrop],
            next[fromIdx],
          ];
          onReorderEditItems?.(next);
        }
        setDraggingIdx(null);
        setDropIdx(null);
        el.removeEventListener("pointermove", onMove);
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp, { once: true });
    },
    [editItems, getNearestIdx, onReorderEditItems],
  );

  const rows: Array<Array<{ item: EditCardItem; idx: number }>> = [];
  let ei = 0;
  while (ei < editItems.length) {
    if (editItems[ei].size === "lg") {
      rows.push([{ item: editItems[ei], idx: ei }]);
      ei++;
    } else if (ei + 1 < editItems.length && editItems[ei + 1].size !== "lg") {
      rows.push([
        { item: editItems[ei], idx: ei },
        { item: editItems[ei + 1], idx: ei + 1 },
      ]);
      ei += 2;
    } else {
      rows.push([{ item: editItems[ei], idx: ei }]);
      ei++;
    }
  }

  return (
    <div className="h-full flex flex-col" style={{ gap }}>
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="flex-1 min-h-0 grid"
          style={{
            gridTemplateColumns: row
              .map(({ item }) => sizeToFr[item.size])
              .join(" "),
            gap,
          }}
        >
          {row.map(({ item, idx }) => (
            <SkeletonEditCard
              key={item.id}
              item={item}
              cardRef={(el) => {
                cardRefs.current[idx] = el;
              }}
              isDragging={draggingIdx === idx}
              isDropTarget={dropIdx === idx}
              onGripPointerDown={(e) => handleGripPointerDown(e, idx)}
              onRemove={() => onRemoveEditItem?.(item.id)}
              onResize={(size) => onResizeEditItem?.(item.id, size)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// --- Shared card inner content ---

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
  onAutopilotOpen?: (prompt?: string) => void;
  isAutopilotActive?: boolean;
  isAutopilotUnread?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function InsightCardInner({
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
  isAutopilotUnread = false,
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
                isThis || isAutopilotActive || isAutopilotUnread
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0"
              }`}
            >
              {onAutopilotOpen && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isAutopilotActive) {
                      onAutopilotOpen(); // no prompt = toggle close
                    } else {
                      onAutopilotOpen(
                        `What are the key insights from the ${cardTitle} data?`,
                      );
                    }
                  }}
                  className={`relative size-7 rounded-md flex items-center justify-center transition-all ${
                    isAutopilotActive
                      ? "bg-gradient-to-br from-insight-500 to-primary-400 text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {isAutopilotActive ? (
                    <img
                      src="/Autopilot_light.svg"
                      alt="AI assistant"
                      className="size-4"
                    />
                  ) : (
                    <>
                      <img
                        src="/Autopilot_dark.svg"
                        alt="AI assistant"
                        className="size-4 block dark:hidden"
                      />
                      <img
                        src="/Autopilot_light.svg"
                        alt="AI assistant"
                        className="size-4 hidden dark:block"
                      />
                    </>
                  )}
                  {isAutopilotUnread && (
                    <span className="absolute -top-0.5 -right-0.5 flex size-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-insight-500 opacity-75" />
                      <span className="relative inline-flex rounded-full size-2 bg-insight-500" />
                    </span>
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
                        if (e.target.value)
                          onDrilldownTabChange(e.target.value as DrilldownTab);
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
            <AutopilotPrompts
              onPromptSelect={(prompt) => onAutopilotOpen?.(prompt)}
            />
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

// --- Main grid ---

type ExpandPhase = "idle" | "width" | "height" | "full";

export function InsightGrid({
  layout,
  shared,
  cards,
  viewMode = "desktop",
  onAutopilotOpen,
  autopilotActiveIdx,
  autopilotUnreadIdx,
  expandedIdx: controlledExpandedIdx,
  onExpandedChange,
  editMode = false,
  editItems = [],
  onReorderEditItems,
  onRemoveEditItem,
  onResizeEditItem,
}: {
  layout: LayoutConfig;
  shared: string;
  cards: CardConfig;
  viewMode?: "desktop" | "compact" | "stacked";
  onAutopilotOpen?: (sourceTitle: string, idx: number, prompt?: string) => void;
  autopilotActiveIdx?: number | null;
  autopilotUnreadIdx?: number | null;
  expandedIdx?: number | null;
  onExpandedChange?: (idx: number | null) => void;
  editMode?: boolean;
  editItems?: EditCardItem[];
  onReorderEditItems?: (items: EditCardItem[]) => void;
  onRemoveEditItem?: (id: string) => void;
  onResizeEditItem?: (id: string, size: "sm" | "md" | "lg") => void;
}) {
  const { data } = useDashboardData();
  const [internalExpandedIdx, setInternalExpandedIdx] = useState<number | null>(
    null,
  );
  const expandedIdx =
    controlledExpandedIdx !== undefined
      ? controlledExpandedIdx
      : internalExpandedIdx;
  const setExpandedIdx = (idx: number | null) => {
    setInternalExpandedIdx(idx);
    onExpandedChange?.(idx);
  };
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
  let vi = 0;
  while (vi < visibleCards.length) {
    if (visibleCards[vi].cfg.size === "lg") {
      rows.push([visibleCards[vi]]);
      vi++;
    } else if (
      vi + 1 < visibleCards.length &&
      visibleCards[vi + 1].cfg.size !== "lg"
    ) {
      rows.push([visibleCards[vi], visibleCards[vi + 1]]);
      vi += 2;
    } else {
      rows.push([visibleCards[vi]]);
      vi++;
    }
  }

  const isExpanding = expandedIdx !== null;
  const expandedRow = isExpanding
    ? rows.findIndex((row) => row.some(({ idx }) => idx === expandedIdx))
    : -1;

  const handleClick = (cfg: InsightCardConfig, idx: number) => {
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

  if (editMode && editItems.length > 0) {
    return (
      <EditSkeletonGrid
        editItems={editItems}
        onReorderEditItems={onReorderEditItems}
        onRemoveEditItem={onRemoveEditItem}
        onResizeEditItem={onResizeEditItem}
        gap={layout.gap}
      />
    );
  }

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
                      ? (prompt?: string) =>
                          onAutopilotOpen(
                            data.insightCards[idx]?.title ?? cfg.content.title,
                            idx,
                            prompt,
                          )
                      : undefined
                  }
                  isAutopilotActive={autopilotActiveIdx === idx}
                  isAutopilotUnread={autopilotUnreadIdx === idx}
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
                          ? (prompt?: string) =>
                              onAutopilotOpen(
                                data.insightCards[idx]?.title ??
                                  cfg.content.title,
                                idx,
                                prompt,
                              )
                          : undefined
                      }
                      isAutopilotActive={autopilotActiveIdx === idx}
                      isAutopilotUnread={autopilotUnreadIdx === idx}
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
