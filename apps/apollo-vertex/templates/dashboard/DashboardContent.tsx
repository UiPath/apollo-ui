"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiStarIcon, type ChartSpec } from "@/components/ai-chat/shared";
import { ChatPanel } from "@/components/ai-chat/ChatPanel";
import { HeroAiInput } from "@/components/ai-chat/HeroAiInput";
import { DashboardGlow } from "./DashboardGlow";
import {
  cardBgStyle,
  defaultDarkCards,
  defaultDarkGlow,
  defaultLayout,
  getInsightCardClasses,
  type CardConfig,
  type GlowConfig,
  type InsightCardConfig,
  type LayoutConfig,
} from "./glow-config";
import { GlowDevControls } from "./GlowDevControls";
import { InsightCardBody } from "./insight-card-renderers";
import { InsightGrid } from "./InsightGrid";
import { DashboardLoading } from "./DashboardLoading";
import { PinModal } from "./PinModal";

type LayoutType = "executive" | "operational" | "analytics";
type DashboardMode = "default" | "hero-chat" | "card-chat";

// ── Overview card (shared between default and hero-chat modes) ─────────────────

function OverviewCard({
  cards,
  shared,
}: {
  cards: CardConfig;
  shared: string;
}) {
  return (
    <Card
      variant="glass"
      className={`!bg-white/90 flex-1 !gap-4 !p-8 !pt-10 overflow-hidden ${shared}`}
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
          Good morning, Peter
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col !p-0">
        <div>
          <p className="text-4xl font-bold tracking-tight pr-16">
            Loan volume scales as setup time drops by 3.5 days.
          </p>
          <p className="text-sm font-normal text-muted-foreground pr-32 mt-8 leading-relaxed">
            Setup time declined ↓21% month over month while volume increased
            ↑18%.
          </p>
        </div>
        <div className="flex-1 min-h-0 mt-4 mb-6 relative pl-8 pr-1">
          <svg
            viewBox="0 0 200 70"
            preserveAspectRatio="none"
            className="w-full h-full rounded-xl"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="overview-spark-fill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  style={{ stopColor: "var(--insight-500)", stopOpacity: 0.15 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: "var(--primary-400)", stopOpacity: 0 }}
                />
              </linearGradient>
              <filter id="overview-fill-blur">
                <feGaussianBlur stdDeviation="9" />
              </filter>
            </defs>
            <line
              x1="0"
              y1="15"
              x2="200"
              y2="15"
              className="stroke-foreground/5"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="0"
              y1="30"
              x2="200"
              y2="30"
              className="stroke-foreground/5"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="0"
              y1="45"
              x2="200"
              y2="45"
              className="stroke-foreground/5"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="0"
              y1="25"
              x2="200"
              y2="25"
              className="stroke-foreground/20"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              strokeDasharray="4 4"
            />
            <path
              d="M0,42 C11,40 22,36 33,34 C44,32 55,38 67,35 C78,32 89,22 100,20 C111,18 122,26 133,24 C144,22 155,14 167,12 C178,10 189,15 200,8 L200,60 L0,60 Z"
              fill="url(#overview-spark-fill)"
              filter="url(#overview-fill-blur)"
            />
            <path
              d="M0,42 C11,40 22,36 33,34 C44,32 55,38 67,35 C78,32 89,22 100,20 C111,18 122,26 133,24 C144,22 155,14 167,12 C178,10 189,15 200,8"
              className="stroke-foreground"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <span
            className="absolute left-0 text-[10px] text-muted-foreground/50 -translate-y-1/2"
            style={{ top: "calc(15 / 70 * 100%)" }}
          >
            200
          </span>
          <span
            className="absolute left-0 text-[10px] text-muted-foreground/50 -translate-y-1/2"
            style={{ top: "calc(25 / 70 * 100%)" }}
          >
            150
          </span>
          <span
            className="absolute left-0 text-[10px] text-muted-foreground/50 -translate-y-1/2"
            style={{ top: "calc(30 / 70 * 100%)" }}
          >
            100
          </span>
          <span
            className="absolute left-0 text-[10px] text-muted-foreground/50 -translate-y-1/2"
            style={{ top: "calc(45 / 70 * 100%)" }}
          >
            50
          </span>
          <span
            className="absolute right-0 text-[10px] text-muted-foreground/50 -translate-y-full -mt-0.5"
            style={{ top: "calc(25 / 70 * 100%)" }}
          >
            Target
          </span>
          <div
            className="absolute size-2 rounded-full bg-foreground"
            style={{
              top: "calc(8 / 70 * 100%)",
              right: "4px",
              transform: "translate(50%, -50%)",
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}


// ── InsightCardChatLayout — CSS-driven slide-over (Mode 3b) ───────────────────

interface InsightCardChatLayoutProps {
  cards: CardConfig;
  layout: LayoutConfig;
  shared: string;
  activeCardCfg: InsightCardConfig;
  chatQuery: string | null;
  onCloseChat: () => void;
  onPinChart: (spec: ChartSpec) => void;
}

function InsightCardChatLayout({
  cards,
  layout,
  shared,
  activeCardCfg,
  chatQuery,
  onCloseChat,
  onPinChart,
}: InsightCardChatLayoutProps) {
  const gap = layout.gap;
  const activeClasses = getInsightCardClasses(activeCardCfg.content);

  function handleClose() {
    onCloseChat();
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", gap: `${gap}px` }}>
      {/* Active card */}
      <div style={{ flex: "1 1 0", overflow: "hidden" }}>
        <Card
          variant="glass"
          className={`h-full !bg-white dark:!bg-card ${shared} ${activeClasses.cardClassName} overflow-hidden`}
          style={cardBgStyle(cards.insightBg, cards.insightOpacity, cards.insightGradient)}
        >
          <CardHeader>
            <CardTitle className="text-sm font-bold tracking-tight">
              {activeCardCfg.content.title}
            </CardTitle>
          </CardHeader>
          <CardContent className={activeClasses.contentClassName}>
            <InsightCardBody content={activeCardCfg.content} />
          </CardContent>
        </Card>
      </div>

      {/* Chat panel */}
      <div style={{ flex: "1 1 0", overflow: "hidden" }}>
        <ChatPanel
          query={chatQuery ?? undefined}
          onClose={handleClose}
          direction="right"
          onPinChart={onPinChart}
        />
      </div>
    </div>
  );
}

// ── ExecutiveLayout ────────────────────────────────────────────────────────────

interface ExecutiveLayoutProps {
  cards: CardConfig;
  layout: LayoutConfig;
  dashboardMode: DashboardMode;
  chatQuery: string | null;
  activeChatCardIdx: number | null;
  onHeroChat: (q: string) => void;
  onOverviewChat: (q: string) => void;
  onCardChat: (q: string, cardIdx: number) => void;
  onCloseChat: () => void;
  onPinChart: (spec: ChartSpec) => void;
  pinnedCharts: Record<number, ChartSpec>;
}

function ExecutiveLayout({
  cards,
  layout,
  dashboardMode,
  chatQuery,
  activeChatCardIdx,
  onHeroChat,
  onOverviewChat,
  onCardChat,
  onCloseChat,
  onPinChart,
  pinnedCharts,
}: ExecutiveLayoutProps) {
  const [aiCardOpen, setAiCardOpen] = useState(false);

  const borderClass = cards.borderVisible ? "" : "dark:!border-transparent";
  const blurClass = cards.backdropBlur ? "" : "dark:!backdrop-blur-none";
  const shared = `!shadow-none dark:![background:var(--card-bg-override)] ${borderClass} ${blurClass}`;
  const gapStyle = { gap: `${layout.gap}px` };

  const spring = { type: "spring", stiffness: 220, damping: 30, mass: 0.8 } as const;
  const isOverviewChat = dashboardMode === "card-chat" && activeChatCardIdx === -1;

  // ── Mode 3b: insight card-chat — CSS-driven slide-over ────────────────────
  if (dashboardMode === "card-chat" && activeChatCardIdx !== null && activeChatCardIdx >= 0) {
    const activeCardCfg = layout.insightCards[activeChatCardIdx];
    return (
      <InsightCardChatLayout
        cards={cards}
        layout={layout}
        shared={shared}
        activeCardCfg={activeCardCfg}
        chatQuery={chatQuery}
        onCloseChat={onCloseChat}
        onPinChart={onPinChart}
      />
    );
  }

  // ── Mode 1/2/3a: default + hero-chat + overview-chat share the same base grid ─
  return (
    <div className="flex h-full overflow-hidden" style={gapStyle}>
      <motion.div
        layout
        transition={spring}
        className="min-w-0 h-full grid grid-cols-2"
        style={{ flex: dashboardMode === "hero-chat" ? "2 1 0" : "1 1 0", ...gapStyle }}
      >
        {/* Left col — overview card stays; only chat input dims on overview-chat */}
        <div className="flex flex-col" style={gapStyle}>
          <OverviewCard cards={cards} shared={shared} />
          <motion.div
            animate={{ opacity: isOverviewChat ? 0.25 : 1 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ pointerEvents: isOverviewChat ? "none" : "auto" }}
          >
            <HeroAiInput
              onSubmit={onOverviewChat}
              chatActive={dashboardMode === "hero-chat" || aiCardOpen}
            />
          </motion.div>
        </div>

        {/* Right col — swaps InsightGrid ↔ ChatPanel; chat slides from behind left card */}
        <div className="relative h-full overflow-hidden">
          <AnimatePresence initial={false}>
            {isOverviewChat ? (
              <motion.div
                key="overview-chat-panel"
                className="absolute inset-0"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.75 }}
              >
                <ChatPanel
                  query={chatQuery ?? undefined}
                  onClose={onCloseChat}
                  direction="right"
                  onPinChart={onPinChart}
                  onSubmit={onOverviewChat}
                />
              </motion.div>
            ) : (
              <motion.div
                key="insight-grid"
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              >
                <InsightGrid
                  layout={layout}
                  shared={shared}
                  cards={cards}
                  promptChips={[null, null, "Walk me through the current pipeline status.", null]}
                  onCardChat={onCardChat}
                  askAutopilotIdx={1}
                  expandedPrompts={{
                    1: [
                      "What issues are most impacting loan performance?",
                      "Which issue type is growing fastest?",
                      "What would reduce top issues by 20%?",
                    ],
                  }}
                  pinnedCharts={pinnedCharts}
                  onAskAutopilotExpand={setAiCardOpen}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Hero-chat panel — slides in from right */}
      <AnimatePresence>
        {dashboardMode === "hero-chat" && (
          <motion.div
            key="hero-panel"
            className="relative min-w-0 h-full"
            style={{ flex: "1 1 0" }}
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 48 }}
            transition={spring}
          >
            <ChatPanel
              query={chatQuery ?? undefined}
              onClose={onCloseChat}
              direction="right"
              onPinChart={onPinChart}
              onSubmit={onHeroChat}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Placeholder layouts ────────────────────────────────────────────────────────

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

// ── Main component ─────────────────────────────────────────────────────────────

const layoutLabels: Record<LayoutType, string> = {
  executive: "Product",
  operational: "Operational",
  analytics: "Analytics",
};

export function DashboardContent() {
  const [layout, setLayout] = useState<LayoutType>("executive");
  const [darkGlow, setDarkGlow] = useState<GlowConfig>(defaultDarkGlow);
  const [darkCards, setDarkCards] = useState<CardConfig>(defaultDarkCards);
  const [layoutCfg, setLayoutCfg] = useState<LayoutConfig>(defaultLayout);
  const [replayCount, setReplayCount] = useState(0);

  // Chat state
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>("default");
  const [chatQuery, setChatQuery] = useState<string | null>(null);
  const [activeChatCardIdx, setActiveChatCardIdx] = useState<number | null>(
    null,
  );

  // Pin state
  const [pendingPinChart, setPendingPinChart] = useState<ChartSpec | null>(
    null,
  );
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinnedCharts, setPinnedCharts] = useState<Record<number, ChartSpec>>(
    {},
  );

  function handleHeroChat(q: string) {
    setChatQuery(q);
    setActiveChatCardIdx(null);
    setDashboardMode("hero-chat");
  }

  // Opens overview card-chat (chat covers InsightGrid, overview stays)
  function handleOverviewChat(q: string) {
    setChatQuery(q);
    setActiveChatCardIdx(-1);
    setDashboardMode("card-chat");
  }

  function handleCardChat(q: string, cardIdx: number) {
    setChatQuery(q);
    setActiveChatCardIdx(cardIdx);
    setDashboardMode("card-chat");
  }

  // Close chat without clearing pinned charts
  function closeChat() {
    setDashboardMode("default");
    setChatQuery(null);
    setActiveChatCardIdx(null);
  }

  function resetDashboard() {
    closeChat();
    setPinnedCharts({});
  }

  function handlePinChart(spec: ChartSpec) {
    setPendingPinChart(spec);
    setPinModalOpen(true);
  }

  function handlePin(slotIdx: number | "new") {
    if (slotIdx !== "new" && pendingPinChart) {
      setPinnedCharts((prev) => ({ ...prev, [slotIdx]: pendingPinChart }));
    }
    setPinModalOpen(false);
    setPendingPinChart(null);
  }

  return (
    <DashboardLoading triggerReplay={replayCount}>
      <div
        className="relative h-full overflow-hidden"
        style={
          layoutCfg.containerBg === "none"
            ? {}
            : { backgroundColor: `var(--${layoutCfg.containerBg})` }
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

        {/* Pin modal — floats above everything */}
        <PinModal
          open={pinModalOpen}
          chart={pendingPinChart}
          layout={layoutCfg}
          onPin={handlePin}
          onClose={() => setPinModalOpen(false)}
        />

        <div
          className="flex flex-col gap-4 relative z-10 h-full"
          style={{ padding: layoutCfg.padding }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xs tracking-tight">
                <span className="font-bold">UiPath</span> Vertical Solutions
              </h1>
              <p className="text-2xl font-bold tracking-tight flex items-center gap-2">
                {layoutLabels[layout]} Dashboard
                <Badge variant="secondary" status="info">
                  Experimental
                </Badge>
              </p>
            </div>
            <Tabs
              value={layout}
              onValueChange={(v) => setLayout(v as LayoutType)}
              className="hidden"
            >
              <TabsList>
                {(Object.keys(layoutLabels) as LayoutType[]).map((key) => (
                  <TabsTrigger key={key} value={key}>
                    {layoutLabels[key]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              {Object.keys(pinnedCharts).length > 0 && (
                <button
                  type="button"
                  onClick={resetDashboard}
                  className="h-9 px-3 rounded-lg border border-border bg-muted text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                >
                  Reset dashboard
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setChatQuery(null);
                  setActiveChatCardIdx(null);
                  setDashboardMode(
                    dashboardMode === "hero-chat" ? "default" : "hero-chat",
                  );
                }}
                className={[
                  "h-9 w-9 flex items-center justify-center rounded-lg border transition-colors",
                  dashboardMode === "hero-chat"
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                ].join(" ")}
                title={
                  dashboardMode === "hero-chat"
                    ? "Close AI chat"
                    : "Open AI chat"
                }
              >
                <AiStarIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setReplayCount((c) => c + 1)}
                className="h-9 px-3 rounded-lg border bg-muted text-xs font-medium hover:bg-muted/80 transition-colors"
              >
                Replay Intro
              </button>
            </div>
          </div>

          {/* Layout content */}
          <div className="flex-1 min-h-0">
            <AnimatePresence mode="wait">
              {layout === "executive" && (
                <motion.div
                  key="executive"
                  className="h-full"
                  initial={false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ExecutiveLayout
                    cards={darkCards}
                    layout={layoutCfg}
                    dashboardMode={dashboardMode}
                    chatQuery={chatQuery}
                    activeChatCardIdx={activeChatCardIdx}
                    onHeroChat={handleHeroChat}
                    onOverviewChat={handleOverviewChat}
                    onCardChat={handleCardChat}
                    onCloseChat={closeChat}
                    onPinChart={handlePinChart}
                    pinnedCharts={pinnedCharts}
                  />
                </motion.div>
              )}
              {layout === "operational" && (
                <motion.div
                  key="operational"
                  className="h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <OperationalLayout />
                </motion.div>
              )}
              {layout === "analytics" && (
                <motion.div
                  key="analytics"
                  className="h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <AnalyticsLayout />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLoading>
  );
}
