"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import type { CardConfig, GlowConfig, LayoutConfig } from "./glow-config";
import { CardsTab, GlowTab, LayoutTab } from "./dev-controls-tabs";
import { useDashboardData } from "./DashboardDataProvider";
import { datasetPresets, type DashboardDataset } from "./dashboard-data";

interface DevControlsProps {
  glowConfig: GlowConfig;
  onGlowChange: (config: GlowConfig) => void;
  cardConfig: CardConfig;
  onCardChange: (config: CardConfig) => void;
  layoutConfig: LayoutConfig;
  onLayoutChange: (config: LayoutConfig) => void;
}

type Tab = "glow" | "cards" | "layout" | "data";

export function GlowDevControls({
  glowConfig,
  onGlowChange,
  cardConfig,
  onCardChange,
  layoutConfig,
  onLayoutChange,
}: DevControlsProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("glow");
  const { data, setDataset } = useDashboardData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadedDatasets, setUploadedDatasets] = useState<DashboardDataset[]>(
    [],
  );

  const configMap: Record<Tab, unknown> = {
    glow: glowConfig,
    cards: cardConfig,
    layout: layoutConfig,
    data: data,
  };
  const currentConfig = configMap[tab];

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setUploadError("");
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const parsed = JSON.parse(
                reader.result as string,
              ) as DashboardDataset;
              if (!parsed.brandName || !parsed.insightCards) {
                setUploadError("Invalid format");
                return;
              }
              setUploadedDatasets((prev) => {
                const exists = prev.some((d) => d.name === parsed.name);
                return exists
                  ? prev.map((d) => (d.name === parsed.name ? parsed : d))
                  : [...prev, parsed];
              });
              setDataset(parsed);
            } catch {
              setUploadError("Invalid JSON");
            }
          };
          reader.readAsText(file);
          e.target.value = "";
        }}
      />
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
              <button
                type="button"
                onClick={() => setTab("data")}
                className={`flex-1 px-2 py-2 text-xs font-medium ${tab === "data" ? "bg-muted" : ""}`}
              >
                Data
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
              {tab === "data" && (
                <div className="space-y-3">
                  <div className="text-xs font-bold tracking-tight border-b pb-2">
                    Dataset: {data.name}
                  </div>
                  <div>
                    <div className="text-xs mb-1">Preset</div>
                    <select
                      value={
                        Object.entries(datasetPresets).find(
                          ([, v]) => v.name === data.name,
                        )?.[0] ?? `uploaded:${data.name}`
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith("uploaded:")) {
                          const name = val.slice("uploaded:".length);
                          const uploaded = uploadedDatasets.find(
                            (d) => d.name === name,
                          );
                          if (uploaded) setDataset(uploaded);
                        } else {
                          const preset = datasetPresets[val];
                          if (preset) setDataset(preset);
                        }
                      }}
                      className="w-full h-7 rounded border bg-background px-1 text-xs"
                    >
                      {Object.entries(datasetPresets).map(([key, val]) => (
                        <option key={key} value={key}>
                          {val.name}
                        </option>
                      ))}
                      {uploadedDatasets.map((d) => (
                        <option
                          key={`uploaded:${d.name}`}
                          value={`uploaded:${d.name}`}
                        >
                          {d.name} (uploaded)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(data, null, 2)], {
                          type: "application/json",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `dashboard-${data.name.toLowerCase().replace(/\s+/g, "-")}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 h-7 rounded border bg-background text-xs hover:bg-muted transition-colors"
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 h-7 rounded border bg-background text-xs hover:bg-muted transition-colors"
                    >
                      Upload
                    </button>
                  </div>
                  {uploadError && (
                    <div className="text-[10px] text-destructive">
                      {uploadError}
                    </div>
                  )}
                </div>
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
    </>
  );
}
