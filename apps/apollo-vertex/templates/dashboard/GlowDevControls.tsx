"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { CardConfig, GlowConfig, LayoutConfig } from "./glow-config";
import { CardsTab, GlowTab, LayoutTab } from "./dev-controls-tabs";

interface DevControlsProps {
  glowConfig: GlowConfig;
  onGlowChange: (config: GlowConfig) => void;
  cardConfig: CardConfig;
  onCardChange: (config: CardConfig) => void;
  layoutConfig: LayoutConfig;
  onLayoutChange: (config: LayoutConfig) => void;
}

type Tab = "glow" | "cards" | "layout";

export function GlowDevControls({
  glowConfig,
  onGlowChange,
  cardConfig,
  onCardChange,
  layoutConfig,
  onLayoutChange,
}: DevControlsProps) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<Tab>("glow");

  const configMap = {
    glow: glowConfig,
    cards: cardConfig,
    layout: layoutConfig,
  };
  const currentConfig = configMap[tab];

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex">
      {open && (
        <div className="w-56 bg-popover border rounded-r-lg shadow-lg max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => setTab("glow")}
              className={`flex-1 px-2 py-2 text-xs font-medium ${tab === "glow" ? "bg-muted" : ""}`}
            >
              Glow
            </button>
            <button
              type="button"
              onClick={() => setTab("cards")}
              className={`flex-1 px-2 py-2 text-xs font-medium ${tab === "cards" ? "bg-muted" : ""}`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setTab("layout")}
              className={`flex-1 px-2 py-2 text-xs font-medium ${tab === "layout" ? "bg-muted" : ""}`}
            >
              Layout
            </button>
          </div>
          <div className="p-3 overflow-y-auto flex-1">
            {tab === "glow" && (
              <GlowTab config={glowConfig} onChange={onGlowChange} />
            )}
            {tab === "cards" && (
              <CardsTab config={cardConfig} onChange={onCardChange} />
            )}
            {tab === "layout" && (
              <LayoutTab config={layoutConfig} onChange={onLayoutChange} />
            )}
            <div className="border-t pt-2 mt-3">
              <div className="text-xs text-muted-foreground">Config:</div>
              <pre className="text-[10px] mt-1 bg-muted rounded p-1.5 overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(currentConfig, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="self-center h-8 w-5 bg-popover border rounded-r flex items-center justify-center shadow-md"
      >
        {open ? (
          <ChevronLeft className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
      </button>
    </div>
  );
}
