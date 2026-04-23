"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/registry/sonner/sonner";
import { AutopilotInsight } from "./AutopilotInsight";
import type { InsightCardData } from "./dashboard-data";
import { type AIScreen, detectLayoutIntent } from "./dashboard-layout-presets";
import {
  DashboardDataProvider,
  useDashboardData,
} from "./DashboardDataProvider";
import { DashboardGlow } from "./DashboardGlow";
import { DashboardLoading } from "./DashboardLoading";
import { GlowDevControls } from "./GlowDevControls";
import {
  type CardConfig,
  cardBgStyle,
  defaultDarkCards,
  defaultDarkGlow,
  defaultLayout,
  type GlowConfig,
  type LayoutConfig,
} from "./glow-config";
import { InsightGrid } from "./InsightGrid";
import { PromptBar } from "./PromptBar";

type LayoutType = "executive" | "operational" | "analytics";

type SkeletonCard = { title: string; size?: "sm" | "md" | "lg" };

function GridSkeleton({
  label,
  cards,
}: {
  label: string;
  cards: SkeletonCard[];
}) {
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    setRevealedCount(0);
    const timers = cards.map((_, i) =>
      setTimeout(() => setRevealedCount(i + 1), 200 + i * 260),
    );
    return () => timers.forEach(clearTimeout);
  }, [cards]);

  const rows: Array<Array<{ card: SkeletonCard; globalIdx: number }>> = [];
  for (let i = 0; i < cards.length; i += 2) {
    rows.push(
      cards.slice(i, i + 2).map((card, j) => ({ card, globalIdx: i + j })),
    );
  }

  return (
    <div className="h-full flex flex-col gap-1">
      <div className="flex items-center gap-2 px-0.5 h-7 shrink-0">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 rounded-full bg-gradient-to-br from-insight-500 to-primary-400"
              style={{
                animation: "skeletonBounce 0.9s ease-in-out infinite",
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          Building{" "}
          <span className="font-semibold text-foreground">{label}</span> view
        </span>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-1">
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="flex-1 min-h-0 grid gap-1"
            style={{
              gridTemplateColumns: row
                .map(({ card }) => (card.size === "sm" ? "1fr" : "2fr"))
                .join(" "),
            }}
          >
            {row.map(({ card, globalIdx }) => {
              const isRevealed = globalIdx < revealedCount;
              return (
                <div
                  key={globalIdx}
                  className="rounded-2xl border border-border/40 bg-card/40 dark:bg-card/20 backdrop-blur-sm flex flex-col p-4 gap-3 overflow-hidden"
                  style={{
                    transition: "opacity 0.4s ease",
                    opacity: isRevealed ? 1 : 0.45,
                  }}
                >
                  <div
                    className="transition-all duration-300"
                    style={{
                      opacity: isRevealed ? 1 : 0,
                      transform: isRevealed
                        ? "translateY(0)"
                        : "translateY(4px)",
                    }}
                  >
                    <p className="text-xs font-semibold tracking-tight truncate">
                      {card.title}
                    </p>
                  </div>
                  {!isRevealed && (
                    <div className="h-2.5 w-24 rounded-full bg-muted/60 animate-pulse" />
                  )}
                  <div className="flex-1 flex items-end gap-0.5 pb-1 min-h-0">
                    {Array.from({ length: 6 }, (_, j) => (
                      <div
                        key={j}
                        className={`flex-1 rounded-sm transition-colors duration-500 ${isRevealed ? "bg-muted-foreground/20" : "bg-muted/40 animate-pulse"}`}
                        style={{
                          height: `${28 + ((j * 19 + rowIdx * 13 + globalIdx * 7) % 48)}%`,
                          animationDelay: `${j * 90}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes skeletonBounce {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-4px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function HeroSparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = 100 / (points.length - 1);
  const coords = points.map((v, i): [number, number] => [
    i * step,
    8 + (1 - (v - min) / range) * 76,
  ]);
  const linePts = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = [
    "M0,100",
    ...coords.map(([x, y]) => `L${x},${y}`),
    "L100,100",
    "Z",
  ].join(" ");
  const lastY = coords[coords.length - 1][1];

  const fmt = (v: number) =>
    v >= 10000
      ? `${Math.round(v / 1000)}k`
      : v >= 1000
        ? `${(v / 1000).toFixed(1)}k`
        : v < 10
          ? v.toFixed(1)
          : Number.isInteger(v)
            ? v.toString()
            : v.toFixed(1);

  return (
    <div className="flex flex-col w-full h-full">
      {/* Chart area */}
      <div className="relative flex-1 min-h-0">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
          aria-hidden
        >
          <defs>
            <linearGradient id="hero-sparkline-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-insight-500)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--color-insight-500)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#hero-sparkline-grad)" />
          <polyline
            points={linePts}
            fill="none"
            stroke="var(--color-insight-500)"
            strokeWidth="2"
            strokeOpacity="0.55"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* 4px CSS circle dot at line endpoint */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 4,
            height: 4,
            right: 0,
            top: `${lastY}%`,
            transform: "translateY(-50%)",
            background: "var(--color-insight-500)",
            opacity: 0.9,
          }}
        />
      </div>
      {/* Labels row */}
      <div className="flex items-center justify-between pt-1.5 shrink-0 select-none">
        <span className="text-[10px] leading-none text-muted-foreground/40 tabular-nums font-mono">
          {fmt(points[0])}
        </span>
        <span className="text-[10px] leading-none text-muted-foreground/25">
          {points.length} wks
        </span>
        <span className="text-[10px] leading-none text-foreground/55 font-semibold tabular-nums">
          {fmt(points[points.length - 1])}
        </span>
      </div>
    </div>
  );
}

function ScreenNavigator({
  screens,
  activeIdx,
  onChange,
  onRemove,
}: {
  screens: string[];
  activeIdx: number;
  onChange: (idx: number) => void;
  onRemove?: (idx: number) => void;
}) {
  return (
    <motion.nav
      className="flex items-center bg-muted rounded-full p-1 overflow-x-auto scrollbar-none"
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {screens.map((label, i) => (
        <div key={label} className="group/pill relative shrink-0">
          <button
            type="button"
            onClick={() => onChange(i)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              activeIdx === i
                ? "bg-gradient-to-r from-insight-600 to-primary-500 dark:from-insight-700 dark:to-primary-600 text-white font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {i > 0 ? `✦ ${label}` : label}
          </button>
          {i > 0 && onRemove && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              aria-label={`Remove ${label}`}
              className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 flex items-center justify-center text-[11px] leading-none rounded-full opacity-0 group-hover/pill:opacity-50 hover:!opacity-100 transition-opacity text-foreground"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </motion.nav>
  );
}

function ExecutiveLayout({
  cards,
  layout,
  activeLayout,
  viewMode,
  buildingLabel,
  buildingCards,
  activeScreenIdx,
  slideDir,
  onAutopilotOpen,
  autopilotActiveIdx,
  autopilotUnreadIdx,
  expandedCardIdx,
  onExpandedChange,
  onPromptSubmit,
  pendingScreen,
  onConfirmBuild,
  onCancelBuild,
  activeHeadline,
  activeSubhead,
  isEditMode,
  editItems,
  onReorderEditItems,
  onRemoveEditItem,
  onResizeEditItem,
  aiScreenLabels,
  onPinChart,
  heroPoints,
}: {
  cards: CardConfig;
  layout: LayoutConfig;
  activeLayout: LayoutConfig;
  viewMode: ViewMode;
  buildingLabel: string | null;
  buildingCards: SkeletonCard[];
  activeScreenIdx: number;
  slideDir: number;
  onAutopilotOpen?: (sourceTitle: string, idx: number) => void;
  autopilotActiveIdx?: number | null;
  autopilotUnreadIdx?: number | null;
  expandedCardIdx?: number | null;
  onExpandedChange?: (idx: number | null) => void;
  onPromptSubmit: (query: string) => void;
  pendingScreen: AIScreen | null;
  onConfirmBuild: (selectedIndices: number[]) => void;
  onCancelBuild: () => void;
  activeHeadline: string;
  activeSubhead: string;
  isEditMode: boolean;
  editItems: Array<{ id: string; title: string; size: "sm" | "md" | "lg" }>;
  onReorderEditItems: (
    items: Array<{ id: string; title: string; size: "sm" | "md" | "lg" }>,
  ) => void;
  onRemoveEditItem: (id: string) => void;
  onResizeEditItem: (id: string, size: "sm" | "md" | "lg") => void;
  aiScreenLabels: string[];
  onPinChart: (card: InsightCardData, screenIdx: number) => void;
  heroPoints: number[];
}) {
  const { data } = useDashboardData();
  const [promptExpanded, setPromptExpanded] = useState(false);

  const borderClass = cards.borderVisible ? "" : "dark:!border-transparent";
  const blurClass = cards.backdropBlur ? "" : "dark:!backdrop-blur-none";
  const shared = `!shadow-none dark:![background:var(--card-bg-override)] ${borderClass} ${blurClass}`;
  const gapStyle = { gap: `${layout.gap}px` };

  return (
    <div
      className="grid grid-cols-1 @[800px]:grid-cols-2 @[800px]:h-full"
      style={gapStyle}
    >
      <div
        className="flex flex-col-reverse h-full overflow-hidden"
        style={{ gap: promptExpanded ? 0 : layout.gap }}
      >
        <PromptBar
          shared={shared}
          cards={cards}
          isExpanded={promptExpanded}
          onSubmit={(q) => {
            setPromptExpanded(true);
            onPromptSubmit(q);
          }}
          onExpand={() => setPromptExpanded(true)}
          onCollapse={() => setPromptExpanded(false)}
          pendingScreen={pendingScreen}
          onConfirmBuild={onConfirmBuild}
          onCancelBuild={onCancelBuild}
          aiScreenLabels={aiScreenLabels}
          onPinChart={onPinChart}
        />
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            promptExpanded ? "flex-[0_0_0%] opacity-0" : "flex-1 opacity-100"
          }`}
        >
          <Card
            variant="glass"
            className={`!bg-white/90 h-full !gap-4 !p-8 !pt-10 overflow-hidden ${shared}`}
            style={cardBgStyle(
              cards.overviewBg,
              cards.overviewOpacity,
              cards.overviewGradient,
            )}
          >
            <CardHeader className="!p-0 !gap-2">
              <img
                src="/Autopilot_dark.svg"
                alt="Autopilot"
                className="size-5 block dark:hidden"
              />
              <img
                src="/Autopilot_light.svg"
                alt="Autopilot"
                className="size-5 hidden dark:block"
              />
              <CardTitle className="text-sm font-bold tracking-tight">
                {data.greeting}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col !p-0 min-h-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeHeadline}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-4xl font-bold tracking-tight pr-16">
                    {activeHeadline}
                  </p>
                  <p className="text-sm font-normal text-muted-foreground pr-32 mt-8 leading-relaxed">
                    {activeSubhead}
                  </p>
                </motion.div>
              </AnimatePresence>
              {/* Spacer: grows to fill space, minimum 80px gap from subtext */}
              <div className="flex-1 min-h-20" />
              {/* Hero sparkline — respects card padding, taller */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={heroPoints.join(",")}
                  className="h-36 shrink-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.1,
                  }}
                >
                  <HeroSparkline points={heroPoints} />
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="h-full overflow-hidden">
        <div className="h-full relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {buildingLabel ? (
              <motion.div
                key="building"
                className="absolute inset-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <GridSkeleton label={buildingLabel} cards={buildingCards} />
              </motion.div>
            ) : (
              <motion.div
                key={activeScreenIdx}
                className="absolute inset-0"
                initial={{ opacity: 0, x: slideDir * 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDir * -20 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <InsightGrid
                  layout={activeLayout}
                  shared={shared}
                  cards={cards}
                  viewMode={viewMode}
                  onAutopilotOpen={onAutopilotOpen}
                  autopilotActiveIdx={autopilotActiveIdx}
                  autopilotUnreadIdx={autopilotUnreadIdx}
                  expandedIdx={expandedCardIdx}
                  onExpandedChange={onExpandedChange}
                  editMode={isEditMode}
                  editItems={editItems}
                  onReorderEditItems={onReorderEditItems}
                  onRemoveEditItem={onRemoveEditItem}
                  onResizeEditItem={onResizeEditItem}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function OperationalLayout() {
  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Operational layout — coming soon
    </div>
  );
}

function AnalyticsLayout() {
  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Analytics layout — coming soon
    </div>
  );
}

// --- Main component ---

type ViewMode = "desktop" | "compact" | "stacked";

function useViewMode(ref: React.RefObject<HTMLDivElement | null>): ViewMode {
  const [mode, setMode] = useState<ViewMode>("desktop");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w >= 1100) setMode("desktop");
      else if (w >= 800) setMode("compact");
      else setMode("stacked");
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return mode;
}

function DashboardContentInner() {
  const { data, setDataset } = useDashboardData();
  const [layout] = useState<LayoutType>("executive");
  const [darkGlow, setDarkGlow] = useState<GlowConfig>(defaultDarkGlow);
  const [darkCards, setDarkCards] = useState<CardConfig>(defaultDarkCards);
  const [layoutCfg, setLayoutCfg] = useState<LayoutConfig>(defaultLayout);
  const [replayCount] = useState(0);
  const [expandedCardIdx, setExpandedCardIdx] = useState<number | null>(null);
  const [autopilotOpen, setAutopilotOpen] = useState(false);
  const [autopilotDismissed, setAutopilotDismissed] = useState(false);
  const [autopilotSource, setAutopilotSource] = useState("");
  const [autopilotInitialMessage, setAutopilotInitialMessage] = useState<
    string | undefined
  >(undefined);
  const [autopilotActiveIdx, setAutopilotActiveIdx] = useState<number | null>(
    null,
  );
  const [autopilotUnreadIdx, setAutopilotUnreadIdx] = useState<number | null>(
    null,
  );

  // AI screen state
  const [aiScreens, setAiScreens] = useState<AIScreen[]>([]);
  const [activeScreenIdx, setActiveScreenIdx] = useState(0);
  const [pendingScreen, setPendingScreen] = useState<AIScreen | null>(null);
  const [buildingLabel, setBuildingLabel] = useState<string | null>(null);
  const [buildingCards, setBuildingCards] = useState<SkeletonCard[]>([]);
  const prevScreenIdxRef = useRef(0);
  const savedBaseCardsRef = useRef(data.insightCards);

  // Edit mode state
  type EditItem = { id: string; title: string; size: "sm" | "md" | "lg" };
  const [isEditMode, setIsEditMode] = useState(false);
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const editScreenRef = useRef<AIScreen | null>(null);

  const closedAutopilotIdxRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewMode = useViewMode(containerRef);

  const activeLayout =
    activeScreenIdx === 0
      ? layoutCfg
      : (aiScreens[activeScreenIdx - 1]?.layout ?? layoutCfg);
  const activeScreen =
    activeScreenIdx > 0 ? aiScreens[activeScreenIdx - 1] : null;
  const activeHeadline = activeScreen?.headline ?? data.headline;
  const activeSubhead = activeScreen?.subhead ?? data.subhead;
  const activeHeroPoints = activeScreen?.heroPoints ?? data.heroPoints ?? [];
  const slideDir = activeScreenIdx > prevScreenIdxRef.current ? 1 : -1;
  const screenLabels = ["Overview", ...aiScreens.map((s) => s.label)];

  const handleScreenChange = (idx: number) => {
    if (isEditMode) setIsEditMode(false);
    prevScreenIdxRef.current = activeScreenIdx;
    setActiveScreenIdx(idx);
    setExpandedCardIdx(null);
    if (idx === 0) {
      setDataset({ ...data, insightCards: savedBaseCardsRef.current });
    } else {
      const screen = aiScreens[idx - 1];
      if (screen) setDataset({ ...data, insightCards: screen.cards });
    }
  };

  const MAX_CARDS = 5;

  const handlePromptSubmit = (query: string) => {
    const screen = detectLayoutIntent(query);
    if (!screen) return;
    const existingIdx = aiScreens.findIndex((s) => s.label === screen.label);
    if (existingIdx !== -1) {
      handleScreenChange(existingIdx + 1);
      return;
    }
    const limited: AIScreen = {
      ...screen,
      cards: screen.cards.slice(0, MAX_CARDS),
      layout: {
        ...screen.layout,
        insightCards: screen.layout.insightCards.slice(0, MAX_CARDS),
      },
    };
    setPendingScreen(limited);
  };

  const handleConfirmBuild = (selectedIndices: number[]) => {
    if (!pendingScreen) return;
    const base = pendingScreen;
    const filtered =
      selectedIndices.length > 0 && selectedIndices.length < base.cards.length
        ? {
            ...base,
            cards: base.cards.filter((_, i) => selectedIndices.includes(i)),
            layout: {
              ...base.layout,
              insightCards: base.layout.insightCards.filter((_, i) =>
                selectedIndices.includes(i),
              ),
            },
          }
        : base;
    setPendingScreen(null);
    if (savedBaseCardsRef.current === data.insightCards) {
      savedBaseCardsRef.current = [...data.insightCards];
    }
    setBuildingLabel(filtered.label);
    setBuildingCards(
      filtered.cards.map((c) => ({ title: c.title, size: c.size })),
    );
    const capturedAiScreens = aiScreens;
    const capturedActiveIdx = activeScreenIdx;
    const capturedData = data;
    setTimeout(() => {
      const newScreens = [...capturedAiScreens, filtered];
      const newIdx = newScreens.length;
      prevScreenIdxRef.current = capturedActiveIdx;
      setAiScreens(newScreens);
      setActiveScreenIdx(newIdx);
      setExpandedCardIdx(null);
      setDataset({ ...capturedData, insightCards: filtered.cards });
      setBuildingLabel(null);
    }, 1800);
  };

  const handleCancelBuild = () => setPendingScreen(null);

  const handleEnterEditMode = () => {
    const screen = aiScreens[activeScreenIdx - 1];
    if (!screen) return;
    const items: EditItem[] = screen.layout.insightCards.map((cfg, i) => ({
      id: screen.cards[i]?.title ?? String(i),
      title: screen.cards[i]?.title ?? cfg.content.title,
      size: cfg.size as "sm" | "md" | "lg",
    }));
    editScreenRef.current = screen;
    setEditItems(items);
    setExpandedCardIdx(null);
    setIsEditMode(true);
  };

  const handleSaveEdit = () => {
    if (!editScreenRef.current) {
      setIsEditMode(false);
      return;
    }
    const base = editScreenRef.current;
    const cardByTitle = new Map(base.cards.map((c) => [c.title, c]));
    const layoutByTitle = new Map(
      base.layout.insightCards.map((c) => [c.content.title, c]),
    );
    const newCards = editItems.map((item) => ({
      ...cardByTitle.get(item.id)!,
      size: item.size,
    }));
    const newLayoutCards = editItems.map((item) => ({
      ...layoutByTitle.get(item.id)!,
      size: item.size,
    }));
    const updatedScreen: AIScreen = {
      ...base,
      cards: newCards,
      layout: { ...base.layout, insightCards: newLayoutCards },
    };
    const newScreens = aiScreens.map((s, i) =>
      i === activeScreenIdx - 1 ? updatedScreen : s,
    );
    setAiScreens(newScreens);
    setDataset({ ...data, insightCards: newCards });
    setIsEditMode(false);
  };

  const handleCancelEdit = () => setIsEditMode(false);

  const handleReorderEditItems = (items: EditItem[]) => setEditItems(items);

  const handleRemoveEditItem = (id: string) => {
    setEditItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((item) => item.id !== id),
    );
  };

  const handleResizeEditItem = (id: string, size: "sm" | "md" | "lg") => {
    setEditItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, size } : item)),
    );
  };

  const handlePinChart = (card: InsightCardData, aiScreenIdx: number) => {
    const screen = aiScreens[aiScreenIdx];
    if (!screen) return;
    const updatedScreen: AIScreen = {
      ...screen,
      cards: [...screen.cards, card],
      layout: {
        ...screen.layout,
        insightCards: [
          ...screen.layout.insightCards,
          {
            size: (card.size ?? "md") as "sm" | "md" | "lg",
            visible: true,
            interaction: (card.interaction ?? "expand") as
              | "static"
              | "expand"
              | "navigate",
            content: {
              type: card.type,
              chartType: card.chartType,
              title: card.title,
            },
          },
        ],
      },
    };
    const newScreens = aiScreens.map((s, i) =>
      i === aiScreenIdx ? updatedScreen : s,
    );
    setAiScreens(newScreens);
    if (activeScreenIdx === aiScreenIdx + 1) {
      setDataset({ ...data, insightCards: updatedScreen.cards });
    }
    toast.success(`Pinned to ${screen.label}`);
  };

  const handleRemoveScreen = (navIdx: number) => {
    if (isEditMode) setIsEditMode(false);
    const screenIdx = navIdx - 1;
    const newScreens = aiScreens.filter((_, i) => i !== screenIdx);
    setAiScreens(newScreens);
    if (activeScreenIdx === navIdx) {
      prevScreenIdxRef.current = navIdx;
      setActiveScreenIdx(0);
      setDataset({ ...data, insightCards: savedBaseCardsRef.current });
    } else if (activeScreenIdx > navIdx) {
      setActiveScreenIdx(activeScreenIdx - 1);
      prevScreenIdxRef.current = Math.max(0, prevScreenIdxRef.current - 1);
    }
  };

  const handleAutopilotOpen = (
    sourceTitle: string,
    idx: number,
    prompt?: string,
  ) => {
    if (
      autopilotOpen &&
      !autopilotDismissed &&
      autopilotActiveIdx === idx &&
      !prompt
    ) {
      setAutopilotDismissed(true);
      setAutopilotOpen(false);
      setAutopilotActiveIdx(null);
    } else {
      closedAutopilotIdxRef.current = null;
      setAutopilotSource(sourceTitle);
      setAutopilotActiveIdx(idx);
      setAutopilotOpen(true);
      setAutopilotDismissed(false);
      setAutopilotInitialMessage(prompt);
      setAutopilotUnreadIdx(null);
    }
  };

  const handleAutopilotClose = () => {
    closedAutopilotIdxRef.current = autopilotActiveIdx;
    setAutopilotDismissed(true);
    setAutopilotOpen(false);
    setAutopilotActiveIdx(null);
  };

  const handleAutopilotResponseReady = () => {
    if (autopilotOpen && !autopilotDismissed) return;
    const idx = closedAutopilotIdxRef.current;
    setAutopilotUnreadIdx(idx);
    toast.info("Autopilot response ready", {
      description: autopilotSource
        ? `${autopilotSource} analysis complete`
        : undefined,
      action: {
        label: "View",
        onClick: () => {
          if (idx === null) return;
          setExpandedCardIdx(idx);
          setAutopilotDismissed(false);
          setAutopilotOpen(true);
          setAutopilotActiveIdx(idx);
          setAutopilotUnreadIdx(null);
        },
      },
    });
  };

  return (
    <DashboardLoading triggerReplay={replayCount}>
      <div
        className={`relative h-full ${viewMode === "stacked" ? "overflow-x-hidden" : "overflow-hidden"}`}
        style={
          layoutCfg.containerBg !== "none"
            ? { backgroundColor: `var(--${layoutCfg.containerBg})` }
            : {}
        }
      >
        <DashboardGlow darkConfig={darkGlow} />
        <GlowDevControls
          glowConfig={darkGlow}
          onGlowChange={setDarkGlow}
          cardConfig={darkCards}
          onCardChange={setDarkCards}
          layoutConfig={layoutCfg}
          onLayoutChange={setLayoutCfg}
        />
        <div
          ref={containerRef}
          className="@container flex flex-col gap-4 relative z-10 h-full"
          style={{ padding: layoutCfg.padding }}
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <h1 className="text-xs tracking-tight">
                <span className="font-bold">{data.brandName}</span>{" "}
                {data.brandLine}
              </h1>
              <p className="text-2xl font-bold tracking-tight flex items-center gap-2">
                {data.dashboardTitle}
                <Badge variant="secondary" status="info">
                  {data.badgeText}
                </Badge>
              </p>
            </div>

            {/* View navigator — centered between title and controls */}
            <div className="flex-1 flex items-center justify-center min-w-0">
              <div className="flex items-center gap-1.5">
                <AnimatePresence>
                  {aiScreens.length > 0 && (
                    <ScreenNavigator
                      screens={screenLabels}
                      activeIdx={activeScreenIdx}
                      onChange={handleScreenChange}
                      onRemove={handleRemoveScreen}
                    />
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {aiScreens.length > 0 && !isEditMode && (
                    <motion.button
                      key="edit-btn"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                      onClick={
                        activeScreenIdx > 0 ? handleEnterEditMode : undefined
                      }
                      disabled={activeScreenIdx === 0}
                      className={`size-7 rounded-md flex items-center justify-center transition-colors ${
                        activeScreenIdx === 0
                          ? "text-muted-foreground/25 cursor-not-allowed"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                      type="button"
                      title={
                        activeScreenIdx === 0
                          ? "Overview cannot be edited"
                          : "Edit view"
                      }
                    >
                      <SlidersHorizontal className="size-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <AnimatePresence mode="wait" initial={false}>
                {isEditMode ? (
                  <motion.div
                    key="edit-controls"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="h-9 px-4 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                    >
                      Set view
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="normal-controls"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center gap-2"
                  >
                    <Select defaultValue="30">
                      <SelectTrigger className="h-9 w-auto text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="14">Last 14 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                        <SelectItem value="365">Last 12 months</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                    >
                      Primary action
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Layout content */}
          <div className="flex-1 min-h-0 relative">
            <div
              className="h-full transition-transform duration-500 ease-in-out"
              style={{
                transform:
                  autopilotOpen && !autopilotDismissed
                    ? "translateX(-50%)"
                    : "translateX(0)",
              }}
            >
              {layout === "executive" && (
                <ExecutiveLayout
                  cards={darkCards}
                  layout={layoutCfg}
                  activeLayout={activeLayout}
                  viewMode={viewMode}
                  buildingLabel={buildingLabel}
                  buildingCards={buildingCards}
                  activeScreenIdx={activeScreenIdx}
                  slideDir={slideDir}
                  onAutopilotOpen={handleAutopilotOpen}
                  autopilotActiveIdx={autopilotActiveIdx}
                  autopilotUnreadIdx={autopilotUnreadIdx}
                  expandedCardIdx={expandedCardIdx}
                  onExpandedChange={setExpandedCardIdx}
                  onPromptSubmit={handlePromptSubmit}
                  pendingScreen={pendingScreen}
                  onConfirmBuild={handleConfirmBuild}
                  onCancelBuild={handleCancelBuild}
                  activeHeadline={activeHeadline}
                  activeSubhead={activeSubhead}
                  isEditMode={isEditMode}
                  editItems={editItems}
                  onReorderEditItems={handleReorderEditItems}
                  onRemoveEditItem={handleRemoveEditItem}
                  onResizeEditItem={handleResizeEditItem}
                  aiScreenLabels={aiScreens.map((s) => s.label)}
                  onPinChart={handlePinChart}
                  heroPoints={activeHeroPoints}
                />
              )}
              {layout === "operational" && <OperationalLayout />}
              {layout === "analytics" && <AnalyticsLayout />}
            </div>
            {/* Autopilot panel — slides in from right */}
            <div
              className="absolute top-0 bottom-0 right-0 transition-all duration-500 ease-in-out z-20"
              style={{
                width: "50%",
                transform:
                  autopilotOpen && !autopilotDismissed
                    ? "translateX(0)"
                    : "translateX(105%)",
              }}
            >
              <div className="h-full pl-1">
                {autopilotSource && (
                  <AutopilotInsight
                    onClose={handleAutopilotClose}
                    onResponseReady={handleAutopilotResponseReady}
                    sourceCardTitle={autopilotSource}
                    initialMessage={autopilotInitialMessage}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLoading>
  );
}

export function DashboardContent() {
  return (
    <DashboardDataProvider>
      <DashboardContentInner />
      <Toaster position="bottom-right" />
    </DashboardDataProvider>
  );
}
