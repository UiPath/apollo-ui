"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardGlow } from "./DashboardGlow";
import {
  defaultDarkCards,
  defaultDarkGlow,
  defaultLayout,
  getInsightCardClasses,
  type CardConfig,
  type CardGradient,
  type GlowConfig,
  type LayoutConfig,
} from "./glow-config";
import { GlowDevControls } from "./GlowDevControls";
import { InsightCardBody } from "./insight-card-renderers";
import { DashboardLoading } from "./DashboardLoading";
import { PromptBar } from "./PromptBar";

// --- Layout type ---

type LayoutType = "executive" | "operational" | "analytics";

// --- Helpers ---

function cardBgStyle(
  bg: string,
  opacity: number,
  gradient: CardGradient,
): React.CSSProperties {
  if (gradient.enabled) {
    const alpha = gradient.opacity / 100;
    return {
      "--card-bg-override": `linear-gradient(${gradient.angle}deg, color-mix(in srgb, ${gradient.start} ${alpha * 100}%, transparent), color-mix(in srgb, ${gradient.end} ${alpha * 100}%, transparent))`,
      borderColor: "transparent",
    } as React.CSSProperties;
  }
  const value =
    bg === "white"
      ? `rgba(255,255,255,${opacity / 100})`
      : `color-mix(in srgb, var(--${bg}) ${opacity}%, transparent)`;
  return { "--card-bg-override": value } as React.CSSProperties;
}

// --- Helpers ---

const sizeToFr: Record<string, string> = { sm: "1fr", md: "2fr", lg: "1fr" };

function InsightGrid({
  layout,
  shared,
  cards,
}: {
  layout: LayoutConfig;
  shared: string;
  cards: CardConfig;
}) {
  const gapStyle = { gap: `${layout.gap}px` };
  const visibleCards = layout.insightCards
    .map((cfg, i) => ({ cfg, idx: i }))
    .filter(({ cfg }) => cfg.visible);

  // Group into rows of 2
  const rows: (typeof visibleCards)[] = [];
  for (let i = 0; i < visibleCards.length; i += 2) {
    rows.push(visibleCards.slice(i, i + 2));
  }

  return (
    <div className="flex flex-col" style={gapStyle}>
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
              return (
                <Card
                  key={idx}
                  variant="glass"
                  className={`!bg-white/90 ${shared} ${classes.cardClassName}`}
                  style={cardBgStyle(
                    cards.insightBg,
                    cards.insightOpacity,
                    cards.insightGradient,
                  )}
                >
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

// --- Layout renderers ---

function ExecutiveLayout({
  cards,
  layout,
}: {
  cards: CardConfig;
  layout: LayoutConfig;
}) {
  const borderClass = cards.borderVisible ? "" : "dark:!border-transparent";
  const blurClass = cards.backdropBlur ? "" : "dark:!backdrop-blur-none";
  const shared = `!shadow-none dark:![background:var(--card-bg-override)] ${borderClass} ${blurClass}`;
  const gapStyle = { gap: `${layout.gap}px` };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-full" style={gapStyle}>
      {/* Left half */}
      <div className="flex flex-col" style={gapStyle}>
        <Card
          variant="glass"
          className={`!bg-white flex-1 !gap-4 !pb-0 overflow-hidden ${shared}`}
          style={cardBgStyle(
            cards.overviewBg,
            cards.overviewOpacity,
            cards.overviewGradient,
          )}
        >
          <CardHeader className="!pt-8 !gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5 text-foreground"
            >
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .963L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            </svg>
            <CardTitle className="text-sm font-bold tracking-tight">
              Good morning, Peter
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col !pb-0">
            <div>
              <p className="text-4xl font-bold tracking-tight pr-16">
                Loan volume scales as setup time drops by 3.5 days.
              </p>
              <p className="text-sm font-normal text-muted-foreground pr-32 mt-8 leading-relaxed">
                Setup time declined ↓21% month over month while volume increased
                ↑18%.
              </p>
            </div>
            <div className="flex-1 relative min-h-0">
              <svg
                viewBox="0 0 200 60"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      className="[stop-color:var(--insight-500)]"
                      stopOpacity="0.7"
                    />
                    <stop
                      offset="100%"
                      className="[stop-color:var(--primary-400)]"
                      stopOpacity="0"
                    />
                  </linearGradient>
                  <linearGradient id="spark-stroke" x1="0" y1="0" x2="1" y2="0">
                    <stop
                      offset="0%"
                      className="[stop-color:var(--insight-500)]"
                    />
                    <stop
                      offset="100%"
                      className="[stop-color:var(--primary-400)]"
                    />
                  </linearGradient>
                </defs>
                {/* Horizontal guide lines */}
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
                {/* Benchmark line */}
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
                {/* Fill area */}
                <path
                  d="M0,42 C11,40 22,36 33,34 C44,32 55,38 67,35 C78,32 89,22 100,20 C111,18 122,26 133,24 C144,22 155,14 167,12 C178,10 189,15 200,10 L200,60 L0,60 Z"
                  fill="url(#spark-fill)"
                />
                <path
                  d="M0,42 C11,40 22,36 33,34 C44,32 55,38 67,35 C78,32 89,22 100,20 C111,18 122,26 133,24 C144,22 155,14 167,12 C178,10 189,15 200,10"
                  className="stroke-foreground"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
          </CardContent>
        </Card>
        <PromptBar shared={shared} cards={cards} />
      </div>
      {/* Right half — insight grid */}
      <InsightGrid layout={layout} shared={shared} cards={cards} />
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

const layoutLabels: Record<LayoutType, string> = {
  executive: "Executive",
  operational: "Operational",
  analytics: "Analytics",
};

export function DashboardContent() {
  const [layout, setLayout] = useState<LayoutType>("executive");
  const [darkGlow, setDarkGlow] = useState<GlowConfig>(defaultDarkGlow);
  const [darkCards, setDarkCards] = useState<CardConfig>(defaultDarkCards);
  const [layoutCfg, setLayoutCfg] = useState<LayoutConfig>(defaultLayout);
  const [replayCount, setReplayCount] = useState(0);

  return (
    <DashboardLoading triggerReplay={replayCount}>
      <div
        className="relative h-full"
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
        <div
          className="flex flex-col gap-4 relative z-10 h-full"
          style={{ padding: layoutCfg.padding }}
        >
          {/* Header with layout toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xs tracking-tight">
                <span className="font-bold">UiPath</span> Vertical Solutions
              </h1>
              <p className="text-2xl font-bold tracking-tight">
                {layoutLabels[layout]} Dashboard
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
            <button
              type="button"
              onClick={() => setReplayCount((c) => c + 1)}
              className="h-9 px-3 rounded-lg border bg-muted text-xs font-medium hover:bg-muted/80 transition-colors"
            >
              Replay Intro
            </button>
          </div>

          {/* Layout content */}
          <div className="flex-1 min-h-0">
            {layout === "executive" && (
              <ExecutiveLayout cards={darkCards} layout={layoutCfg} />
            )}
            {layout === "operational" && <OperationalLayout />}
            {layout === "analytics" && <AnalyticsLayout />}
          </div>
        </div>
      </div>
    </DashboardLoading>
  );
}
