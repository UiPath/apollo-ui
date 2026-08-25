import {
  AUTO_CLEARED_COUNT,
  AUTO_CLEARED_TOTAL,
  AVG_REQUEST_TO_PO_DAYS,
  COMMITTED_SPEND_MILLIONS,
  COMMODITY_CYCLE_TIME,
  CYCLE_TIME_TARGET_DAYS,
  CYCLE_TIME_TREND_DAYS,
  HEADLINE_METRICS,
  INTAKE_QUALITY_PCT,
  INTAKE_QUALITY_SUB_FINDINGS,
  NEEDS_DECISION_COUNT,
  OFF_CONTRACT_MILLIONS,
  OFF_CONTRACT_PCT,
  ON_CONTRACT_MILLIONS,
  ON_CONTRACT_PCT,
  RETURN_REASONS,
  SOFTWARE_STAGE_BREAKDOWN,
  SPEND_COMPLIANCE_SUB_FINDINGS,
} from "../data/analytics";
import { ph } from "../data/placeholders";
import type { DashboardDataset, InsightCardData } from "./dashboard-data";
import type { LayoutConfig } from "./glow-config";

// Repoints the copied dashboard components at Elena's own data module
// (prompt 62) instead of the reference's hardcoded datasets. Prompt 84
// orders the four cards to match the hero's own claim order and backs
// each hero claim with exactly one card: "where the time goes" backs the
// headline (request to PO days, security review's own share); "intake
// quality", "auto cleared", and "off contract spend" back the subhead's
// three claims in the order it states them. All four share one width, no
// size hierarchy. The commodity cycle time breakdown (previously its own
// card, "which commodities run long") now renders behind "where the time
// goes"'s own expand instead, since a stage breakdown and a commodity
// breakdown are two views of the same "where the time goes" question.

const insightCards: [
  InsightCardData,
  InsightCardData,
  InsightCardData,
  InsightCardData,
] = [
  {
    title: ph("PH-80", "where the time goes"),
    type: "chart",
    chartType: "stage-duration-bars",
    size: "md",
    interaction: "expand",
    icon: "clock",
    bars: SOFTWARE_STAGE_BREAKDOWN.map((s) => ({
      label: s.stage,
      value: s.days,
    })),
    barsUnit: " days",
    expandContent: {
      bars: COMMODITY_CYCLE_TIME.map((c) => ({
        label: c.commodity,
        value: c.days,
      })),
      average: AVG_REQUEST_TO_PO_DAYS,
      barsUnit: " days",
      stageHeading: ph("PH-93", "by stage heading"),
      commodityHeading: ph("PH-95", "by commodity heading"),
      connectingLine: ph("PH-94", "stage to commodity connecting line"),
    },
  },
  {
    title: ph("PH-78", "intake quality"),
    type: "kpi",
    chartType: "donut",
    size: "md",
    interaction: "expand",
    icon: "file-check",
    kpiNumber: `${INTAKE_QUALITY_PCT}%`,
    donutPercent: INTAKE_QUALITY_PCT,
    kpiDescription: HEADLINE_METRICS[0].qualifier,
    footLines: [
      `${INTAKE_QUALITY_SUB_FINDINGS[1]} ${INTAKE_QUALITY_SUB_FINDINGS[2]}`,
    ],
    expandContent: {
      bars: RETURN_REASONS.map((r) => ({
        label: r.reason,
        value: r.sharePct,
      })),
      finding: ph("PH-90", "return reason breakdown finding"),
      heading: ph("PH-91", "return reason breakdown heading"),
    },
  },
  {
    title: ph("PH-81", "auto cleared"),
    type: "kpi",
    chartType: "stacked-bar",
    size: "md",
    interaction: "static",
    icon: "zap",
    kpiNumber: `${AUTO_CLEARED_COUNT} of ${AUTO_CLEARED_TOTAL}`,
    kpiDescription: "Cleared without a buyer",
    footLines: [`${NEEDS_DECISION_COUNT} needed a decision`],
  },
  {
    title: ph("PH-79", "off contract spend"),
    type: "kpi",
    chartType: "proportion-bar",
    size: "md",
    interaction: "expand",
    expandGrowth: "width",
    icon: "unlink",
    kpiNumber: `$${OFF_CONTRACT_MILLIONS.toFixed(1)}M`,
    kpiDescription: "Off contract",
    proportionSegments: [
      { label: "On contract", value: ON_CONTRACT_PCT },
      { label: "Off contract", value: OFF_CONTRACT_PCT },
    ],
    proportionCaptionTotal: `$${COMMITTED_SPEND_MILLIONS}M total`,
    proportionCaptionLeft: `$${ON_CONTRACT_MILLIONS.toFixed(1)}M on contract`,
    proportionCaptionRight: `$${OFF_CONTRACT_MILLIONS.toFixed(1)}M off contract`,
    footLines: [ph("PH-89", "where spend leaks supporting line")],
    expandContent: {
      heading: ph("PH-92", "off contract spend breakdown heading"),
      emphasisFacts: [
        {
          lead: `$${COMMITTED_SPEND_MILLIONS}M`,
          rest: SPEND_COMPLIANCE_SUB_FINDINGS[0].slice(
            `$${COMMITTED_SPEND_MILLIONS}M`.length,
          ),
        },
        {
          lead: "Unlinked spend",
          rest: SPEND_COMPLIANCE_SUB_FINDINGS[1].slice("Unlinked spend".length),
        },
        {
          lead: "Software",
          rest: SPEND_COMPLIANCE_SUB_FINDINGS[2].slice("Software".length),
        },
      ],
    },
  },
];

export const elenaDataset: DashboardDataset = {
  name: "Procurement outcomes",
  brandName: "UiPath",
  brandLine: "Vertical Solutions",
  dashboardTitle: "Procurement outcomes",
  badgeText: ph("PH-74", "badge"),
  greeting: "Good morning",
  headline: ph("PH-71", "hero headline"),
  subhead: ph("PH-69", "subhead"),
  chartLabels: { y: [], target: "" },
  heroTrend: CYCLE_TIME_TREND_DAYS,
  heroTrendTarget: CYCLE_TIME_TARGET_DAYS,
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
      size: "md",
      visible: true,
      interaction: "expand",
      content: {
        type: "chart",
        chartType: "stage-duration-bars",
        title: ph("PH-80", "where the time goes"),
      },
    },
    {
      size: "md",
      visible: true,
      interaction: "expand",
      content: {
        type: "kpi",
        chartType: "donut",
        title: ph("PH-78", "intake quality"),
      },
    },
    {
      size: "md",
      visible: true,
      interaction: "static",
      content: {
        type: "kpi",
        chartType: "stacked-bar",
        title: ph("PH-81", "auto cleared"),
      },
    },
    {
      size: "md",
      visible: true,
      interaction: "expand",
      content: {
        type: "kpi",
        chartType: "proportion-bar",
        title: ph("PH-79", "off contract spend"),
      },
    },
  ],
};
