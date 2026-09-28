"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SignalBars } from "./confidence-signal-bars";
import { ConfidenceSignalChip } from "./confidence-signal-chip";
import { ConfidenceSignalCta } from "./confidence-signal-cta";
import { ConfidenceSignalFactors } from "./confidence-signal-factors";
import {
  type ConfidenceCta,
  type ConfidenceFactor,
  LEVEL_CONFIG,
} from "./confidence-signal-levels";

interface ConfidenceSignalBaseProps
  extends Omit<React.ComponentProps<"button">, "children"> {
  /** icon only ("min"), icon + short label ("med"), icon + full label ("max") */
  variant?: "min" | "med" | "max";
  /** Explanation shown on hover and in the popover. Defaults to a per-level explanation. */
  explanation?: string;
  /** Factor breakdown shown in the popover body. */
  factors?: ConfidenceFactor[];
  /** Link to an audit trail / source. Appears at any confidence level. */
  explainCta?: ConfidenceCta;
  /** Play the one-time "acquire" bar animation when the value first resolves. */
  animateIn?: boolean;
}

export type ConfidenceSignalProps = ConfidenceSignalBaseProps &
  (
    | { level: "high" | "unknown"; nextStep?: ConfidenceCta }
    // "medium" and "low" must always give the user a next step.
    | { level: "medium" | "low"; nextStep: ConfidenceCta }
  );

/**
 * The explanation is a Tooltip so hovering stays cheap and consistent with the
 * rest of the system. Factors and CTAs need a Popover instead: they are
 * interactive, and a tooltip's contents are not reachable by keyboard.
 */
function ConfidenceSignal({
  level,
  variant = "med",
  explanation,
  factors,
  explainCta,
  nextStep,
  animateIn = false,
  className,
  ...props
}: ConfidenceSignalProps) {
  const { t } = useTranslation();
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const config = LEVEL_CONFIG[level];
  const accessibleLabel = t(config.labelKey, {
    defaultValue: config.labelText,
  });
  const resolvedExplanation =
    explanation ??
    t(config.explanationKey, { defaultValue: config.explanationText });
  // "min" is icon-only, so it carries no visible label.
  const label = {
    min: "",
    med: t(config.shortLabelKey, { defaultValue: config.shortLabelText }),
    max: accessibleLabel,
  }[variant];

  const hasDetails =
    Boolean(factors && factors.length > 0) ||
    Boolean(explainCta) ||
    Boolean(nextStep);

  const chip = (
    <ConfidenceSignalChip
      level={level}
      label={label}
      accessibleLabel={accessibleLabel}
      animateIn={animateIn}
      interactive={hasDetails}
      className={className}
      {...props}
    />
  );

  // Suppressed while the popover is open so the two never stack.
  const tooltip = (
    <Tooltip open={tooltipOpen && !detailsOpen} onOpenChange={setTooltipOpen}>
      <TooltipTrigger asChild>
        {hasDetails ? <PopoverTrigger asChild>{chip}</PopoverTrigger> : chip}
      </TooltipTrigger>
      <TooltipContent className="max-w-56">
        {resolvedExplanation}
      </TooltipContent>
    </Tooltip>
  );

  if (!hasDetails) return tooltip;

  // Clear the tooltip alongside the popover. Without this it keeps whatever
  // state it had before the popover opened, so dismissing the popover can flash
  // the tooltip back open even when the pointer has long since moved away.
  const handleDetailsOpenChange = (open: boolean) => {
    setDetailsOpen(open);
    if (!open) setTooltipOpen(false);
  };

  return (
    <Popover open={detailsOpen} onOpenChange={handleDetailsOpenChange}>
      {tooltip}
      <PopoverContent align="start" className="flex w-64 flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-muted-foreground">
            <SignalBars level={level} />
          </span>
          <span className="text-sm font-medium text-foreground">
            {accessibleLabel}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {resolvedExplanation}
        </p>

        {factors && factors.length > 0 && (
          <ConfidenceSignalFactors factors={factors} />
        )}

        {explainCta && <ConfidenceSignalCta cta={explainCta} />}

        {nextStep && (
          <div className={explainCta ? "border-t border-border pt-3" : ""}>
            <ConfidenceSignalCta cta={nextStep} />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { ConfidenceSignal, SignalBars };
export type {
  ConfidenceCta,
  ConfidenceFactor,
  ConfidenceLevel,
} from "./confidence-signal-levels";
