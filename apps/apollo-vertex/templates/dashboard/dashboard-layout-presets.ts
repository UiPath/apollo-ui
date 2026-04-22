import type { InsightCardData } from "./dashboard-data";
import type { LayoutConfig } from "./glow-config";

export interface AIScreen {
  label: string;
  headline: string;
  subhead: string;
  layout: LayoutConfig;
  cards: InsightCardData[];
}

const BASE_LAYOUT = {
  gap: 4,
  overviewRatio: 4,
  promptRatio: 1,
  padding: 24,
  containerBg: "none",
} as const;

// --- Performance & Throughput ---

const performanceLayout: LayoutConfig = {
  ...BASE_LAYOUT,
  insightCards: [
    {
      size: "sm",
      visible: true,
      interaction: "static",
      content: { type: "kpi", chartType: "donut", title: "STP rate" },
    },
    {
      size: "md",
      visible: true,
      interaction: "expand",
      content: {
        type: "chart",
        chartType: "composed",
        title: "Cycle time vs target",
      },
    },
    {
      size: "md",
      visible: true,
      interaction: "expand",
      content: {
        type: "chart",
        chartType: "multi-line",
        title: "Exception trends",
      },
    },
    {
      size: "sm",
      visible: true,
      interaction: "static",
      content: {
        type: "kpi",
        chartType: "donut",
        title: "Automation coverage",
      },
    },
    {
      size: "md",
      visible: true,
      interaction: "expand",
      content: {
        type: "chart",
        chartType: "stacked-bar",
        title: "Weekly pipeline",
      },
    },
  ],
};

const performanceCards: InsightCardData[] = [
  {
    title: "STP rate",
    type: "kpi",
    chartType: "donut",
    size: "sm",
    interaction: "static",
    kpiNumber: "78.4%",
    kpiBadge: "+5.2 pts",
    kpiDescription: "Invoices processed end-to-end without human intervention.",
    donutPercent: 0.784,
  },
  {
    title: "Cycle time vs target",
    type: "chart",
    chartType: "composed",
    size: "md",
    interaction: "expand",
    expandContent: {
      summary:
        "Cycle time down 42% over 8 weeks — 2 approval bottlenecks remain",
      details: [
        "Consecutive weekly improvements suggest process changes are taking hold",
        "Target: 2.0 days avg processing time — within reach this quarter",
      ],
    },
    composedBars: [
      { label: "W1", value: 3.4, target: 2.0 },
      { label: "W2", value: 3.1, target: 2.0 },
      { label: "W3", value: 2.9, target: 2.0 },
      { label: "W4", value: 2.8, target: 2.0 },
      { label: "W5", value: 2.6, target: 2.0 },
      { label: "W6", value: 2.4, target: 2.0 },
      { label: "W7", value: 2.3, target: 2.0 },
      { label: "W8", value: 2.1, target: 2.0 },
    ],
  },
  {
    title: "Exception trends",
    type: "chart",
    chartType: "multi-line",
    size: "md",
    interaction: "expand",
    expandContent: {
      summary:
        "All top exception categories declining — portal validation is working",
      details: [
        "Missing PO numbers down 44% — enforce PO-first ordering to close the gap",
        "Amount mismatches falling steadily — threshold routing reducing manual review",
        "Duplicate detection improvements cut re-processing overhead by 32%",
      ],
    },
    multiLineSeries: [
      { name: "Missing PO", points: [58, 52, 47, 43, 40, 36, 32, 29] },
      { name: "Amt mismatch", points: [41, 38, 36, 33, 31, 29, 27, 25] },
      { name: "Duplicate", points: [28, 25, 23, 21, 20, 19, 17, 15] },
    ],
    multiLineLabels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
  },
  {
    title: "Automation coverage",
    type: "kpi",
    chartType: "donut",
    size: "sm",
    interaction: "static",
    kpiNumber: "78%",
    kpiBadge: "↑12 pts",
    kpiDescription:
      "Share of invoice volume handled end-to-end without manual steps.",
    donutPercent: 0.78,
  },
  {
    title: "Weekly pipeline",
    type: "chart",
    chartType: "stacked-bar",
    size: "md",
    interaction: "expand",
    expandContent: {
      summary:
        "Automation absorbing 78% of total weekly volume with a Thursday peak",
      details: [
        "Thursday spike aligns with supplier payment terms — pre-stage capacity ahead of time",
        "Manual queue holding steady week-over-week — escalation path investigation due",
        "Pending backlog lowest on Fridays, suggesting Mon carryover worth monitoring",
      ],
    },
    stackedBars: [
      { label: "Mon", segments: [175, 32, 18] },
      { label: "Tue", segments: [198, 27, 14] },
      { label: "Wed", segments: [188, 38, 21] },
      { label: "Thu", segments: [244, 22, 12] },
      { label: "Fri", segments: [226, 29, 16] },
    ],
    stackedLegend: ["Automated", "Manual", "Pending"],
  },
];

export const performancePreset: AIScreen = {
  label: "Performance",
  headline:
    "Cycle time trending toward target as automation absorbs 78% of weekly volume.",
  subhead:
    "Average processing time has dropped from 3.4 to 2.1 days over 8 weeks. Two approval bottlenecks remain — resolving them puts the 2-day target within reach this quarter.",
  layout: performanceLayout,
  cards: performanceCards,
};

// --- Risk & Issues ---

const riskLayout: LayoutConfig = {
  ...BASE_LAYOUT,
  insightCards: [
    {
      size: "sm",
      visible: true,
      interaction: "static",
      content: { type: "kpi", chartType: "donut", title: "SLA breach rate" },
    },
    {
      size: "md",
      visible: true,
      interaction: "expand",
      content: {
        type: "chart",
        chartType: "horizontal-bars",
        title: "Top exceptions",
      },
    },
    {
      size: "md",
      visible: true,
      interaction: "expand",
      content: {
        type: "chart",
        chartType: "composed",
        title: "Daily breach trend",
      },
    },
    {
      size: "sm",
      visible: true,
      interaction: "expand",
      content: { type: "chart", chartType: "area", title: "Open backlog" },
    },
    {
      size: "md",
      visible: true,
      interaction: "expand",
      content: {
        type: "chart",
        chartType: "stacked-bar",
        title: "Exceptions by team",
      },
    },
  ],
};

const riskCards: InsightCardData[] = [
  {
    title: "SLA breach rate",
    type: "kpi",
    chartType: "donut",
    size: "sm",
    interaction: "static",
    kpiNumber: "4.1%",
    kpiBadge: "↑0.3 pts",
    kpiDescription: "Invoices that missed SLA threshold this period.",
    donutPercent: 0.041,
  },
  {
    title: "Top exceptions",
    type: "chart",
    chartType: "horizontal-bars",
    size: "md",
    interaction: "expand",
    expandContent: {
      summary:
        "Top 2 exception types account for 65% of all manual intervention",
      details: [
        "Add PO validation gate at invoice submission to block missing-PO invoices upstream",
        "Route amount mismatches by threshold: auto-approve below $50, human review above",
        "Vendor not-in-system errors doubled last month — review ERP onboarding gaps",
      ],
    },
    bars: [
      { label: "Missing PO number", value: 38 },
      { label: "Amount mismatch", value: 27 },
      { label: "Duplicate invoice", value: 19 },
      { label: "Vendor not in system", value: 11 },
      { label: "Approval timeout", value: 5 },
    ],
  },
  {
    title: "Daily breach trend",
    type: "chart",
    chartType: "composed",
    size: "md",
    interaction: "expand",
    expandContent: {
      summary:
        "Wednesday breach rate exceeded the 5% SLA threshold again this week",
      details: [
        "Midweek PO discrepancy batches are the likely driver — investigate batch timing",
        "Auto-escalation for items open >24 hours would contain Wednesday spikes",
        "Monday and Friday remain well below threshold — focus resources on midweek",
      ],
    },
    composedBars: [
      { label: "Mon", value: 2.9, target: 5.0 },
      { label: "Tue", value: 3.7, target: 5.0 },
      { label: "Wed", value: 5.8, target: 5.0 },
      { label: "Thu", value: 4.6, target: 5.0 },
      { label: "Fri", value: 3.2, target: 5.0 },
    ],
  },
  {
    title: "Open backlog",
    type: "chart",
    chartType: "area",
    size: "sm",
    interaction: "expand",
    expandContent: {
      summary:
        "Open backlog peaked in W5 and is now declining — but still above baseline",
      details: [
        "Recent dip in W7–W8 likely reflects improved Wednesday SLA handling",
        "Target: return to W1 baseline of ~42 open items within 2 weeks",
      ],
    },
    points: [42, 48, 55, 61, 74, 69, 63, 57],
  },
  {
    title: "Exceptions by team",
    type: "chart",
    chartType: "stacked-bar",
    size: "md",
    interaction: "expand",
    expandContent: {
      summary:
        "AP team accounts for 58% of open exceptions — PO validation gap is the root cause",
      details: [
        "Procurement exceptions spiked in W6 — correlates with new vendor onboarding wave",
        "Treasury team exceptions stable at low levels — no action required this period",
        "Coordinate cross-team exception review to reduce handoff delays between AP and Procurement",
      ],
    },
    stackedBars: [
      { label: "W5", segments: [44, 18, 12] },
      { label: "W6", segments: [48, 26, 11] },
      { label: "W7", segments: [51, 22, 10] },
      { label: "W8", segments: [46, 19, 9] },
    ],
    stackedLegend: ["AP", "Procurement", "Treasury"],
  },
];

export const riskPreset: AIScreen = {
  label: "Risk & Issues",
  headline:
    "Wednesday breach rate crossed 5% again — midweek PO batches remain the driver.",
  subhead:
    "SLA breach rate sits at 4.1%, up 0.3 pts this period. Open backlog peaked in W5 and is declining but above baseline. Missing PO numbers and amount mismatches account for 65% of exception volume.",
  layout: riskLayout,
  cards: riskCards,
};

// --- Opportunities & Growth ---

const opportunitiesLayout: LayoutConfig = {
  ...BASE_LAYOUT,
  insightCards: [
    {
      size: "sm",
      visible: true,
      interaction: "static",
      content: { type: "kpi", chartType: "donut", title: "Projected savings" },
    },
    {
      size: "md",
      visible: true,
      interaction: "expand",
      content: {
        type: "chart",
        chartType: "multi-line",
        title: "Initiative progress",
      },
    },
    {
      size: "md",
      visible: true,
      interaction: "expand",
      content: {
        type: "chart",
        chartType: "composed",
        title: "Savings trajectory",
      },
    },
    {
      size: "sm",
      visible: true,
      interaction: "expand",
      content: { type: "chart", chartType: "area", title: "Volume growth" },
    },
    {
      size: "md",
      visible: true,
      interaction: "expand",
      content: {
        type: "chart",
        chartType: "horizontal-bars",
        title: "ROI by initiative",
      },
    },
  ],
};

const opportunitiesCards: InsightCardData[] = [
  {
    title: "Projected savings",
    type: "kpi",
    chartType: "donut",
    size: "sm",
    interaction: "static",
    kpiNumber: "$2.4M",
    kpiBadge: "+$0.4M",
    kpiDescription: "Annualized savings from current automation initiatives.",
    donutPercent: 0.68,
  },
  {
    title: "Initiative progress",
    type: "chart",
    chartType: "multi-line",
    size: "md",
    interaction: "expand",
    expandContent: {
      summary: "All 3 initiatives tracking ahead of 8-week plan milestones",
      details: [
        "PO validation passed its 6-week payback point — fastest return in the portfolio",
        "E-invoicing ramping with 3 key suppliers; remaining 5 suppliers onboarding in Q3",
        "Vendor cleanup slower but with larger long-term savings potential than modeled",
      ],
    },
    multiLineSeries: [
      { name: "PO validation", points: [0, 22, 44, 66, 88, 108, 126, 142] },
      { name: "E-invoicing", points: [0, 12, 28, 48, 66, 85, 102, 118] },
      { name: "Vendor cleanup", points: [0, 7, 16, 28, 40, 52, 65, 78] },
    ],
    multiLineLabels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
  },
  {
    title: "Savings trajectory",
    type: "chart",
    chartType: "composed",
    size: "md",
    interaction: "expand",
    expandContent: {
      summary:
        "Actual savings tracking $0.4M above original projection through W8",
      details: [
        "PO validation outperformance is pulling total above the forecast line",
        "Maintain current pace through Q3 to hit $3.0M annualized by year-end",
        "New approval automation initiative could add further $0.6M if approved in Q3",
      ],
    },
    composedBars: [
      { label: "W1", value: 18, target: 14 },
      { label: "W2", value: 41, target: 32 },
      { label: "W3", value: 88, target: 72 },
      { label: "W4", value: 142, target: 120 },
      { label: "W5", value: 194, target: 168 },
      { label: "W6", value: 245, target: 216 },
      { label: "W7", value: 293, target: 264 },
      { label: "W8", value: 338, target: 312 },
    ],
  },
  {
    title: "Volume growth",
    type: "chart",
    chartType: "area",
    size: "sm",
    interaction: "expand",
    expandContent: {
      summary:
        "15% sustained volume growth for 8 consecutive weeks without added headcount",
      details: [
        "Automation is absorbing new volume — capacity headroom estimated at +22% before intervention",
        "Review Q3 seasonal patterns — prior year showed compression in Jul–Aug",
      ],
    },
    points: [208, 218, 229, 238, 251, 263, 276, 288, 301, 316, 329, 344],
  },
  {
    title: "ROI by initiative",
    type: "chart",
    chartType: "horizontal-bars",
    size: "md",
    interaction: "expand",
    expandContent: {
      summary:
        "PO validation delivers highest ROI by a wide margin — expansion is the logical next step",
      details: [
        "PO approval automation uses the same infrastructure — estimated 3-week implementation",
        "Vendor consolidation ROI appears lower but compounds over multi-year contracts",
        "Dedup detection ROI understated — indirect savings from reduced dispute resolution not yet counted",
      ],
    },
    bars: [
      { label: "PO validation", value: 58 },
      { label: "E-invoicing", value: 41 },
      { label: "Vendor cleanup", value: 29 },
      { label: "Dedup detection", value: 21 },
      { label: "Approval routing", value: 14 },
    ],
  },
];

export const opportunitiesPreset: AIScreen = {
  label: "Opportunities",
  headline:
    "$2.4M in annualized savings on track — actual results running $0.4M above forecast.",
  subhead:
    "PO validation passed its 6-week payback point. Volume is up ↑15% for 8 consecutive weeks without added headcount. A new approval automation initiative could add $0.6M if approved in Q3.",
  layout: opportunitiesLayout,
  cards: opportunitiesCards,
};

// --- Intent detection ---

export function detectLayoutIntent(query: string): AIScreen | null {
  const q = query.toLowerCase();
  if (/perform|throughput|efficienc|speed|velocit|process|cycle/.test(q))
    return performancePreset;
  if (/risk|issue|problem|anomal|exception|breach|alert|fail|sla/.test(q))
    return riskPreset;
  if (
    /opportunit|growth|trend|improve|potential|saving|upside|decision/.test(q)
  )
    return opportunitiesPreset;
  return null;
}
