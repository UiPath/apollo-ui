import { Check } from "lucide-react";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

// Exact vocabulary — must match the Guided Buying documentation.
const STEPS = ["Intake", "Selection", "Review", "Track"] as const;

type Step = (typeof STEPS)[number];

interface StepIndicatorProps {
  /** The currently active step. */
  current?: Step;
}

/** Slim progress nav for the catalog path: Intake → Selection → Review → Track. */
export function StepIndicator({ current = "Selection" }: StepIndicatorProps) {
  const currentIndex = STEPS.indexOf(current);

  return (
    <nav aria-label="Progress">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <Fragment key={step}>
              <li className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                    isComplete && "bg-primary text-primary-foreground",
                    isCurrent &&
                      "bg-primary/15 text-primary ring-1 ring-primary/40",
                    !isComplete &&
                      !isCurrent &&
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {isComplete ? (
                    <Check className="size-3" aria-hidden />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  aria-current={isCurrent ? "step" : false}
                  className={cn(
                    "text-sm transition-colors",
                    isCurrent
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {step}
                </span>
              </li>
              {index < STEPS.length - 1 && (
                <li aria-hidden className="h-px w-6 bg-border sm:w-10" />
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
