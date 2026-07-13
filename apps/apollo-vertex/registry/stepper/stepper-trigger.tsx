"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function StepperTrigger({
  className,
  onClick,
  disabled,
  children,
  ...props
}: ComponentProps<"button">) {
  const interactive = Boolean(onClick) && !disabled;

  return (
    <button
      // Spread first so the attributes below win over caller-provided props.
      {...props}
      {...(interactive ? { onClick } : { "aria-disabled": true, tabIndex: -1 })}
      type="button"
      data-slot="stepper-trigger"
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 rounded-md text-left outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        interactive ? "cursor-pointer" : "cursor-default",
        className,
      )}
    >
      {children}
    </button>
  );
}

export { StepperTrigger };
