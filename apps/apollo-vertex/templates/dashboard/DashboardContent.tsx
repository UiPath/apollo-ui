"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardGlow } from "./DashboardGlow";
import {
  defaultDarkCards,
  defaultDarkGlow,
  defaultLayout,
  type CardConfig,
  type CardGradient,
  type GlowConfig,
  type LayoutConfig,
} from "./glow-config";
import { GlowDevControls } from "./GlowDevControls";

// --- Layout type ---

type LayoutType = "executive" | "operational" | "analytics";

// --- Helpers ---

function resolveColor(value: string): string {
  if (typeof document === "undefined") return value;
  const match = value.match(/^var\(--(.+)\)$/);
  if (!match) return value;
  const computed = getComputedStyle(document.documentElement).getPropertyValue(
    `--${match[1]}`,
  );
  return computed.trim() || value;
}

function cardBgStyle(
  bg: string,
  opacity: number,
  gradient: CardGradient,
): React.CSSProperties {
  if (gradient.enabled) {
    const start = resolveColor(gradient.start);
    const end = resolveColor(gradient.end);
    const alpha = gradient.opacity / 100;
    return {
      "--card-bg-override": `linear-gradient(${gradient.angle}deg, color-mix(in srgb, ${start} ${alpha * 100}%, transparent), color-mix(in srgb, ${end} ${alpha * 100}%, transparent))`,
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

const insightData = [
  { t: "Churn risk detected for 3 accounts", s: "Estimated impact: $120K ARR" },
  { t: "Q1 target: 85% achieved", s: "15 days remaining in quarter" },
  { t: "Support tickets down 12% WoW", s: "Avg. resolution: 4.2 hrs" },
  { t: "3 automations flagged for review", s: "Success rate: 98.1%" },
];

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
  const visibleCards = insightData
    .map((item, i) => ({ item, cfg: layout.insightCards[i] }))
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
            key={row.map(({ item }) => item.t).join()}
            className="grid flex-1"
            style={{ ...gapStyle, gridTemplateColumns: cols }}
          >
            {row.map(({ item, cfg }) => {
              const spanClass = cfg.size === "lg" && row.length === 1 ? "" : "";
              return (
                <Card
                  key={item.t}
                  variant="glass"
                  className={`!bg-white/90 ${shared} ${spanClass}`}
                  style={cardBgStyle(
                    cards.insightBg,
                    cards.insightOpacity,
                    cards.insightGradient,
                  )}
                >
                  <CardHeader>
                    <CardTitle className="text-sm font-bold tracking-tight">
                      Insight
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>{item.t}</p>
                    <p>{item.s}</p>
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
    <div className="grid grid-cols-1 lg:grid-cols-2" style={gapStyle}>
      {/* Left half */}
      <div
        className="grid"
        style={{
          ...gapStyle,
          gridTemplateRows: `${layout.overviewRatio}fr ${layout.promptRatio}fr`,
        }}
      >
        <Card
          variant="glass"
          className={`!bg-white ${shared}`}
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
        <Card
          variant="glass"
          className={`!bg-white/80 ${shared}`}
          style={cardBgStyle(
            cards.promptBg,
            cards.promptOpacity,
            cards.promptGradient,
          )}
        >
          <CardHeader>
            <CardTitle className="text-sm font-bold tracking-tight">
              Conversational Prompt Bar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="rounded-md border px-3 py-2 bg-muted/50">
              Ask a question about your data...
            </div>
          </CardContent>
        </Card>
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

const layoutDescriptions: Record<LayoutType, string> = {
  executive: "High-level overview with KPIs, summary table, and activity chart",
  operational:
    "Detailed operational view with data table, activity feed, and pipeline",
  analytics:
    "Data-focused layout with charts, compliance metrics, and detailed table",
};

export function DashboardContent() {
  const [layout, setLayout] = useState<LayoutType>("executive");
  const [darkGlow, setDarkGlow] = useState<GlowConfig>(defaultDarkGlow);
  const [darkCards, setDarkCards] = useState<CardConfig>(defaultDarkCards);
  const [layoutCfg, setLayoutCfg] = useState<LayoutConfig>(defaultLayout);

  return (
    <div
      className="relative"
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
        className="space-y-4 relative z-10"
        style={{ padding: layoutCfg.padding }}
      >
        {/* Header with layout toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-sm font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {layoutDescriptions[layout]}
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
        {layout === "executive" && (
          <ExecutiveLayout cards={darkCards} layout={layoutCfg} />
        )}
        {layout === "operational" && <OperationalLayout />}
        {layout === "analytics" && <AnalyticsLayout />}
      </div>
    </div>
  );
}
