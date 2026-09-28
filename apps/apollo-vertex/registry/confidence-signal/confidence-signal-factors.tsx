"use client";

import { cn } from "@/lib/utils";
import {
  type ConfidenceFactor,
  FACTOR_STATUS_CLASS,
} from "./confidence-signal-levels";

function ConfidenceSignalFactorRow({ factor }: { factor: ConfidenceFactor }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{factor.label}</span>
      <span
        className={cn(
          "text-xs font-medium",
          factor.status
            ? FACTOR_STATUS_CLASS[factor.status]
            : "text-foreground",
        )}
      >
        {factor.value}
      </span>
    </div>
  );
}

function ConfidenceSignalFactors({ factors }: { factors: ConfidenceFactor[] }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-border pt-3">
      {factors.map((factor) => (
        // Labels are not guaranteed unique, so pair label with value: two rows
        // that match on both are indistinguishable to the reader anyway.
        <ConfidenceSignalFactorRow
          key={`${factor.label}:${factor.value}`}
          factor={factor}
        />
      ))}
    </div>
  );
}

export { ConfidenceSignalFactors, ConfidenceSignalFactorRow };
