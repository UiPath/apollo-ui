export interface InsightCardData {
  title: string;
  type: "kpi" | "chart";
  chartType: "donut" | "horizontal-bars" | "sparkline" | "area" | "stacked-bar";
  size?: "sm" | "md" | "lg";
  interaction?: "static" | "expand" | "navigate";
  // Navigate config
  navigateTo?: string;
  // Expand config: additional content shown when card is expanded
  expandContent?: {
    summary?: string;
    details?: string[];
  };
  // KPI data
  kpiNumber?: string;
  kpiBadge?: string;
  kpiDescription?: string;
  // Horizontal bars data
  bars?: { label: string; value: number }[];
  // Stacked bar data
  stackedBars?: { label: string; segments: number[] }[];
  stackedLegend?: string[];
  // Donut data
  donutPercent?: number;
  donutLabel?: string;
  donutDescription?: string;
  // Sparkline / Area data
  points?: number[];
}

export interface DashboardDataset {
  name: string;
  brandName: string;
  brandLine: string;
  dashboardTitle: string;
  badgeText: string;
  greeting: string;
  headline: string;
  subhead: string;
  chartLabels: { y: string[]; target: string };
  promptPlaceholder: string;
  promptSuggestions: string[];
  insightCards: [
    InsightCardData,
    InsightCardData,
    InsightCardData,
    InsightCardData,
  ];
}
