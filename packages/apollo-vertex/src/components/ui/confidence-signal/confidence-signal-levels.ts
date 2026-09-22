export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";

export interface ConfidenceFactor {
  /** Short label for the factor, e.g. "Historical accuracy" */
  label: string;
  /** Value or short note, e.g. "94% match" */
  value: string;
  /** Optional status tint for the value. */
  status?: "success" | "warning" | "error";
}

interface ConfidenceCtaBase {
  label: string;
}

/**
 * A CTA has to do something, so at least one of `href` and `onClick` is
 * required: a CTA with neither renders a control that looks interactive and
 * does nothing. `href` renders an anchor, so the target stays navigable,
 * middle-clickable, and copyable.
 */
export type ConfidenceCta = ConfidenceCtaBase &
  (
    | { href: string; onClick?: () => void }
    | { href?: undefined; onClick: () => void }
  );

/**
 * Per-level presentation and copy.
 *
 * Copy is a translation key plus the English source string. The key is what
 * the translation pipeline picks up from `locales/en.json`; the source string
 * is passed to `t` as `defaultValue` so the component still reads correctly
 * when it is dropped into an app that has not configured i18next.
 *
 * Bar colors stay as literal hues rather than theme tokens: the signal-bar
 * metaphor relies on a fixed green/amber/red ramp that reads the same in every
 * theme, the way a battery or wifi icon does.
 */
export const LEVEL_CONFIG = {
  high: {
    labelKey: "confidence_signal_high_label",
    labelText: "High confidence",
    shortLabelKey: "confidence_signal_high_short",
    shortLabelText: "High",
    explanationKey: "confidence_signal_high_explanation",
    explanationText: "The output is well-supported and reliable.",
    textClass: "text-success",
    filled: 3,
    solid: "#15803d",
    faded: "#bbf7d0",
  },
  medium: {
    labelKey: "confidence_signal_medium_label",
    labelText: "Medium confidence",
    shortLabelKey: "confidence_signal_medium_short",
    shortLabelText: "Medium",
    explanationKey: "confidence_signal_medium_explanation",
    explanationText: "Some uncertainty remains — review before acting.",
    // `--warning` is a light amber that fails contrast on a light background,
    // and `--warning-foreground` is near-black in both themes. Same split as
    // the outline Badge: the foreground token in light, the hue in dark.
    textClass: "text-warning-foreground dark:text-warning",
    filled: 2,
    solid: "#b45309",
    faded: "#fde68a",
  },
  low: {
    labelKey: "confidence_signal_low_label",
    labelText: "Low confidence",
    shortLabelKey: "confidence_signal_low_short",
    shortLabelText: "Low",
    explanationKey: "confidence_signal_low_explanation",
    explanationText: "Limited evidence — verify this before relying on it.",
    textClass: "text-destructive",
    filled: 1,
    solid: "#991b1b",
    faded: "#fecaca",
  },
  unknown: {
    labelKey: "confidence_signal_unknown_label",
    labelText: "Unknown confidence",
    shortLabelKey: "confidence_signal_unknown_short",
    shortLabelText: "Unknown",
    explanationKey: "confidence_signal_unknown_explanation",
    explanationText: "The system cannot determine an answer reliably.",
    textClass: "text-foreground",
    filled: 0,
    solid: "#9ca3af",
    faded: "#e5e7eb",
  },
} as const satisfies Record<ConfidenceLevel, unknown>;

export const FACTOR_STATUS_CLASS: Record<
  NonNullable<ConfidenceFactor["status"]>,
  string
> = {
  success: "text-success",
  warning: "text-warning-foreground dark:text-warning",
  error: "text-destructive",
};
