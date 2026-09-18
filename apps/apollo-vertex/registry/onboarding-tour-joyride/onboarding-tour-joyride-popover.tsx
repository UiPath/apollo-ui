"use client";

import { ArrowLeft, Lightbulb } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import type { TooltipRenderProps } from "react-joyride";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AiGlow } from "@/registry/ai-glow/ai-glow";

interface OnboardingTourJoyridePopoverData {
  /** Step title */
  title: string;
  /** Step body content */
  body: ReactNode;
  /** Optional tip/note section */
  tip?: string;
  /** Current step index within popover-type steps (0-based) */
  currentStep: number;
  /** Total popover-type steps */
  totalSteps: number;
  /** Whether to show back button */
  showBack?: boolean;
  /** Custom label for the Next button */
  nextLabel?: string;
}

interface OnboardingTourJoyridePopoverCardProps extends ComponentProps<"div"> {
  /** Step title */
  title: string;
  /** Step body content */
  body: ReactNode;
  /** Optional tip/note section */
  tip?: string;
  /** Current popover step index (0-based) */
  currentStep: number;
  /** Total popover steps */
  totalSteps: number;
  /** Whether to show the back button */
  showBack?: boolean;
  /** Back button handler (omit to hide, or use showBack=false) */
  onBack?: () => void;
  /** Primary (next/done) button handler */
  onNext?: () => void;
  /** Skip tour handler */
  onSkip?: () => void;
  /** Whether this is the last step (changes "Next" to "Done") */
  isLastStep?: boolean;
  /** Custom label for the next button */
  nextLabel?: string;
  /** Props to spread on back button (from Joyride) */
  backButtonProps?: ComponentProps<"button">;
  /** Props to spread on primary button (from Joyride) */
  primaryButtonProps?: ComponentProps<"button">;
  /** Props to spread on skip button (from Joyride) */
  skipButtonProps?: ComponentProps<"button">;
}

/**
 * The visual popover card — renderable standalone or as a Joyride tooltip.
 * Accepts either plain `onBack/onNext/onSkip` handlers OR Joyride's
 * `backButtonProps/primaryButtonProps/skipButtonProps` spreads.
 */
function OnboardingTourJoyridePopoverCard({
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
  backButtonProps,
  primaryButtonProps,
  skipButtonProps,
  className,
  ...rootProps
}: OnboardingTourJoyridePopoverCardProps) {
  const titleId = useId();

  return (
    <div
      data-slot="onboarding-tour-joyride-popover"
      {...rootProps}
      className={cn("relative", className)}
    >
      <AiGlow />

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
                {...(backButtonProps ?? { onClick: onBack })}
                variant="outline"
                size="icon-lg"
                aria-label="Go back"
              >
                <ArrowLeft />
              </Button>
            )}
            <Button
              {...(primaryButtonProps ?? { onClick: onNext })}
              className="px-8"
              autoFocus
            >
              {isLastStep ? "Done" : (nextLabel ?? "Next")}
            </Button>
          </div>

          {!isLastStep && (
            <Button
              {...(skipButtonProps ?? { onClick: onSkip })}
              variant="link"
              className="text-muted-foreground"
            >
              {"Skip tour"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

type OnboardingTourJoyridePopoverProps = TooltipRenderProps;

function readPopoverData(
  value: unknown,
): Partial<OnboardingTourJoyridePopoverData> {
  if (value === null || typeof value !== "object") return {};
  // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- narrowed to `object`; cast to index by string key
  const v = value as Record<string, unknown>;
  const result: Partial<OnboardingTourJoyridePopoverData> = {};
  if (typeof v.title === "string") result.title = v.title;
  if (typeof v.tip === "string") result.tip = v.tip;
  if (typeof v.nextLabel === "string") result.nextLabel = v.nextLabel;
  if (typeof v.currentStep === "number") result.currentStep = v.currentStep;
  if (typeof v.totalSteps === "number") result.totalSteps = v.totalSteps;
  if (typeof v.showBack === "boolean") result.showBack = v.showBack;
  // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- ReactNode is a broad union; we trust the provider to stash valid nodes
  if ("body" in v) result.body = v.body as ReactNode;
  return result;
}

/**
 * Joyride `tooltipComponent` — receives TooltipRenderProps and renders the
 * Apollo Vertex–styled popover card. Custom data travels on `step.data`.
 */
function OnboardingTourJoyridePopover({
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  step,
}: OnboardingTourJoyridePopoverProps) {
  const data = readPopoverData(step.data);

  return (
    <OnboardingTourJoyridePopoverCard
      {...tooltipProps}
      title={data.title ?? ""}
      body={data.body ?? null}
      tip={data.tip}
      currentStep={data.currentStep ?? 0}
      totalSteps={data.totalSteps ?? 1}
      showBack={data.showBack ?? false}
      nextLabel={data.nextLabel}
      isLastStep={isLastStep}
      backButtonProps={backProps}
      primaryButtonProps={primaryProps}
      skipButtonProps={skipProps}
    />
  );
}

export { OnboardingTourJoyridePopover, OnboardingTourJoyridePopoverCard };
export type {
  OnboardingTourJoyridePopoverProps,
  OnboardingTourJoyridePopoverCardProps,
  OnboardingTourJoyridePopoverData,
};
