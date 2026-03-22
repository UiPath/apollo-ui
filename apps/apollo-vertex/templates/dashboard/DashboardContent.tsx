"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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

// --- Prompt bar ---

function PromptBar({ shared, cards }: { shared: string; cards: CardConfig }) {
  const [value, setValue] = useState("");
  const hasInput = value.trim().length > 0;

  return (
    <div className="group rounded-2xl p-[2px] focus-within:bg-gradient-to-r focus-within:from-insight-500/75 focus-within:to-primary-400/75 transition-all">
      {/* Suggestion pills */}
      <div className="grid grid-rows-[0fr] focus-within:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] transition-[grid-template-rows] duration-300">
        <div className="overflow-hidden">
          <div className="px-3 pt-2 pb-2 flex gap-2">
            <Badge
              variant="secondary"
              status="info"
              className="!bg-white/35 !text-foreground opacity-0 translate-y-2 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-300 cursor-pointer"
            >
              Show me top risk factors
            </Badge>
            <Badge
              variant="secondary"
              status="info"
              className="!bg-white/35 !text-foreground opacity-0 translate-y-2 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-300 delay-75 cursor-pointer"
            >
              Compare Q1 vs Q2 performance
            </Badge>
          </div>
        </div>
      </div>
      {/* Input */}
      <div
        className={`flex items-center rounded-[14px] px-4 py-3 !bg-white/80 backdrop-blur-sm transition-colors ${shared}`}
        style={cardBgStyle(
          cards.promptBg,
          cards.promptOpacity,
          cards.promptGradient,
        )}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What would you like to understand about loan performance?"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center gap-2 ml-3">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Voice input"
          >
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
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>
          <button
            type="button"
            disabled={!hasInput}
            className="size-8 rounded-full bg-gradient-to-br from-insight-500 to-primary-400 flex items-center justify-center text-white transition-opacity disabled:opacity-30"
            aria-label="Submit"
          >
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
              <path d="m5 12 7-7 7 7" />
              <path d="M12 19V5" />
            </svg>
          </button>
        </div>
      </div>
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
          className={`!bg-white flex-1 ${shared}`}
          style={cardBgStyle(
            cards.overviewBg,
            cards.overviewOpacity,
            cards.overviewGradient,
          )}
        >
          <CardHeader>
            <CardTitle className="text-sm font-bold tracking-tight">
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Total revenue this quarter: $2.4M (+14%)</p>
            <p>Active users: 12,847 across 3 regions</p>
            <p>Top performing segment: Enterprise ($1.8M)</p>
            <p>Pipeline value: $4.2M (68 deals)</p>
            <p>Avg. deal cycle: 32 days (-4 days)</p>
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

  return (
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
          >
            <TabsList>
              {(Object.keys(layoutLabels) as LayoutType[]).map((key) => (
                <TabsTrigger key={key} value={key}>
                  {layoutLabels[key]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
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
  );
}
