"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AutopilotInsight } from "./AutopilotInsight";
import { DashboardDataProvider } from "./DashboardDataProvider";
import { DashboardGlow } from "./DashboardGlow";
import { useDashboardData } from "./dashboard-data-context";
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

function ExecutiveLayout({
  cards,
  layout,
  viewMode,
  onAutopilotOpen,
  autopilotActiveIdx,
}: {
  cards: CardConfig;
  layout: LayoutConfig;
  viewMode: ViewMode;
  onAutopilotOpen?: (sourceTitle: string, idx: number) => void;
  autopilotActiveIdx?: number | null;
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
        className="flex flex-col h-full"
        style={{ gap: promptExpanded ? 0 : layout.gap }}
      >
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
                alt="AI Assistant"
                className="size-5 block dark:hidden"
              />
              <img
                src="/Autopilot_light.svg"
                alt="AI Assistant"
                className="size-5 hidden dark:block"
              />
              <CardTitle className="text-sm font-bold tracking-tight">
                {data.greeting}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col !p-0 min-h-0">
              <div>
                <p className="text-4xl font-bold tracking-tight pr-16">
                  {data.headline}
                </p>
                <p className="text-sm font-normal text-muted-foreground pr-32 mt-8 leading-relaxed">
                  {data.subhead}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <PromptBar
          shared={shared}
          cards={cards}
          isExpanded={promptExpanded}
          onSubmit={() => setPromptExpanded(true)}
          onExpand={() => setPromptExpanded(true)}
          onCollapse={() => setPromptExpanded(false)}
        />
      </div>
      <div className="h-full overflow-hidden">
        <InsightGrid
          layout={layout}
          shared={shared}
          cards={cards}
          viewMode={viewMode}
          onAutopilotOpen={onAutopilotOpen}
          autopilotActiveIdx={autopilotActiveIdx}
        />
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
  const { data } = useDashboardData();
  const [layout] = useState<LayoutType>("executive");
  const [darkGlow, setDarkGlow] = useState<GlowConfig>(defaultDarkGlow);
  const [darkCards, setDarkCards] = useState<CardConfig>(defaultDarkCards);
  const [layoutCfg, setLayoutCfg] = useState<LayoutConfig>(defaultLayout);
  const [autopilotOpen, setAutopilotOpen] = useState(false);
  const [autopilotSource, setAutopilotSource] = useState("");
  const [autopilotActiveIdx, setAutopilotActiveIdx] = useState<number | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const viewMode = useViewMode(containerRef);

  const handleAutopilotOpen = (sourceTitle: string, idx: number) => {
    if (autopilotOpen && autopilotActiveIdx === idx) {
      setAutopilotOpen(false);
      setAutopilotActiveIdx(null);
    } else {
      setAutopilotSource(sourceTitle);
      setAutopilotActiveIdx(idx);
      setAutopilotOpen(true);
    }
  };

  const handleAutopilotClose = () => {
    setAutopilotOpen(false);
    setAutopilotActiveIdx(null);
  };

  return (
    <div
      className={`relative h-full ${viewMode === "stacked" ? "overflow-x-hidden" : "overflow-hidden"}`}
      style={
        layoutCfg.containerBg === "none"
          ? {}
          : { backgroundColor: `var(--${layoutCfg.containerBg})` }
      }
    >
      <DashboardGlow darkConfig={darkGlow} />
      <div
        ref={containerRef}
        className="@container flex flex-col gap-4 relative z-10 h-full"
        style={{ padding: layoutCfg.padding }}
      >
        {/* Header — stays in place */}
        <div className="flex flex-col @[500px]:flex-row @[500px]:items-center @[500px]:justify-between gap-4">
          <div>
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
          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {/* Layout content */}
        <div className="flex-1 min-h-0 relative">
          {/* Dashboard cards — shifts left for autopilot */}
          <div
            className="h-full transition-transform duration-500 ease-in-out"
            style={{
              transform: autopilotOpen ? "translateX(-50%)" : "translateX(0)",
            }}
          >
            {layout === "executive" && (
              <ExecutiveLayout
                cards={darkCards}
                layout={layoutCfg}
                viewMode={viewMode}
                onAutopilotOpen={handleAutopilotOpen}
                autopilotActiveIdx={autopilotActiveIdx}
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
              transform: autopilotOpen ? "translateX(0)" : "translateX(105%)",
            }}
          >
            <div className="h-full pl-1">
              <AutopilotInsight
                onClose={handleAutopilotClose}
                sourceCardTitle={autopilotSource}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardContent() {
  return (
    <DashboardDataProvider>
      <DashboardContentInner />
    </DashboardDataProvider>
  );
}
