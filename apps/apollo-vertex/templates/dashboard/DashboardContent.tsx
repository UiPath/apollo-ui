"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardGlow } from "./DashboardGlow";
import {
  cardBgStyle,
  defaultDarkCards,
  defaultDarkGlow,
  defaultLayout,
  type CardConfig,
  type GlowConfig,
  type LayoutConfig,
} from "./glow-config";
import { GlowDevControls } from "./GlowDevControls";
import { InsightGrid } from "./InsightGrid";
import { DashboardLoading } from "./DashboardLoading";
import { PromptBar } from "./PromptBar";

type LayoutType = "executive" | "operational" | "analytics";

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
          className={`!bg-white flex-1 !gap-4 !p-8 !pt-10 overflow-hidden ${shared}`}
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
                      style={{
                        stopColor: "var(--insight-500)",
                        stopOpacity: 0.15,
                      }}
                    />
                    <stop
                      offset="100%"
                      style={{
                        stopColor: "var(--primary-400)",
                        stopOpacity: 0,
                      }}
                    />
                  </linearGradient>
                  <filter id="overview-fill-blur">
                    <feGaussianBlur stdDeviation="9" />
                  </filter>
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
                {/* Fill area with soft edges */}
                <path
                  d="M0,42 C11,40 22,36 33,34 C44,32 55,38 67,35 C78,32 89,22 100,20 C111,18 122,26 133,24 C144,22 155,14 167,12 C178,10 189,15 200,8 L200,60 L0,60 Z"
                  fill="url(#overview-spark-fill)"
                  filter="url(#overview-fill-blur)"
                />
                {/* Line */}
                <path
                  d="M0,42 C11,40 22,36 33,34 C44,32 55,38 67,35 C78,32 89,22 100,20 C111,18 122,26 133,24 C144,22 155,14 167,12 C178,10 189,15 200,8"
                  className="stroke-foreground"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              {/* Y-axis labels */}
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
              {/* Target label */}
              <span
                className="absolute right-0 text-[10px] text-muted-foreground/50 -translate-y-full -mt-0.5"
                style={{ top: "calc(25 / 70 * 100%)" }}
              >
                Target
              </span>
              {/* Dot at end of line */}
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
        <PromptBar shared={shared} cards={cards} />
      </div>
      {/* Right half — insight grid */}
      <div className="overflow-hidden relative">
        <InsightGrid layout={layout} shared={shared} cards={cards} />
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
