/* eslint-disable max-lines -- data-only token file generated from registry.json */
/**
 * Design token data extracted from registry.json (apollo-vertex-theme).
 * This is the authoritative token set for Apollo Vertex — do not edit manually.
 * To update tokens, edit registry.json and regenerate.
 */

export interface ColorToken {
  token: string;
  label: string;
  description: string;
  lightValue: string;
  darkValue: string;
}

export interface ColorGroup {
  heading: string;
  tokens: ColorToken[];
}

export interface ShadowToken {
  token: string;
  label: string;
  lightValue: string;
  darkValue: string;
}

export interface FontToken {
  variable: string;
  label: string;
  stack: string;
  specimen: string;
}

export interface SpacingStep {
  step: string;
  px: number;
  rem: string;
}

// ---------------------------------------------------------------------------
// Color groups
// ---------------------------------------------------------------------------

export const colorGroups: ColorGroup[] = [
  {
    heading: "Backgrounds & Surfaces",
    tokens: [
      {
        token: "background",
        label: "Background",
        description: "Page background",
        lightValue: "oklch(1 0 89.88)",
        darkValue: "oklch(0.21 0.03 258.5)",
      },
      {
        token: "card",
        label: "Card",
        description: "Card surface",
        lightValue: "oklch(1 0 89.88)",
        darkValue: "oklch(0.233 0.036 254.7)",
      },
      {
        token: "card-foreground",
        label: "Card Foreground",
        description: "Text on card",
        lightValue: "oklch(0.2394 0.0455 252.45)",
        darkValue: "oklch(0.9525 0.011 225.98)",
      },
      {
        token: "popover",
        label: "Popover",
        description: "Popover/dropdown surface",
        lightValue: "oklch(1 0 89.88)",
        darkValue: "oklch(0.21 0.03 258.5)",
      },
      {
        token: "popover-foreground",
        label: "Popover Foreground",
        description: "Text in popovers",
        lightValue: "oklch(0.2394 0.0455 252.45)",
        darkValue: "oklch(0.985 0 0)",
      },
      {
        token: "muted",
        label: "Muted",
        description: "Muted/subdued surface",
        lightValue: "oklch(0.963 0.0062 255.48)",
        darkValue: "oklch(0.2648 0.0329 254.38)",
      },
      {
        token: "muted-foreground",
        label: "Muted Foreground",
        description: "Subdued text",
        lightValue: "oklch(0.4594 0.028 264.25)",
        darkValue: "oklch(0.72 0.03 254.38)",
      },
    ],
  },
  {
    heading: "Foreground & Text",
    tokens: [
      {
        token: "foreground",
        label: "Foreground",
        description: "Primary text color",
        lightValue: "oklch(0.2394 0.0455 252.45)",
        darkValue: "oklch(0.985 0 0)",
      },
      {
        token: "primary-foreground",
        label: "Primary Foreground",
        description: "Text on primary",
        lightValue: "oklch(1 0 89.88)",
        darkValue: "oklch(0.166 0.0283 203.34)",
      },
      {
        token: "secondary-foreground",
        label: "Secondary Foreground",
        description: "Text on secondary",
        lightValue: "oklch(0.2394 0.0455 252.45)",
        darkValue: "oklch(0.9416 0.0145 244.72)",
      },
      {
        token: "accent-foreground",
        label: "Accent Foreground",
        description: "Text on accent",
        lightValue: "oklch(0.2394 0.0455 252.45)",
        darkValue: "oklch(0.9416 0.0145 244.72)",
      },
    ],
  },
  {
    heading: "Brand & Interactive",
    tokens: [
      {
        token: "primary",
        label: "Primary",
        description: "Primary brand color",
        lightValue: "oklch(0.64 0.115 208)",
        darkValue: "oklch(0.69 0.112 207)",
      },
      {
        token: "primary-50",
        label: "Primary 50",
        description: "Lightest tint",
        lightValue: "oklch(0.95 0.035 218)",
        darkValue: "oklch(0.95 0.035 218)",
      },
      {
        token: "primary-100",
        label: "Primary 100",
        description: "",
        lightValue: "oklch(0.92 0.045 216)",
        darkValue: "oklch(0.92 0.045 216)",
      },
      {
        token: "primary-200",
        label: "Primary 200",
        description: "",
        lightValue: "oklch(0.86 0.060 214)",
        darkValue: "oklch(0.86 0.060 214)",
      },
      {
        token: "primary-300",
        label: "Primary 300",
        description: "",
        lightValue: "oklch(0.80 0.080 212)",
        darkValue: "oklch(0.80 0.080 212)",
      },
      {
        token: "primary-400",
        label: "Primary 400",
        description: "",
        lightValue: "oklch(0.75 0.100 210)",
        darkValue: "oklch(0.75 0.100 210)",
      },
      {
        token: "primary-500",
        label: "Primary 500",
        description: "Mid-point",
        lightValue: "oklch(0.69 0.112 207)",
        darkValue: "oklch(0.69 0.112 207)",
      },
      {
        token: "primary-600",
        label: "Primary 600",
        description: "Default primary",
        lightValue: "oklch(0.64 0.115 208)",
        darkValue: "oklch(0.64 0.115 208)",
      },
      {
        token: "primary-700",
        label: "Primary 700",
        description: "",
        lightValue: "oklch(0.60 0.125 210)",
        darkValue: "oklch(0.60 0.125 210)",
      },
      {
        token: "primary-800",
        label: "Primary 800",
        description: "",
        lightValue: "oklch(0.53 0.110 214)",
        darkValue: "oklch(0.53 0.110 214)",
      },
      {
        token: "primary-900",
        label: "Primary 900",
        description: "Darkest shade",
        lightValue: "oklch(0.46 0.095 220)",
        darkValue: "oklch(0.46 0.095 220)",
      },
      {
        token: "secondary",
        label: "Secondary",
        description: "Secondary interactive surface",
        lightValue: "oklch(0.9593 0.0069 247.9)",
        darkValue: "oklch(0.3927 0.0289 240.86)",
      },
      {
        token: "accent",
        label: "Accent",
        description: "Hover/focus accent surface",
        lightValue: "oklch(0.9593 0.0069 247.9 / 0.75)",
        darkValue: "oklch(0.3927 0.0289 240.86 / 0.75)",
      },
      {
        token: "brand-orange",
        label: "Brand Orange",
        description: "UiPath brand orange",
        lightValue: "#fa4616",
        darkValue: "#fa4616",
      },
    ],
  },
  {
    heading: "Insight",
    tokens: [
      {
        token: "insight-50",
        label: "Insight 50",
        description: "Lightest tint",
        lightValue: "oklch(0.96 0.03 277)",
        darkValue: "oklch(0.96 0.03 277)",
      },
      {
        token: "insight-100",
        label: "Insight 100",
        description: "",
        lightValue: "oklch(0.92 0.05 277)",
        darkValue: "oklch(0.92 0.05 277)",
      },
      {
        token: "insight-200",
        label: "Insight 200",
        description: "",
        lightValue: "oklch(0.86 0.09 277)",
        darkValue: "oklch(0.86 0.09 277)",
      },
      {
        token: "insight-300",
        label: "Insight 300",
        description: "",
        lightValue: "oklch(0.78 0.14 277)",
        darkValue: "oklch(0.78 0.14 277)",
      },
      {
        token: "insight-400",
        label: "Insight 400",
        description: "",
        lightValue: "oklch(0.70 0.19 277)",
        darkValue: "oklch(0.70 0.19 277)",
      },
      {
        token: "insight-500",
        label: "Insight 500",
        description: "Mid-point",
        lightValue: "oklch(0.62 0.22 277)",
        darkValue: "oklch(0.62 0.22 277)",
      },
      {
        token: "insight-600",
        label: "Insight 600",
        description: "Default insight",
        lightValue: "oklch(0.56 0.20 277)",
        darkValue: "oklch(0.56 0.20 277)",
      },
      {
        token: "insight-700",
        label: "Insight 700",
        description: "",
        lightValue: "oklch(0.48 0.17 277)",
        darkValue: "oklch(0.48 0.17 277)",
      },
      {
        token: "insight-800",
        label: "Insight 800",
        description: "",
        lightValue: "oklch(0.38 0.13 278)",
        darkValue: "oklch(0.38 0.13 278)",
      },
      {
        token: "insight-900",
        label: "Insight 900",
        description: "Darkest shade",
        lightValue: "oklch(0.30 0.10 278)",
        darkValue: "oklch(0.30 0.10 278)",
      },
    ],
  },
  {
    heading: "Status",
    tokens: [
      {
        token: "destructive",
        label: "Destructive",
        description: "Error/danger actions",
        lightValue: "oklch(0.62 0.150 18)",
        darkValue: "oklch(0.68 0.155 18)",
      },
      {
        token: "destructive-foreground",
        label: "Destructive Foreground",
        description: "Text on destructive",
        lightValue: "oklch(1 0 89.88)",
        darkValue: "oklch(0.166 0.0283 203.34)",
      },
      {
        token: "success",
        label: "Success",
        description: "Success state",
        lightValue: "oklch(0.57 0.105 152)",
        darkValue: "oklch(0.70 0.120 152)",
      },
      {
        token: "success-foreground",
        label: "Success Foreground",
        description: "Text on success",
        lightValue: "oklch(1 0 89.88)",
        darkValue: "oklch(0.166 0.0283 203.34)",
      },
      {
        token: "info",
        label: "Info",
        description: "Informational state",
        lightValue: "oklch(0.60 0.125 210)",
        darkValue: "oklch(0.69 0.112 207)",
      },
      {
        token: "info-foreground",
        label: "Info Foreground",
        description: "Text on info",
        lightValue: "oklch(1 0 89.88)",
        darkValue: "oklch(0.166 0.0283 203.34)",
      },
      {
        token: "warning",
        label: "Warning",
        description: "Warning state",
        lightValue: "oklch(0.80 0.1401 80.82)",
        darkValue: "oklch(0.6889 0.1401 80.82)",
      },
      {
        token: "warning-foreground",
        label: "Warning Foreground",
        description: "Text on warning",
        lightValue: "oklch(0.166 0.0283 203.34)",
        darkValue: "oklch(0.166 0.0283 203.34)",
      },
    ],
  },
  {
    heading: "Badge",
    tokens: [
      {
        token: "badge",
        label: "Badge",
        description: "Badge background",
        lightValue: "oklch(0.5995 0.0199 253.42)",
        darkValue: "oklch(0.7196 0.0135 255.53)",
      },
      {
        token: "badge-foreground",
        label: "Badge Foreground",
        description: "Badge text",
        lightValue: "oklch(1 0 89.88)",
        darkValue: "oklch(0.166 0.0283 203.34)",
      },
    ],
  },
  {
    heading: "Borders & Inputs",
    tokens: [
      {
        token: "border",
        label: "Border",
        description: "Default border color",
        lightValue: "oklch(0.9229 0.0065 252.13)",
        darkValue: "oklch(0.3068 0.0426 258.29)",
      },
      {
        token: "input",
        label: "Input",
        description: "Input border color",
        lightValue: "oklch(0.9229 0.0065 252.13)",
        darkValue: "oklch(0.3068 0.0426 258.29)",
      },
      {
        token: "ring",
        label: "Ring",
        description: "Focus ring color",
        lightValue: "oklch(0.64 0.115 208)",
        darkValue: "oklch(0.69 0.112 207)",
      },
    ],
  },
  {
    heading: "Charts",
    tokens: [
      {
        token: "chart-1",
        label: "Chart 1",
        description: "Primary chart color",
        lightValue: "oklch(0.64 0.115 208)",
        darkValue: "oklch(0.69 0.112 207)",
      },
      {
        token: "chart-2",
        label: "Chart 2",
        description: "Secondary chart color",
        lightValue: "oklch(0.61 0.145 285.3)",
        darkValue: "oklch(0.61 0.145 285.3)",
      },
      {
        token: "chart-3",
        label: "Chart 3",
        description: "Tertiary chart color",
        lightValue: "oklch(0.83 0.155 75.2)",
        darkValue: "oklch(0.83 0.155 75.2)",
      },
      {
        token: "chart-4",
        label: "Chart 4",
        description: "Quaternary chart color",
        lightValue: "oklch(0.72 0.18 320.8)",
        darkValue: "oklch(0.72 0.18 320.8)",
      },
      {
        token: "chart-5",
        label: "Chart 5",
        description: "Quinary chart color",
        lightValue: "oklch(0.68 0.15 245.5)",
        darkValue: "oklch(0.68 0.15 245.5)",
      },
    ],
  },
  {
    heading: "Sidebar",
    tokens: [
      {
        token: "sidebar",
        label: "Sidebar",
        description: "Sidebar background",
        lightValue: "oklch(0.9723 0.0074 260.73)",
        darkValue: "oklch(0.162 0.031 257.7)",
      },
      {
        token: "sidebar-foreground",
        label: "Sidebar Foreground",
        description: "Sidebar text",
        lightValue: "oklch(0.2394 0.0455 252.445)",
        darkValue: "oklch(0.9525 0.011 225.983)",
      },
      {
        token: "sidebar-primary",
        label: "Sidebar Primary",
        description: "Active nav item",
        lightValue: "oklch(0.64 0.115 208)",
        darkValue: "oklch(0.69 0.112 207)",
      },
      {
        token: "sidebar-primary-foreground",
        label: "Sidebar Primary Foreground",
        description: "Active nav text",
        lightValue: "oklch(0.166 0.0283 203.338)",
        darkValue: "oklch(0.166 0.0283 203.338)",
      },
      {
        token: "sidebar-accent",
        label: "Sidebar Accent",
        description: "Hover surface in sidebar",
        lightValue: "oklch(0.9593 0.0069 247.9)",
        darkValue: "oklch(0.3927 0.0289 240.86)",
      },
      {
        token: "sidebar-accent-foreground",
        label: "Sidebar Accent Foreground",
        description: "Text on sidebar hover",
        lightValue: "oklch(0.166 0.0283 203.338)",
        darkValue: "oklch(0.9525 0.011 225.983)",
      },
      {
        token: "sidebar-border",
        label: "Sidebar Border",
        description: "Sidebar dividers",
        lightValue: "oklch(0.9237 0.0133 262.378)",
        darkValue: "oklch(0.9525 0.011 225.983)",
      },
      {
        token: "sidebar-ring",
        label: "Sidebar Ring",
        description: "Focus ring in sidebar",
        lightValue: "oklch(0.64 0.115 208)",
        darkValue: "oklch(0.69 0.112 207)",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Shadow tokens
// ---------------------------------------------------------------------------

export const shadowTokens: ShadowToken[] = [
  {
    token: "shadow-2xs",
    label: "Shadow 2XS",
    lightValue: "0 0px 12px 0px hsl(220 13% 36% / 0.05)",
    darkValue: "0 0px 12px 0px hsl(0 0% 0% / 0.05)",
  },
  {
    token: "shadow-xs",
    label: "Shadow XS",
    lightValue: "0 0px 12px 0px hsl(220 13% 36% / 0.05)",
    darkValue: "0 0px 12px 0px hsl(0 0% 0% / 0.05)",
  },
  {
    token: "shadow-sm",
    label: "Shadow SM",
    lightValue:
      "0 0px 12px 0px hsl(220 13% 36% / 0.10), 0 1px 2px -1px hsl(220 13% 36% / 0.10)",
    darkValue:
      "0 0px 12px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)",
  },
  {
    token: "shadow",
    label: "Shadow (default)",
    lightValue:
      "0 0px 12px 0px hsl(220 13% 36% / 0.10), 0 1px 2px -1px hsl(220 13% 36% / 0.10)",
    darkValue:
      "0 0px 12px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)",
  },
  {
    token: "shadow-md",
    label: "Shadow MD",
    lightValue:
      "0 0px 12px 0px hsl(220 13% 36% / 0.10), 0 2px 4px -1px hsl(220 13% 36% / 0.10)",
    darkValue:
      "0 0px 12px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10)",
  },
  {
    token: "shadow-lg",
    label: "Shadow LG",
    lightValue:
      "0 0px 12px 0px hsl(220 13% 36% / 0.10), 0 4px 6px -1px hsl(220 13% 36% / 0.10)",
    darkValue:
      "0 0px 12px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10)",
  },
  {
    token: "shadow-xl",
    label: "Shadow XL",
    lightValue:
      "0 0px 12px 0px hsl(220 13% 36% / 0.10), 0 8px 10px -1px hsl(220 13% 36% / 0.10)",
    darkValue:
      "0 0px 12px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10)",
  },
  {
    token: "shadow-2xl",
    label: "Shadow 2XL",
    lightValue: "0 0px 12px 0px hsl(220 13% 36% / 0.25)",
    darkValue: "0 0px 12px 0px hsl(0 0% 0% / 0.25)",
  },
];

// ---------------------------------------------------------------------------
// Font tokens
// ---------------------------------------------------------------------------

export const fontTokens: FontToken[] = [
  {
    variable: "--font-sans",
    label: "Sans (Inter)",
    stack: "Inter, ui-sans-serif, sans-serif, system-ui",
    specimen: "The quick brown fox jumps over the lazy dog.",
  },
  {
    variable: "--font-mono",
    label: "Mono (IBM Plex Mono)",
    stack: "IBM Plex Mono, ui-monospace, monospace",
    specimen: 'const theme = "apollo-vertex";',
  },
];

// ---------------------------------------------------------------------------
// Spacing scale — Tailwind 4px base
// ---------------------------------------------------------------------------

export const spacingScale: SpacingStep[] = [
  { step: "0", px: 0, rem: "0rem" },
  { step: "0.5", px: 2, rem: "0.125rem" },
  { step: "1", px: 4, rem: "0.25rem" },
  { step: "1.5", px: 6, rem: "0.375rem" },
  { step: "2", px: 8, rem: "0.5rem" },
  { step: "2.5", px: 10, rem: "0.625rem" },
  { step: "3", px: 12, rem: "0.75rem" },
  { step: "3.5", px: 14, rem: "0.875rem" },
  { step: "4", px: 16, rem: "1rem" },
  { step: "5", px: 20, rem: "1.25rem" },
  { step: "6", px: 24, rem: "1.5rem" },
  { step: "7", px: 28, rem: "1.75rem" },
  { step: "8", px: 32, rem: "2rem" },
  { step: "9", px: 36, rem: "2.25rem" },
  { step: "10", px: 40, rem: "2.5rem" },
  { step: "11", px: 44, rem: "2.75rem" },
  { step: "12", px: 48, rem: "3rem" },
  { step: "14", px: 56, rem: "3.5rem" },
  { step: "16", px: 64, rem: "4rem" },
  { step: "20", px: 80, rem: "5rem" },
  { step: "24", px: 96, rem: "6rem" },
  { step: "28", px: 112, rem: "7rem" },
  { step: "32", px: 128, rem: "8rem" },
  { step: "36", px: 144, rem: "9rem" },
  { step: "40", px: 160, rem: "10rem" },
  { step: "44", px: 176, rem: "11rem" },
  { step: "48", px: 192, rem: "12rem" },
  { step: "52", px: 208, rem: "13rem" },
  { step: "56", px: 224, rem: "14rem" },
  { step: "60", px: 240, rem: "15rem" },
  { step: "64", px: 256, rem: "16rem" },
  { step: "72", px: 288, rem: "18rem" },
  { step: "80", px: 320, rem: "20rem" },
  { step: "96", px: 384, rem: "24rem" },
];
