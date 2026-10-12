"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { useStepperContext, useStepperItemContext } from "./stepper-context";

function StepperSeparator({ className, ...props }: ComponentProps<"span">) {
  const { orientation } = useStepperContext();
  const { state } = useStepperItemContext();

  return (
    <span
      data-slot="stepper-separator"
      data-state={state}
      className={cn(
        "bg-border transition-colors data-[state=completed]:bg-primary",
        orientation === "horizontal"
          ? "h-px flex-1"
          : "ms-4 w-px flex-1 self-stretch",
        className,
      )}
      {...props}
    />
  );
}

export { StepperSeparator };
