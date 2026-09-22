"use client";

import { cva } from "class-variance-authority";
import { type ComponentProps, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  StepperItemContext,
  type StepperItemState,
  useStepperContext,
} from "./stepper-context";

const stepperItemVariants = cva("group/stepper-item flex", {
  variants: {
    orientation: {
      horizontal: "flex-1 items-center gap-3 last:flex-none",
      vertical: "flex-col gap-2",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

interface StepperItemProps extends ComponentProps<"li"> {
  step: number;
  completed?: boolean;
}

function StepperItem({
  className,
  step,
  completed,
  ...props
}: StepperItemProps) {
  const { activeStep, orientation } = useStepperContext();

  const isCompleted = completed ?? step < activeStep;
  const state: StepperItemState = isCompleted
    ? "completed"
    : step === activeStep
      ? "active"
      : "inactive";

  const value = useMemo(() => ({ step, state }), [step, state]);

  return (
    <StepperItemContext.Provider value={value}>
      <li
        data-slot="stepper-item"
        data-state={state}
        className={cn(stepperItemVariants({ orientation }), className)}
        {...props}
      />
    </StepperItemContext.Provider>
  );
}

export { StepperItem, stepperItemVariants };
export type { StepperItemProps };
