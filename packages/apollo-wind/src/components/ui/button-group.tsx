import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { cn } from "@/lib/index";

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        className={cn(
          "inline-flex",
          orientation === "horizontal"
            ? "[&>button]:rounded-none [&>button]:border-r-0 [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md [&>button:last-child]:border-r"
            : "flex-col [&>button]:rounded-none [&>button]:border-b-0 [&>button:first-child]:rounded-t-md [&>button:last-child]:rounded-b-md [&>button:last-child]:border-b",
          className,
        )}
        {...props}
      />
    );
  },
);
ButtonGroup.displayName = "ButtonGroup";

interface ButtonGroupSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

const ButtonGroupSeparator = React.forwardRef<HTMLDivElement, ButtonGroupSeparatorProps>(
  ({ className, orientation = "vertical", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="separator"
        className={cn(
          "bg-border",
          orientation === "vertical" ? "w-px self-stretch" : "h-px self-stretch",
          className,
        )}
        {...props}
      />
    );
  },
);
ButtonGroupSeparator.displayName = "ButtonGroupSeparator";

interface ButtonGroupTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
}

const ButtonGroupText = React.forwardRef<HTMLSpanElement, ButtonGroupTextProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center px-3 text-sm font-medium text-muted-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);
ButtonGroupText.displayName = "ButtonGroupText";

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText };
