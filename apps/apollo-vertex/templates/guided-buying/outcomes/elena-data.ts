import { HEADLINE_METRICS, SOFTWARE_STAGE_BREAKDOWN } from "../data/analytics";
import { ph } from "../data/placeholders";
import type { DashboardDataset, InsightCardData } from "./dashboard-data";
import type { LayoutConfig } from "./glow-config";

// Repoints the copied dashboard components at Elena's own data module
// (prompt 62) instead of the reference's hardcoded datasets. Field-by-field
// mapping is reported alongside this change; kpiBadge and chartLabels are
// left out because nothing in data/analytics.ts fills them (see report).

const insightCards: [
  InsightCardData,
  InsightCardData,
  InsightCardData,
  InsightCardData,
] = [
  {
    title: HEADLINE_METRICS[0].label,
    type: "kpi",
    chartType: "donut",
    size: "sm",
    interaction: "expand",
    kpiNumber: HEADLINE_METRICS[0].figure,
    kpiDescription: HEADLINE_METRICS[0].qualifier,
    expandContent: { details: HEADLINE_METRICS[0].subFindings },
  },
  {
    title: HEADLINE_METRICS[1].label,
    type: "kpi",
    chartType: "donut",
    size: "md",
    interaction: "expand",
    kpiNumber: HEADLINE_METRICS[1].figure,
    kpiDescription: HEADLINE_METRICS[1].qualifier,
    expandContent: { details: HEADLINE_METRICS[1].subFindings },
  },
  {
    title: HEADLINE_METRICS[2].label,
    type: "kpi",
    chartType: "donut",
    size: "sm",
    interaction: "expand",
    kpiNumber: HEADLINE_METRICS[2].figure,
    kpiDescription: HEADLINE_METRICS[2].qualifier,
    expandContent: { details: HEADLINE_METRICS[2].subFindings },
  },
  {
    title: ph("PH-71", "stage breakdown heading"),
    type: "chart",
    chartType: "horizontal-bars",
    size: "md",
    interaction: "static",
    bars: SOFTWARE_STAGE_BREAKDOWN.map((stage) => ({
      label: stage.stage,
      value: stage.days,
    })),
  },
];

export const elenaDataset: DashboardDataset = {
  name: "Procurement outcomes",
  brandName: "UiPath",
  brandLine: "Vertical Solutions",
  dashboardTitle: "Analytics",
  badgeText: ph("PH-74", "badge"),
  greeting: "Good morning",
  headline: ph("PH-68", "headline"),
  subhead: ph("PH-69", "subhead"),
  chartLabels: { y: [], target: "" },
  promptPlaceholder: ph("PH-70", "composer placeholder"),
  promptSuggestions: [
    ph("PH-75", "composer suggestion 1"),
    ph("PH-76", "composer suggestion 2"),
  ],
  insightCards,
};

export const elenaLayout: LayoutConfig = {
  gap: 4,
  overviewRatio: 4,
  promptRatio: 1,
  padding: 24,
  containerBg: "none",
  insightCards: [
    {
      size: "sm",
      visible: true,
      interaction: "expand",
      content: {
        type: "kpi",
        chartType: "donut",
        title: HEADLINE_METRICS[0].label,
      },
    },
    {
      size: "md",
      visible: true,
      interaction: "expand",
      content: {
        type: "kpi",
        chartType: "donut",
        title: HEADLINE_METRICS[1].label,
      },
    },
    {
      size: "sm",
      visible: true,
      interaction: "expand",
      content: {
        type: "kpi",
        chartType: "donut",
        title: HEADLINE_METRICS[2].label,
      },
    },
    {
      size: "md",
      visible: true,
      interaction: "static",
      content: {
        type: "chart",
        chartType: "horizontal-bars",
        title: ph("PH-71", "stage breakdown heading"),
      },
    },
  ],
};
