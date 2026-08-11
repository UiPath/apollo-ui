"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CHECK_LABEL, type DecisionCheck } from "./data";

/**
 * The band ("What I checked" / count) and the four checks as a wrapping
 * chip row — restored to the compact expandable treatment this section
 * used before the card layout port (a four-item list with a title and a
 * description line each cost eight lines to carry four facts, and was the
 * main source of the card's height). Selecting a chip expands its detail
 * beneath the row; only one is expanded at a time, and none by default.
 * Pass icons stay neutral so exception is the only color in this row —
 * amber (the warning token) marking an exception only means something if
 * nothing else here is also colored. The count is always computed from
 * `checks`, never a separate authored number.
 */
export function DecisionChecks({ checks }: { checks: DecisionCheck[] }) {
  const [expandedKey, setExpandedKey] = useState<DecisionCheck["key"] | null>(
    null,
  );
  const cleared = checks.filter((check) => check.status === "pass").length;
  const expanded = checks.find((check) => check.key === expandedKey);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-1.5 text-sm">
        <span className="font-medium text-foreground">What I checked</span>
        <span className="text-xs text-muted-foreground">
          · {cleared} of {checks.length} cleared
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {checks.map((check) => {
          const isSelected = check.key === expandedKey;
          const Icon = check.status === "pass" ? CheckCircle2 : AlertTriangle;
          return (
            <button
              key={check.key}
              type="button"
              aria-expanded={isSelected}
              onClick={() => setExpandedKey(isSelected ? null : check.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-foreground transition-colors",
                isSelected
                  ? "border-primary/40 bg-primary/8"
                  : "border-border hover:bg-accent",
              )}
            >
              <Icon
                className={cn(
                  "size-3.5 shrink-0",
                  check.status === "pass"
                    ? "text-muted-foreground"
                    : "text-warning",
                )}
                aria-hidden
              />
              {CHECK_LABEL[check.key]}
            </button>
          );
        })}
      </div>
      {expanded != null && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">{expanded.detail}</p>
        </div>
      )}
    </div>
  );
}
