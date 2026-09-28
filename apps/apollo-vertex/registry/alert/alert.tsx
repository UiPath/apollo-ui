"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
      status: {
        default: "",
        warning: "",
        error: "",
      },
      visual: {
        outline: "bg-card",
        tinted: "border-transparent",
      },
    },
    compoundVariants: [
      // outline — status-colored border + icon
      {
        status: "default",
        visual: "outline",
        className: "border-badge [&>svg]:text-foreground",
      },
      {
        status: "warning",
        visual: "outline",
        className:
          "border-warning [&>svg]:text-warning-foreground dark:[&>svg]:text-warning",
      },
      {
        status: "error",
        visual: "outline",
        className: "border-destructive [&>svg]:text-destructive",
      },

      // tinted — status-tinted background, foreground title, status-colored icon
      {
        status: "default",
        visual: "tinted",
        className:
          "bg-badge/20 border-transparent text-foreground [&>svg]:text-foreground",
      },
      {
        status: "warning",
        visual: "tinted",
        className:
          "bg-warning/15 dark:bg-warning/25 text-foreground [&>svg]:text-warning-foreground dark:[&>svg]:text-warning",
      },
      {
        status: "error",
        visual: "tinted",
        className:
          "bg-destructive/10 dark:bg-destructive/25 text-foreground [&>svg]:text-destructive",
      },
    ],
    defaultVariants: {
      variant: "default",
    },
  },
);

interface AlertProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof alertVariants> {
  dismissible?: boolean;
  onDismiss?: () => void;
}

function Alert({
  className,
  variant,
  status,
  visual,
  dismissible,
  onDismiss,
  children,
  ...props
}: AlertProps) {
  const [visible, setVisible] = React.useState(true);

  if (!visible) return null;

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        alertVariants({ variant, status, visual }),
        dismissible && "pr-10",
        className,
      )}
      {...props}
    >
      {children}
      {dismissible && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setVisible(false);
            onDismiss?.();
          }}
          className="absolute top-3 right-3 size-auto rounded-sm p-0 opacity-70 hover:bg-transparent dark:hover:bg-transparent hover:opacity-100"
          aria-label="Dismiss"
        >
          <XIcon className="size-4" />
        </Button>
      )}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
export type { AlertProps };
