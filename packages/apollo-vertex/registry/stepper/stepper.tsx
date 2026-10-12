"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps, useMemo } from "react";
import { cn } from "@/lib/utils";
import { StepperContext, type StepperOrientation } from "./stepper-context";

const stepperVariants = cva("flex w-full", {
  variants: {
    orientation: {
      horizontal: "flex-row items-center",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

interface StepperProps
  extends ComponentProps<"ol">,
    VariantProps<typeof stepperVariants> {
  activeStep: number;
}

function Stepper({
  className,
  activeStep,
  orientation = "horizontal",
  ...props
}: StepperProps) {
  const value = useMemo(
    () => ({ activeStep, orientation: orientation ?? "horizontal" }),
    [activeStep, orientation],
  );

  return (
    <StepperContext.Provider value={value}>
      <ol
        data-slot="stepper"
        data-orientation={orientation}
        className={cn(stepperVariants({ orientation }), className)}
        {...props}
      />
    </StepperContext.Provider>
  );
}

export { Stepper, stepperVariants };
export type { StepperProps };

// Re-export child parts here too: shadcn may rewrite a barrel import to the main file.
export {
  StepperContent,
  StepperDescription,
  StepperTitle,
} from "./stepper-content";
export { StepperIndicator } from "./stepper-indicator";
export {
  StepperItem,
  type StepperItemProps,
  stepperItemVariants,
} from "./stepper-item";
export { StepperSeparator } from "./stepper-separator";
export { StepperTrigger } from "./stepper-trigger";
export type { StepperItemState, StepperOrientation } from "./stepper-context";
