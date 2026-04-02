export interface InsightCardData {
  title: string;
  type: "kpi" | "chart";
  chartType: "donut" | "horizontal-bars" | "sparkline" | "area" | "stacked-bar";
  kpiNumber?: string;
  kpiBadge?: string;
  kpiDescription?: string;
  bars?: { label: string; value: number }[];
  stackedBars?: { label: string; segments: number[] }[];
  stackedLegend?: string[];
  donutPercent?: number;
  donutLabel?: string;
  donutDescription?: string;
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
  insightCards: [InsightCardData, InsightCardData, InsightCardData, InsightCardData];
}

export const defaultDataset: DashboardDataset = {
  name: "Loan Setup",
  brandName: "UiPath",
  brandLine: "Vertical Solutions",
  dashboardTitle: "Product",
  badgeText: "Experimental",
  greeting: "Good morning, Peter",
  headline: "Loan volume scales as setup time drops by 3.5 days.",
  subhead: "Setup time declined ↓21% month over month while volume increased ↑18%.",
  chartLabels: { y: ["200", "150", "100", "50"], target: "Target" },
  promptPlaceholder: "What would you like to understand about loan performance?",
  promptSuggestions: ["Show me top risk factors", "Compare Q1 vs Q2 performance"],
  insightCards: [
    {
      title: "Upfront decision efficiency",
      type: "kpi",
      chartType: "donut",
      kpiNumber: "94.2%",
      kpiBadge: "+6.8%",
      kpiDescription: "Loans finalized on first review without rework.",
    },
    {
      title: "Top issues",
      type: "chart",
      chartType: "horizontal-bars",
      bars: [
        { label: "Risk flag in notes", value: 34 },
        { label: "Credit report >120 days old", value: 29 },
        { label: "Owner name mismatch", value: 23 },
        { label: "High DTI ratio", value: 14 },
        { label: "Missing appraisal docs", value: 11 },
      ],
    },
    {
      title: "Pipeline",
      type: "chart",
      chartType: "stacked-bar",
      stackedBars: [
        { label: "Mon", segments: [30, 20, 10] },
        { label: "Tue", segments: [40, 15, 20] },
        { label: "Wed", segments: [25, 30, 15] },
        { label: "Thu", segments: [45, 10, 25] },
        { label: "Fri", segments: [35, 25, 18] },
      ],
      stackedLegend: ["Approved", "Pending", "Rejected"],
    },
    {
      title: "SLA compliance",
      type: "kpi",
      chartType: "donut",
      kpiNumber: "99.5%",
      kpiBadge: "+1.2%",
      kpiDescription: "Loans processed within defined SLA thresholds.",
    },
  ],
};

export const ecommerceDataset: DashboardDataset = {
  name: "E-commerce Order Fulfillment",
  brandName: "UiPath",
  brandLine: "Vertical Solutions",
  dashboardTitle: "Product",
  badgeText: "Experimental",
  greeting: "Good morning, Peter",
  headline: "Order throughput doubles as returns drop by 12%.",
  subhead: "Returns declined ↓12% month over month while orders increased ↑34%.",
  chartLabels: { y: ["500", "375", "250", "125"], target: "Target" },
  promptPlaceholder: "What would you like to understand about order fulfillment?",
  promptSuggestions: ["Show delayed shipments", "Compare warehouse performance"],
  insightCards: [
    {
      title: "On-time delivery rate",
      type: "kpi",
      chartType: "donut",
      kpiNumber: "96.8%",
      kpiBadge: "+3.2%",
      kpiDescription: "Orders delivered within promised window.",
    },
    {
      title: "Top return reasons",
      type: "chart",
      chartType: "horizontal-bars",
      bars: [
        { label: "Wrong size/fit", value: 38 },
        { label: "Damaged in transit", value: 24 },
        { label: "Not as described", value: 19 },
        { label: "Late delivery", value: 12 },
        { label: "Changed mind", value: 7 },
      ],
    },
    {
      title: "Fulfillment volume",
      type: "chart",
      chartType: "stacked-bar",
      stackedBars: [
        { label: "Mon", segments: [120, 45, 8] },
        { label: "Tue", segments: [145, 38, 12] },
        { label: "Wed", segments: [130, 52, 6] },
        { label: "Thu", segments: [160, 35, 15] },
        { label: "Fri", segments: [180, 42, 10] },
      ],
      stackedLegend: ["Shipped", "Processing", "Returned"],
    },
    {
      title: "Customer satisfaction",
      type: "kpi",
      chartType: "donut",
      kpiNumber: "4.7★",
      kpiBadge: "+0.3",
      kpiDescription: "Average rating across all fulfilled orders.",
    },
  ],
};

export const datasetPresets: Record<string, DashboardDataset> = {
  default: defaultDataset,
  ecommerce: ecommerceDataset,
};
