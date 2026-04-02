"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

// --- Sample data ---

const trendData = {
  weeks: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
  series: [
    { label: "Wrong size/fit", color: "bg-chart-1", stroke: "stroke-chart-1", values: [31, 33, 34, 35, 36, 37, 39, 41] },
    { label: "Damaged in transit", color: "bg-chart-2", stroke: "stroke-chart-2", values: [25, 24, 26, 23, 22, 24, 23, 21] },
    { label: "Not as described", color: "bg-chart-3", stroke: "stroke-chart-3", values: [20, 19, 18, 19, 18, 17, 18, 17] },
  ],
  takeaway: "Fit-related returns have grown steadily over 8 weeks (+32%), while damage and description issues remain flat.",
};

const categoryBreakdown = [
  { category: "Women's Apparel", pct: 48, highlight: true },
  { category: "Footwear", pct: 27 },
  { category: "Men's Apparel", pct: 16 },
  { category: "Accessories", pct: 9 },
];
const categoryInsight = "Women's apparel and footwear account for 75% of all fit-related returns. Sizing inconsistency across brands is the primary driver.";

const topProducts = [
  { name: "Slim Fit Chinos — Navy", returnRate: 18.4, issue: "Wrong size", impact: "$12,400" },
  { name: "Running Shoe Pro V2", returnRate: 15.2, issue: "Wrong fit", impact: "$9,800" },
  { name: "Wrap Dress — Floral", returnRate: 14.7, issue: "Wrong size", impact: "$8,200" },
  { name: "Oversized Hoodie — Black", returnRate: 12.1, issue: "Too large", impact: "$6,900" },
  { name: "Ankle Boot — Tan", returnRate: 11.8, issue: "Wrong fit", impact: "$5,400" },
];

const recommendations = [
  { action: "Deploy dynamic size recommendation for top 3 SKUs", impact: "Est. 22% reduction in fit returns", priority: "High" },
  { action: "Add fit-specific review prompts to product pages", impact: "Improve size confidence pre-purchase", priority: "Medium" },
  { action: "Flag brands with >15% size variance for supplier review", impact: "Address root cause across catalog", priority: "Medium" },
];

const suggestedPrompts = [
  "Why are fit-related returns increasing?",
  "Which products are driving return volume?",
  "Show warehouses contributing to damage issues",
  "What orders are at risk of return?",
];

// --- Components ---

function TrendChart({ data }: { data: typeof trendData }) {
  const allValues = data.series.flatMap((s) => s.values);
  const max = Math.max(...allValues);
  const h = 60;
  const w = 180;
  const step = w / (data.weeks.length - 1);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-sm font-bold tracking-tight mb-1">Trend over time</div>
        <p className="text-xs text-muted-foreground mb-4">8-week view of the top 3 return reasons</p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36" fill="none">
        {data.series.map((series) => {
          const points = series.values
            .map((v, i) => `${i * step},${h - (v / max) * h * 0.85}`)
            .join(" ");
          return (
            <polyline
              key={series.label}
              points={points}
              className={series.stroke}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          );
        })}
      </svg>
      <div className="flex gap-5 mt-3">
        {data.series.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className={`size-2.5 rounded-full ${s.color}`} />
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-muted/40 p-3 mt-4">
        <p className="text-xs leading-relaxed">{data.takeaway}</p>
      </div>
    </div>
  );
}

function CategoryBreakdown() {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-sm font-bold tracking-tight mb-1">Category breakdown</div>
        <p className="text-xs text-muted-foreground">Where "Wrong size/fit" returns are concentrated</p>
      </div>
      <div className="space-y-4">
        {categoryBreakdown.map((cat) => (
          <div key={cat.category}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium">{cat.category}</span>
              <span className="text-xs font-bold">{cat.pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted relative">
              <div
                className={`h-full rounded-full ${cat.highlight ? "bg-chart-1" : "bg-chart-1/40"} relative`}
                style={{ width: `${cat.pct}%` }}
              >
                <div className={`absolute inset-0 ${cat.highlight ? "bg-chart-1" : "bg-chart-1/40"} rounded-full opacity-35 dark:opacity-55 blur-[4px]`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-muted/40 p-3">
        <p className="text-xs leading-relaxed">{categoryInsight}</p>
      </div>
    </div>
  );
}

function TopProducts() {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-sm font-bold tracking-tight mb-1">Top products driving issues</div>
        <p className="text-xs text-muted-foreground">Ranked by return rate with revenue impact</p>
      </div>
      <div className="space-y-0">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 text-[10px] text-muted-foreground pb-2 border-b border-muted-foreground/10">
          <span>Product</span>
          <span>Return %</span>
          <span>Issue</span>
          <span>Impact</span>
        </div>
        {topProducts.map((p) => (
          <div key={p.name} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 text-xs items-center py-3 border-b border-muted-foreground/5 last:border-0">
            <span className="truncate font-medium">{p.name}</span>
            <span className="text-right tabular-nums font-bold">{p.returnRate}%</span>
            <Badge variant="secondary" className="text-[10px] h-5">{p.issue}</Badge>
            <span className="text-right text-muted-foreground tabular-nums">{p.impact}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Recommendations() {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-sm font-bold tracking-tight mb-1">Recommended actions</div>
        <p className="text-xs text-muted-foreground">AI-assisted next steps based on current data</p>
      </div>
      <div className="space-y-4">
        {recommendations.map((rec, i) => (
          <div key={rec.action} className="rounded-lg border border-muted-foreground/10 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
              <Badge
                variant="secondary"
                status={rec.priority === "High" ? "warning" : "info"}
                className="text-[10px] h-5"
              >
                {rec.priority}
              </Badge>
            </div>
            <p className="text-sm font-medium leading-snug">{rec.action}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{rec.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Exports ---

export type DrilldownTab = "overview" | "trend" | "categories" | "products" | "actions";

export const drilldownTabs: { key: DrilldownTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "categories", label: "Categories" },
  { key: "products", label: "Products" },
  { key: "actions", label: "Actions" },
];

export function DrilldownTabContent({ tab }: { tab: DrilldownTab }) {
  if (tab === "trend") return <TrendChart data={trendData} />;
  if (tab === "categories") return <CategoryBreakdown />;
  if (tab === "products") return <TopProducts />;
  if (tab === "actions") return <Recommendations />;
  return null; // "overview" is handled by the original card content
}

export function AutopilotPrompts({ onPromptSelect }: { onPromptSelect?: (prompt: string) => void }) {
  const [pressedPrompt, setPressedPrompt] = useState<string | null>(null);

  return (
    <div className="pt-3 border-t border-muted-foreground/10 shrink-0">
      <div className="flex items-center gap-1.5 mb-2">
        <img src="/Autopilot_dark.svg" alt="Autopilot" className="size-3.5 block dark:hidden" />
        <img src="/Autopilot_light.svg" alt="Autopilot" className="size-3.5 hidden dark:block" />
        <span className="text-[10px] text-muted-foreground">Ask Autopilot</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => {
              setPressedPrompt(prompt);
              onPromptSelect?.(prompt);
              setTimeout(() => setPressedPrompt(null), 600);
            }}
            className={`text-[11px] px-2.5 py-1 rounded-full transition-colors duration-200 ${
              pressedPrompt === prompt
                ? "bg-gradient-to-r from-insight-500 to-primary-400 text-white"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
