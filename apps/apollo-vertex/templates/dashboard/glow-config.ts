export interface GlowConfig {
  start: string;
  end: string;
  containerOpacity: number;
  fillOpacity: number;
  startStopOpacity: number;
  endStopOpacity: number;
  endOffset: number;
}

export interface CardGradient {
  enabled: boolean;
  start: string;
  end: string;
  angle: number;
  opacity: number;
}

export interface CardConfig {
  overviewBg: string;
  overviewOpacity: number;
  overviewGradient: CardGradient;
  insightBg: string;
  insightOpacity: number;
  insightGradient: CardGradient;
  promptBg: string;
  promptOpacity: number;
  promptGradient: CardGradient;
  borderVisible: boolean;
  backdropBlur: boolean;
}

export const defaultLightGlow: GlowConfig = {
  start: "var(--insight-500)",
  end: "var(--primary-400)",
  containerOpacity: 70,
  fillOpacity: 0.3,
  startStopOpacity: 1,
  endStopOpacity: 1,
  endOffset: 0.35,
};

export const defaultDarkGlow: GlowConfig = {
  start: "var(--insight-700)",
  end: "var(--primary-600)",
  containerOpacity: 45,
  fillOpacity: 1,
  startStopOpacity: 1,
  endStopOpacity: 0.4,
  endOffset: 0.5,
};

export type CardSize = "sm" | "md" | "lg";

export type InsightCardType = "kpi" | "chart";
export type ChartType =
  | "donut"
  | "horizontal-bars"
  | "sparkline"
  | "area"
  | "stacked-bar";

export interface InsightCardContent {
  type: InsightCardType;
  chartType: ChartType;
  title: string;
}

export interface InsightCardConfig {
  size: CardSize;
  visible: boolean;
  content: InsightCardContent;
}

export interface LayoutConfig {
  gap: number;
  overviewRatio: number;
  promptRatio: number;
  insightCards: [
    InsightCardConfig,
    InsightCardConfig,
    InsightCardConfig,
    InsightCardConfig,
  ];
  padding: number;
  containerBg: string;
}

export const defaultLayout: LayoutConfig = {
  gap: 4,
  overviewRatio: 4,
  promptRatio: 1,
  insightCards: [
    {
      size: "sm",
      visible: true,
      content: {
        type: "kpi",
        chartType: "donut",
        title: "Upfront decision efficiency",
      },
    },
    {
      size: "md",
      visible: true,
      content: {
        type: "chart",
        chartType: "horizontal-bars",
        title: "Top issues",
      },
    },
    {
      size: "md",
      visible: true,
      content: {
        type: "chart",
        chartType: "stacked-bar",
        title: "Pipeline",
      },
    },
    {
      size: "sm",
      visible: true,
      content: {
        type: "kpi",
        chartType: "donut",
        title: "SLA compliance",
      },
    },
  ],
  padding: 24,
  containerBg: "none",
};

const defaultGradient: CardGradient = {
  enabled: false,
  start: "var(--insight-500)",
  end: "var(--primary-400)",
  angle: 135,
  opacity: 100,
};

export const insightOptions = [
  { label: "300", value: "var(--insight-300)" },
  { label: "400", value: "var(--insight-400)" },
  { label: "500", value: "var(--insight-500)" },
  { label: "600", value: "var(--insight-600)" },
  { label: "700", value: "var(--insight-700)" },
  { label: "800", value: "var(--insight-800)" },
  { label: "900", value: "var(--insight-900)" },
];

export const primaryOptions = [
  { label: "300", value: "var(--primary-300)" },
  { label: "400", value: "var(--primary-400)" },
  { label: "500", value: "var(--primary-500)" },
  { label: "600", value: "var(--primary-600)" },
  { label: "700", value: "var(--primary-700)" },
  { label: "800", value: "var(--primary-800)" },
  { label: "900", value: "var(--primary-900)" },
];

export const cardTypeOptions = [
  { label: "KPI", value: "kpi" },
  { label: "Chart", value: "chart" },
];

export const chartTypeOptions = [
  { label: "Donut", value: "donut" },
  { label: "Horizontal Bars", value: "horizontal-bars" },
  { label: "Sparkline", value: "sparkline" },
  { label: "Area", value: "area" },
  { label: "Stacked Bar", value: "stacked-bar" },
];

export const bgColorOptions = [
  { label: "white", value: "white" },
  { label: "sidebar", value: "sidebar" },
  { label: "card", value: "card" },
  { label: "background", value: "background" },
  { label: "muted", value: "muted" },
];

export function getInsightCardClasses(content: InsightCardContent): {
  cardClassName: string;
  contentClassName: string;
} {
  if (content.type === "kpi") {
    return {
      cardClassName: "!gap-4",
      contentClassName: "flex-1 flex flex-col",
    };
  }
  const isBarChart = content.chartType === "horizontal-bars";
  return {
    cardClassName: content.chartType === "donut" ? "!gap-0" : "",
    contentClassName: isBarChart ? "flex-1" : "flex-1 flex flex-col",
  };
}

export const defaultDarkCards: CardConfig = {
  overviewBg: "sidebar",
  overviewOpacity: 69,
  overviewGradient: { ...defaultGradient, opacity: 30 },
  insightBg: "sidebar",
  insightOpacity: 54,
  insightGradient: { ...defaultGradient },
  promptBg: "sidebar",
  promptOpacity: 80,
  promptGradient: { ...defaultGradient },
  borderVisible: false,
  backdropBlur: true,
};
