import type { DashboardDataset } from "./dashboard-data";

export const productDemoDataset: DashboardDataset = {
  name: "Product Demo",
  brandName: "UiPath",
  brandLine: "Vertical Solutions",
  dashboardTitle: "Product Demo",
  badgeText: "Demo",
  greeting: "Good morning",
  headline: "Your headline goes here.",
  subhead:
    "Your supporting narrative goes here — describe the key trend or outcome.",
  chartLabels: { y: ["600", "450", "300", "150"], target: "Target" },
  promptPlaceholder: "Ask a question about your data...",
  promptSuggestions: ["Suggestion one", "Suggestion two"],
  insightCards: [
    {
      title: "KPI title",
      type: "kpi",
      chartType: "donut",
      size: "sm",
      interaction: "static",
      kpiNumber: "00.0%",
      kpiBadge: "+0.0%",
      kpiDescription: "Short description of what this metric measures.",
    },
    {
      title: "Top issues",
      type: "chart",
      chartType: "horizontal-bars",
      size: "md",
      interaction: "expand",
      expandContent: {
        summary: "Summary of the key finding for this chart.",
        details: ["Action item one", "Action item two"],
      },
      bars: [
        { label: "Item A", value: 40 },
        { label: "Item B", value: 30 },
        { label: "Item C", value: 20 },
        { label: "Item D", value: 10 },
      ],
    },
    {
      title: "Pipeline",
      type: "chart",
      chartType: "stacked-bar",
      size: "md",
      interaction: "expand",
      expandContent: {
        summary: "Summary of the weekly pipeline trend.",
        details: ["Action item one", "Action item two"],
      },
      stackedBars: [
        { label: "Mon", segments: [30, 20, 10] },
        { label: "Tue", segments: [40, 15, 20] },
        { label: "Wed", segments: [25, 30, 15] },
        { label: "Thu", segments: [45, 10, 25] },
        { label: "Fri", segments: [35, 25, 18] },
      ],
      stackedLegend: ["Segment A", "Segment B", "Segment C"],
    },
    {
      title: "KPI title",
      type: "kpi",
      chartType: "donut",
      size: "sm",
      interaction: "static",
      kpiNumber: "00.0%",
      kpiBadge: "+0.0%",
      kpiDescription: "Short description of what this metric measures.",
    },
  ],
};
