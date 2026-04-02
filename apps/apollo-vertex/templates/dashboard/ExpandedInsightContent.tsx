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
    <div>
      <div className="text-xs font-bold tracking-tight mb-3">Trend over time</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" fill="none">
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
      <div className="flex gap-4 mt-2">
        {data.series.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className={`size-2 rounded-full ${s.color}`} />
            <span className="text-[10px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{data.takeaway}</p>
    </div>
  );
}

function CategoryBreakdown() {
  return (
    <div>
      <div className="text-xs font-bold tracking-tight mb-3">Category breakdown — Wrong size/fit</div>
      <div className="space-y-2">
        {categoryBreakdown.map((cat) => (
          <div key={cat.category} className="flex items-center gap-3">
            <span className="text-xs w-28 shrink-0 truncate">{cat.category}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted relative">
              <div
                className={`h-full rounded-full ${cat.highlight ? "bg-chart-1" : "bg-chart-1/40"}`}
                style={{ width: `${cat.pct}%` }}
              />
            </div>
            <span className="text-xs font-bold w-8 text-right">{cat.pct}%</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{categoryInsight}</p>
    </div>
  );
}

function TopProducts() {
  return (
    <div>
      <div className="text-xs font-bold tracking-tight mb-3">Top products driving issues</div>
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 text-[10px] text-muted-foreground pb-1 border-b border-muted-foreground/10">
          <span>Product</span>
          <span>Return %</span>
          <span>Issue</span>
          <span>Impact</span>
        </div>
        {topProducts.map((p) => (
          <div key={p.name} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 text-xs items-center">
            <span className="truncate font-medium">{p.name}</span>
            <span className="text-right tabular-nums">{p.returnRate}%</span>
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
    <div>
      <div className="text-xs font-bold tracking-tight mb-3">Recommended actions</div>
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div key={rec.action} className="flex gap-3 items-start">
            <Badge
              variant="secondary"
              status={rec.priority === "High" ? "warning" : "info"}
              className="text-[10px] h-5 shrink-0 mt-0.5"
            >
              {rec.priority}
            </Badge>
            <div>
              <p className="text-xs font-medium">{rec.action}</p>
              <p className="text-[11px] text-muted-foreground">{rec.impact}</p>
            </div>
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
  { key: "trend", label: "Trend" },
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
