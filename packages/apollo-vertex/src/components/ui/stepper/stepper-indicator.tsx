"use client";

import { CheckIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { useStepperItemContext } from "./stepper-context";

function StepperIndicator({
  className,
  children,
  ...props
}: ComponentProps<"span">) {
  const { step, state } = useStepperItemContext();

  return (
    <span
      data-slot="stepper-indicator"
      data-state={state}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors",
        "data-[state=inactive]:border-border data-[state=inactive]:text-muted-foreground",
        "data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
        "data-[state=completed]:border-primary data-[state=completed]:bg-primary data-[state=completed]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      {state === "completed" ? (
        <CheckIcon className="size-4" />
      ) : (
        (children ?? step + 1)
      )}
    </span>
  );
}

export { StepperIndicator };
