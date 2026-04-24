"use client";

import { FocusScope } from "@radix-ui/react-focus-scope";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { type ReactNode, useId } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingTourPopoverProps {
  /** Step title */
  title: string;
  /** Step body content */
  body: ReactNode;
  /** Optional tip/note section */
  tip?: string;
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether to show back button */
  showBack?: boolean;
  /** Back button handler */
  onBack: () => void;
  /** Next/Done button handler */
  onNext: () => void;
  /** Skip tour handler */
  onSkip: () => void;
  /** Whether this is the last step (changes "Next" to "Done") */
  isLastStep?: boolean;
  /** Custom label for the Next button */
  nextLabel?: string;
}

function OnboardingTourPopover({
  title,
  body,
  tip,
  currentStep,
  totalSteps,
  showBack = false,
  onBack,
  onNext,
  onSkip,
  isLastStep = false,
  nextLabel,
}: OnboardingTourPopoverProps) {
  const titleId = useId();
  return (
    <FocusScope asChild trapped loop>
      <div data-slot="onboarding-tour-popover" className="relative">
        {/* Gradient glow background */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none blur-xl"
          style={{
            background:
              "linear-gradient(112.44deg, rgba(108, 90, 239, 0.2) 31.16%, rgba(18, 203, 123, 0.1) 106.82%)",
          }}
        />

        <div
          className="relative w-full max-w-[360px] bg-card rounded-xl border border-border shadow-lg p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          {/* Progress bars */}
          <div className="flex gap-1.5 mb-5">
            {Array.from({ length: totalSteps }, (_, i) => `step-${i}`).map(
              (key, index) => (
                <div
                  key={key}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    index <= currentStep ? "bg-primary" : "bg-muted",
                  )}
                />
              ),
            )}
          </div>

          {/* Title */}
          <h3
            id={titleId}
            className="text-lg font-semibold text-foreground mb-2 leading-snug"
          >
            {title}
          </h3>

          {/* Body */}
          <div className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {body}
          </div>

          {/* Tip section */}
          {tip && (
            <div className="flex items-start gap-2.5 mb-4">
              <Lightbulb
                className="w-4 h-4 text-muted-foreground mt-1 shrink-0"
                strokeWidth={1.5}
              />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tip}
              </p>
            </div>
          )}

          {/* Navigation footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showBack && (
                <Button
                  variant="outline"
                  size="icon-lg"
                  onClick={onBack}
                  aria-label="Go back"
                >
                  <ArrowLeft />
                </Button>
              )}
              <Button onClick={onNext} className="px-8" autoFocus>
                {isLastStep ? "Done" : (nextLabel ?? "Next")}
              </Button>
            </div>

            {!isLastStep && (
              <Button
                variant="link"
                onClick={onSkip}
                className="text-muted-foreground"
              >
                {"Skip tour"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </FocusScope>
  );
}

export { OnboardingTourPopover };
export type { OnboardingTourPopoverProps };
