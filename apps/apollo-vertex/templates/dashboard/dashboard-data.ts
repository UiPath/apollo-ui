export interface InsightCardData {
  title: string;
  type: "kpi" | "chart";
  chartType:
    | "donut"
    | "horizontal-bars"
    | "sparkline"
    | "area"
    | "stacked-bar"
    | "composed"
    | "multi-line";
  size?: "sm" | "md" | "lg";
  interaction?: "static" | "expand" | "navigate";
  // Navigate config
  navigateTo?: string;
  // Expand config — additional content shown when card is expanded
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
  // Composed chart data (bars + optional target line)
  composedBars?: { label: string; value: number; target?: number }[];
  // Multi-line chart data
  multiLineSeries?: { name: string; points: number[] }[];
  multiLineLabels?: string[];
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
  insightCards: InsightCardData[];
}

export const defaultDataset: DashboardDataset = {
  name: "Loan Setup",
  brandName: "UiPath",
  brandLine: "Vertical Solutions",
  dashboardTitle: "Product",
  badgeText: "Experimental",
  greeting: "Good morning, Peter",
  headline: "Loan volume scales as setup time drops by 3.5 days.",
  subhead:
    "Setup time declined ↓21% month over month while volume increased ↑18%.",
  chartLabels: { y: ["200", "150", "100", "50"], target: "Target" },
  promptPlaceholder:
    "What would you like to understand about loan performance?",
  promptSuggestions: [
    "Show me top risk factors",
    "Compare Q1 vs Q2 performance",
  ],
  insightCards: [
    {
      title: "Upfront decision efficiency",
      type: "kpi",
      chartType: "donut",
      size: "sm",
      interaction: "static",
      kpiNumber: "94.2%",
      kpiBadge: "+6.8%",
      kpiDescription: "Loans finalized on first review without rework.",
    },
    {
      title: "Top issues",
      type: "chart",
      chartType: "horizontal-bars",
      size: "md",
      interaction: "expand",
      expandContent: {
        summary: "Risk flags have increased 12% this quarter",
        details: ["Review underwriting criteria", "Update risk scoring model"],
      },
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
      size: "md",
      interaction: "expand",
      expandContent: {
        summary: "Weekly volume trending up with stable rejection rates",
        details: [
          "Monitor Thursday spike pattern",
          "Review rejected applications",
        ],
      },
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
      size: "sm",
      interaction: "static",
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
  dashboardTitle: "Order fulfillment",
  badgeText: "Experimental",
  greeting: "Good morning, Peter",
  headline:
    "Order volume climbs as delivery performance improves, but fit-related returns remain the biggest drag on margin.",
  subhead:
    "Orders shipped increased ↑26% month over month while on-time delivery improved ↑2.4%, with size and fit issues now driving the largest share of returns.",
  chartLabels: { y: ["600", "450", "300", "150"], target: "Target" },
  promptPlaceholder:
    "What would you like to understand about order fulfillment?",
  promptSuggestions: [
    "Why are fit-related returns increasing?",
    "Show me products driving return volume",
    "Compare warehouse performance",
    "Which orders are most at risk of delay?",
  ],
  insightCards: [
    {
      title: "On-time delivery rate",
      type: "kpi",
      chartType: "donut",
      size: "sm",
      interaction: "navigate",
      kpiNumber: "97.1%",
      kpiBadge: "+2.4%",
      kpiDescription:
        "Orders delivered within promised windows, supported by lower carrier delays and faster pick-pack turnaround.",
    },
    {
      title: "Top issues",
      type: "chart",
      chartType: "horizontal-bars",
      size: "md",
      interaction: "expand",
      expandContent: {
        summary:
          "Return-related friction is now concentrated in product fit, transit handling, and expectation gaps, with apparel and footwear accounting for the highest exception volume.",
        details: [
          "Investigate top SKUs contributing to wrong size and fit returns",
          "Review packaging and carrier handoff for damage-related issues by warehouse",
          "Use AI prompts to explain issue concentration by category, region, and fulfillment center",
        ],
      },
      bars: [
        { label: "Wrong size/fit", value: 39 },
        { label: "Damaged in transit", value: 23 },
        { label: "Not as described", value: 18 },
        { label: "Late delivery", value: 13 },
        { label: "Changed mind", value: 7 },
      ],
    },
    {
      title: "Pipeline",
      type: "chart",
      chartType: "stacked-bar",
      size: "md",
      interaction: "expand",
      expandContent: {
        summary:
          "Fulfillment volume builds steadily through the week, with the highest shipped volume on Thursday and Friday and a midweek rise in processing backlog.",
        details: [
          "Monitor Wednesday processing buildup for labor or inventory bottlenecks",
          "Review Thursday and Friday shipment spikes by warehouse and carrier",
          "Use AI prompts to identify whether growth is concentrated in apparel, footwear, or home goods",
        ],
      },
      stackedBars: [
        { label: "Mon", segments: [188, 46, 11] },
        { label: "Tue", segments: [204, 41, 13] },
        { label: "Wed", segments: [198, 57, 14] },
        { label: "Thu", segments: [236, 38, 15] },
        { label: "Fri", segments: [249, 43, 16] },
      ],
      stackedLegend: ["Shipped", "Processing", "Returned"],
    },
    {
      title: "Customer satisfaction",
      type: "kpi",
      chartType: "donut",
      size: "sm",
      interaction: "navigate",
      kpiNumber: "4.6",
      kpiBadge: "+0.2",
      kpiDescription:
        "Average rating remains strong, though recent feedback highlights sizing inconsistency and occasional packaging damage.",
    },
  ],
};

export const invoiceProcessingDataset: DashboardDataset = {
  name: "Invoice Processing",
  brandName: "UiPath",
  brandLine: "Vertical Solutions",
  dashboardTitle: "Invoice processing",
  badgeText: "Experimental",
  greeting: "Good morning, Peter",
  headline:
    "Straight-through processing hits 78% as exception volume drops for the third consecutive week.",
  subhead:
    "STP rate improved ↑5.2 pts month over month while average cycle time compressed from 3.1 to 1.8 days. Missing PO numbers remain the primary exception driver.",
  chartLabels: { y: ["400", "300", "200", "100"], target: "Target" },
  promptPlaceholder:
    "What would you like to understand about invoice processing?",
  promptSuggestions: [
    "What's driving the exception spike on Wednesdays?",
    "Show me vendor-level exception breakdown",
    "Which departments have the longest approval cycles?",
    "Forecast next week's processing volume",
  ],
  insightCards: [
    {
      title: "Straight-through rate",
      type: "kpi",
      chartType: "donut",
      size: "sm",
      interaction: "static",
      kpiNumber: "78.4%",
      kpiBadge: "+5.2%",
      kpiDescription:
        "Invoices processed end-to-end without human intervention.",
    },
    {
      title: "Top exceptions",
      type: "chart",
      chartType: "horizontal-bars",
      size: "md",
      interaction: "expand",
      expandContent: {
        summary:
          "Exception volume is down 14% month over month, but missing PO numbers continue to be the leading driver of manual intervention.",
        details: [
          "Coordinate with procurement to enforce PO-first ordering workflows",
          "Review ERP vendor master for onboarding gaps causing vendor-not-found errors",
          "Escalate recurring approval timeout patterns to department heads",
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
      title: "Weekly pipeline",
      type: "chart",
      chartType: "stacked-bar",
      size: "md",
      interaction: "expand",
      expandContent: {
        summary:
          "End-of-week volume spikes align with supplier payment terms, with Thursday and Friday handling the highest throughput. Wednesday shows the most on-hold exceptions.",
        details: [
          "Review staffing capacity ahead of Thursday and Friday peak volume",
          "Investigate Wednesday on-hold spike — likely tied to midweek PO discrepancies",
          "Assess whether Monday pending volume reflects unresolved Friday carryover",
        ],
      },
      stackedBars: [
        { label: "Mon", segments: [312, 48, 24] },
        { label: "Tue", segments: [338, 42, 19] },
        { label: "Wed", segments: [295, 61, 28] },
        { label: "Thu", segments: [374, 33, 17] },
        { label: "Fri", segments: [351, 44, 21] },
      ],
      stackedLegend: ["Processed", "Pending", "On hold"],
    },
    {
      title: "On-time payment rate",
      type: "kpi",
      chartType: "donut",
      size: "sm",
      interaction: "static",
      kpiNumber: "96.3%",
      kpiBadge: "+2.1%",
      kpiDescription:
        "Invoices approved and scheduled for payment within agreed supplier terms.",
    },
  ],
};

export const datasetPresets: Record<string, DashboardDataset> = {
  default: defaultDataset,
  ecommerce: ecommerceDataset,
  invoiceProcessing: invoiceProcessingDataset,
};
