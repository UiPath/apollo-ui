"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, X } from "lucide-react";
import { useState } from "react";
import type { ChartSpec } from "@/components/ai-chat/shared";
import type { InsightCardConfig, LayoutConfig } from "./glow-config";

interface PinModalProps {
  open: boolean;
  chart: ChartSpec | null;
  layout: LayoutConfig;
  onPin: (slotIdx: number | "new") => void;
  onClose: () => void;
}

// ── Skeleton atoms ────────────────────────────────────────────────────────────

function Bone({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded bg-foreground/10 ${className ?? ""}`}
      style={style}
    />
  );
}

// ── Card-type skeletons ───────────────────────────────────────────────────────

function KpiSkeleton({ active }: { active: boolean }) {
  const hi = active ? "bg-primary/50" : "bg-foreground/15";
  const lo = active ? "bg-primary/25" : "bg-foreground/8";
  return (
    <div className="flex flex-col gap-2 flex-1">
      {/* big number */}
      <div className={`h-7 w-20 rounded ${hi}`} />
      {/* badge */}
      <div className={`h-4 w-12 rounded-full ${lo}`} />
      <div className="mt-auto space-y-1">
        {/* description lines */}
        <div className={`h-2 w-full rounded ${lo}`} />
        <div className={`h-2 w-4/5 rounded ${lo}`} />
      </div>
    </div>
  );
}

function HorizontalBarsSkeleton({ active }: { active: boolean }) {
  // Matches actual Top Issues data proportions: 34, 29, 23, 14, 11
  const bars = [34, 29, 23, 14, 11];
  const max = 34;
  const hi = active ? "bg-primary/50" : "bg-foreground/15";
  return (
    <div className="flex flex-col gap-1.5 flex-1">
      {bars.map((v, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className={`h-2 rounded-full ${hi}`}
            style={{ width: `${(v / max) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function StackedBarSkeleton({ active }: { active: boolean }) {
  // Matches Pipeline data: Mon=60, Tue=75, Wed=70, Thu=80, Fri=78 (approx totals)
  const cols = [
    { h: 60, segs: [0.5, 0.33, 0.17] },
    { h: 75, segs: [0.53, 0.2, 0.27] },
    { h: 70, segs: [0.36, 0.43, 0.21] },
    { h: 80, segs: [0.56, 0.13, 0.31] },
    { h: 78, segs: [0.45, 0.32, 0.23] },
  ];
  const colors = active
    ? ["bg-primary/60", "bg-primary/35", "bg-primary/20"]
    : ["bg-foreground/20", "bg-foreground/12", "bg-foreground/7"];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-end flex-1 gap-1">
        {cols.map((col, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col-reverse rounded-t-sm overflow-hidden"
            style={{ height: `${col.h}%` }}
          >
            {col.segs.map((seg, j) => (
              <div key={j} className={colors[j]} style={{ flex: seg }} />
            ))}
          </div>
        ))}
      </div>
      {/* legend dots */}
      <div className="flex gap-2 mt-1.5">
        {colors.map((c, i) => (
          <div key={i} className={`h-1.5 w-1.5 rounded-full ${c}`} />
        ))}
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col h-full gap-3">
      {/* logo + greeting */}
      <div className="flex items-center gap-1.5">
        <Bone className="h-3 w-3 rounded-sm" />
        <Bone className="h-2.5 w-20" />
      </div>
      {/* big headline */}
      <div className="space-y-1.5">
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-4/5" />
        <Bone className="h-4 w-3/5" />
      </div>
      {/* sub-text */}
      <div className="space-y-1 mt-1">
        <Bone className="h-2 w-full opacity-60" />
        <Bone className="h-2 w-5/6 opacity-60" />
      </div>
      {/* sparkline area */}
      <div className="flex-1 min-h-0 mt-2 rounded-lg bg-foreground/5 overflow-hidden relative">
        <svg
          viewBox="0 0 200 70"
          preserveAspectRatio="none"
          className="w-full h-full opacity-30"
          fill="none"
        >
          <path
            d="M0,42 C11,40 22,36 33,34 C44,32 55,38 67,35 C78,32 89,22 100,20 C111,18 122,26 133,24 C144,22 155,14 167,12 C178,10 189,15 200,8"
            className="stroke-foreground"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      {/* hero input skeleton */}
      <div className="h-8 rounded-xl bg-foreground/6 border border-foreground/8 flex items-center px-3 gap-2">
        <Bone className="h-2.5 w-2.5 rounded-sm opacity-50" />
        <Bone className="h-2 flex-1 opacity-40" />
      </div>
    </div>
  );
}

// ── Insight card skeleton dispatcher ─────────────────────────────────────────

function InsightCardSkeleton({
  card,
  active,
}: {
  card: InsightCardConfig;
  active: boolean;
}) {
  const { type, chartType } = card.content;
  if (type === "kpi") return <KpiSkeleton active={active} />;
  if (chartType === "horizontal-bars")
    return <HorizontalBarsSkeleton active={active} />;
  if (chartType === "stacked-bar")
    return <StackedBarSkeleton active={active} />;
  return <KpiSkeleton active={active} />;
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function PinModal({
  open,
  chart,
  layout,
  onPin,
  onClose,
}: PinModalProps) {
  const [selected, setSelected] = useState<number | "new" | null>(null);
  const cards = layout.insightCards.filter((c) => c.visible);

  function handleConfirm() {
    if (selected === null) return;
    onPin(selected);
    setSelected(null);
  }

  function handleClose() {
    setSelected(null);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && chart && (
        <>
          {/* Backdrop */}
          <motion.div
            key="pin-backdrop"
            className="absolute inset-0 z-40 bg-background/85 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Full-screen panel */}
          <motion.div
            key="pin-modal"
            className="absolute inset-0 z-50 flex flex-col"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-8 pt-7 pb-5 shrink-0">
              <div>
                <p className="text-xl font-bold tracking-tight text-foreground">
                  Pin to dashboard
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Select a card to replace with &ldquo;{chart.title}&rdquo;, or
                  add it below the grid.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Dashboard preview — mirrors actual layout */}
            <div className="flex-1 min-h-0 px-8 pb-2 flex gap-3">
              {/* Left column — overview card (non-selectable) */}
              <div className="flex flex-col gap-3" style={{ flex: "1 1 0" }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 shrink-0">
                  Overview
                </p>
                <div className="flex-1 min-h-0 rounded-2xl border border-border/40 bg-card/40 p-4">
                  <OverviewSkeleton />
                </div>
              </div>

              {/* Right column — 2×2 insight grid + new slot */}
              <div className="flex flex-col gap-3" style={{ flex: "1 1 0" }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 shrink-0">
                  Insight cards — select one to replace
                </p>
                <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
                  {cards.map((card, i) => {
                    const isSelected = selected === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelected(i)}
                        className={[
                          "relative rounded-2xl border p-4 text-left transition-all duration-200 flex flex-col overflow-hidden",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-[0_0_0_2px_hsl(var(--primary)/0.25)]"
                            : "border-border/50 bg-card/50 hover:border-primary/40 hover:bg-card/70",
                        ].join(" ")}
                      >
                        {/* Selection ring indicator */}
                        <div
                          className={[
                            "absolute top-3 right-3 flex h-4 w-4 items-center justify-center rounded-full border transition-all",
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-border/60 bg-background/60",
                          ].join(" ")}
                        >
                          {isSelected && (
                            <Check className="h-2.5 w-2.5 text-primary-foreground" />
                          )}
                        </div>

                        {/* Card title */}
                        <p
                          className={[
                            "text-[11px] font-semibold pr-6 leading-tight transition-colors",
                            isSelected ? "text-primary" : "text-foreground/80",
                          ].join(" ")}
                        >
                          {card.content.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 capitalize mb-2">
                          {card.content.type === "kpi"
                            ? "KPI"
                            : card.content.chartType.replace("-", " ")}
                        </p>

                        {/* Skeleton content */}
                        <div className="flex-1 min-h-0">
                          <InsightCardSkeleton
                            card={card}
                            active={isSelected}
                          />
                        </div>

                        {/* "Will replace" label */}
                        {isSelected && (
                          <div className="mt-2 pt-2 border-t border-primary/20">
                            <p className="text-[10px] text-primary/70 font-medium">
                              ↳ Replace with &ldquo;{chart.title}&rdquo;
                            </p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Add as new card — full width below the grid */}
                <button
                  type="button"
                  onClick={() => setSelected("new")}
                  className={[
                    "w-full rounded-2xl border-2 border-dashed p-3 flex items-center gap-3 transition-all duration-200 shrink-0",
                    selected === "new"
                      ? "border-primary bg-primary/5"
                      : "border-border/40 hover:border-primary/40 hover:bg-card/40",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition-colors",
                      selected === "new"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted",
                    ].join(" ")}
                  >
                    {selected === "new" ? (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p
                      className={[
                        "text-[12px] font-semibold transition-colors",
                        selected === "new" ? "text-primary" : "text-foreground",
                      ].join(" ")}
                    >
                      Add as new card
                    </p>
                    <p className="text-[11px] text-muted-foreground/70">
                      Appends &ldquo;{chart.title}&rdquo; below the current grid
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-border/50 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="h-9 px-5 rounded-xl border border-border bg-muted text-sm font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selected === null}
                onClick={handleConfirm}
                className="h-9 px-5 rounded-xl bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
              >
                Pin to dashboard
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
