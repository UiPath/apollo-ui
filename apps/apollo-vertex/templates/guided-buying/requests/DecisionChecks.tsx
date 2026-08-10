"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHECK_LABEL, type DecisionCheck } from "./data";

/**
 * The band ("What I checked" / count) and the four checks beneath it. Pass
 * icons stay neutral so exception is the only color in this list — amber
 * (the warning token) marking an exception only means something if nothing
 * else in the list is also colored. The count is always computed from
 * `checks`, never a separate authored number.
 */
export function DecisionChecks({ checks }: { checks: DecisionCheck[] }) {
  const cleared = checks.filter((check) => check.status === "pass").length;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-1.5 text-sm">
        <span className="font-medium text-foreground">What I checked</span>
        <span className="text-xs text-muted-foreground">
          · {cleared} of {checks.length} cleared
        </span>
      </div>
      <div className="space-y-4">
        {checks.map((check) => {
          const Icon = check.status === "pass" ? CheckCircle2 : AlertTriangle;
          return (
            <div key={check.key} className="flex items-start gap-2.5">
              <Icon
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  check.status === "pass"
                    ? "text-muted-foreground"
                    : "text-warning",
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">
                  {CHECK_LABEL[check.key]}
                </p>
                <p className="text-xs text-muted-foreground">{check.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
