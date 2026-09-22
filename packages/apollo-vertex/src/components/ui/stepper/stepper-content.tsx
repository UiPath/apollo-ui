"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { useStepperItemContext } from "./stepper-context";

function StepperContent({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="stepper-content"
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    />
  );
}

function StepperTitle({ className, ...props }: ComponentProps<"span">) {
  const { state } = useStepperItemContext();

  return (
    <span
      data-slot="stepper-title"
      data-state={state}
      className={cn(
        "text-sm font-medium leading-snug",
        "data-[state=inactive]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function StepperDescription({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="stepper-description"
      className={cn("text-muted-foreground text-xs leading-normal", className)}
      {...props}
    />
  );
}

export { StepperContent, StepperDescription, StepperTitle };
