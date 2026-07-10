"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";
import { SignalBars } from "./confidence-signal-bars";
import { type ConfidenceLevel, LEVEL_CONFIG } from "./confidence-signal-levels";

export interface ConfidenceSignalChipProps
  extends Omit<React.ComponentProps<"button">, "children"> {
  level: ConfidenceLevel;
  /** Visible label. Omit for the icon-only (`min`) variant. */
  label?: string;
  /** Full level name, always announced to assistive tech. */
  accessibleLabel: string;
  /** Play the one-time "acquire" bar animation. */
  animateIn?: boolean;
  /** Whether the chip opens a details popover, which drives the cursor. */
  interactive?: boolean;
}

function ConfidenceSignalChip({
  level,
  label,
  accessibleLabel,
  animateIn = false,
  interactive = false,
  className,
  ...props
}: ConfidenceSignalChipProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        LEVEL_CONFIG[level].textClass,
        interactive && "cursor-pointer",
        className,
      )}
      // Before the spread, so a caller can supply a more contextual label
      // ("Confidence for Acme Health Plan: high") without losing the default.
      aria-label={accessibleLabel}
      {...props}
      // After the spread. `type` is locked because a chip that inherits
      // `type="submit"` would submit any form it sits in. `data-slot` is locked
      // because as a Tooltip/Popover trigger this chip is cloned with the
      // trigger's own `data-slot`, which would otherwise mask its identity.
      type="button"
      data-slot="confidence-signal"
      data-level={level}
    >
      <SignalBars level={level} animateIn={animateIn} />
      {label}
    </button>
  );
}

export { ConfidenceSignalChip };
