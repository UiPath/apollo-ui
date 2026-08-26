"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApprovalStep } from "../data/supplier-cases";

const DOT_TONE: Record<ApprovalStep["state"], string> = {
  done: "bg-success text-white",
  current: "bg-warning text-white",
  pending: "bg-muted-foreground/40 text-background",
};

interface ApprovalStepsProps {
  steps: ApprovalStep[];
}

/**
 * Numbered because these steps genuinely block each other. The four-eyes
 * approval cannot start before the verification lands, and the system of record
 * is not touched until both are done.
 */
export function ApprovalSteps({ steps }: ApprovalStepsProps) {
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;

        return (
          <li key={step.title} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  DOT_TONE[step.state],
                )}
                aria-hidden
              >
                {step.state === "done" ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : (
                  i + 1
                )}
              </span>
              {!last && <span className="w-px flex-1 bg-border" />}
            </div>

            <div className={cn("min-w-0", last ? "pb-0" : "pb-4")}>
              <p
                className={cn(
                  "text-sm",
                  step.state === "pending"
                    ? "text-muted-foreground"
                    : "font-medium text-foreground",
                )}
              >
                {step.title}
                {step.state === "current" && (
                  <span className="sr-only"> (current step)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{step.sub}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
