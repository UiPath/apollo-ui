import { Check } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/index";

export interface Step {
  title: string;
  description?: string;
}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Step[];
  currentStep: number;
  orientation?: "horizontal" | "vertical";
  onStepClick?: (step: number) => void;
  clickableSteps?: boolean;
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      steps,
      currentStep,
      orientation = "horizontal",
      onStepClick,
      clickableSteps = false,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "flex-row items-start" : "flex-col",
          className,
        )}
        {...props}
      >
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = clickableSteps && index <= currentStep;

          return (
            <React.Fragment key={index}>
              {/* Step item */}
              <div
                className={cn(
                  "flex shrink-0",
                  orientation === "horizontal" ? "flex-col items-center" : "flex-row items-start",
                  orientation === "vertical" && "w-full",
                )}
              >
                <div
                  className={cn(
                    "flex",
                    orientation === "horizontal"
                      ? "flex-col items-center"
                      : "flex-row items-start gap-4",
                  )}
                >
                  <button
                    type="button"
                    aria-label={
                      isCompleted
                        ? `Step ${index + 1} completed: ${step.title}`
                        : `Step ${index + 1}: ${step.title}`
                    }
                    onClick={() => {
                      if (isClickable && onStepClick) {
                        onStepClick(index);
                      }
                    }}
                    disabled={!isClickable}
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                      isCompleted && "border-primary bg-primary text-primary-foreground",
                      isCurrent && "border-primary bg-background text-primary",
                      !isCompleted &&
                        !isCurrent &&
                        "border-muted-foreground/25 bg-background text-muted-foreground",
                      isClickable && "cursor-pointer hover:border-primary",
                      !isClickable && "cursor-not-allowed",
                    )}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <span>{index + 1}</span>}
                  </button>
                  <div
                    className={cn(
                      "flex flex-col",
                      orientation === "horizontal"
                        ? "mt-2 items-center text-center"
                        : "flex-1 justify-center",
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isCurrent && "text-foreground",
                        !isCurrent && "text-muted-foreground",
                      )}
                    >
                      {step.title}
                    </span>
                    {step.description && (
                      <span className="text-xs text-muted-foreground">{step.description}</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    orientation === "horizontal"
                      ? "mt-5 flex h-[2px] flex-1 items-center"
                      : "ml-5 h-8 w-[2px]",
                    "bg-muted",
                  )}
                >
                  <div
                    className={cn(
                      "transition-all",
                      orientation === "horizontal" ? "h-full" : "w-full",
                      isCompleted ? "bg-primary" : "bg-transparent",
                    )}
                    style={{
                      width: orientation === "horizontal" ? (isCompleted ? "100%" : "0%") : "100%",
                      height: orientation === "vertical" ? (isCompleted ? "100%" : "0%") : "100%",
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  },
);
Stepper.displayName = "Stepper";

export { Stepper };
