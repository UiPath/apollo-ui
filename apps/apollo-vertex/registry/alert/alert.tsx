import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

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
        info: "",
        success: "",
        warning: "",
        error: "",
      },
      visual: {
        outline: "bg-transparent",
        tinted: "border-transparent",
        subtle: "",
      },
    },
    compoundVariants: [
      // outline — status-colored border + icon
      {
        status: "info",
        visual: "outline",
        className: "border-info [&>svg]:text-info",
      },
      {
        status: "success",
        visual: "outline",
        className: "border-success [&>svg]:text-success",
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

      // tinted — colored background, text, icon; description inherits container color
      {
        status: "info",
        visual: "tinted",
        className:
          "bg-info/15 dark:bg-info/25 text-[var(--info-fg)] dark:text-white [&>svg]:text-[var(--info-fg)] dark:[&>svg]:text-white *:data-[slot=alert-description]:text-inherit",
      },
      {
        status: "success",
        visual: "tinted",
        className:
          "bg-success/10 dark:bg-success/25 text-[var(--success-fg)] dark:text-white [&>svg]:text-[var(--success-fg)] dark:[&>svg]:text-white *:data-[slot=alert-description]:text-inherit",
      },
      {
        status: "warning",
        visual: "tinted",
        className:
          "bg-warning/15 dark:bg-warning/25 text-warning-foreground dark:text-white [&>svg]:text-warning-foreground dark:[&>svg]:text-warning *:data-[slot=alert-description]:text-inherit",
      },
      {
        status: "error",
        visual: "tinted",
        className:
          "bg-destructive/10 dark:bg-destructive/25 text-[var(--destructive-fg)] dark:text-white [&>svg]:text-[var(--destructive-fg)] dark:[&>svg]:text-white *:data-[slot=alert-description]:text-inherit",
      },

      // subtle — icon color via CVA; title color applied by AlertTitle via AlertContext
      {
        status: "info",
        visual: "subtle",
        className: "[&>svg]:text-[var(--info-fg)] dark:[&>svg]:text-info",
      },
      {
        status: "success",
        visual: "subtle",
        className: "[&>svg]:text-[var(--success-fg)] dark:[&>svg]:text-success",
      },
      {
        status: "warning",
        visual: "subtle",
        className: "[&>svg]:text-warning-foreground dark:[&>svg]:text-warning",
      },
      {
        status: "error",
        visual: "subtle",
        className:
          "[&>svg]:text-[var(--destructive-fg)] dark:[&>svg]:text-destructive",
      },
    ],
    defaultVariants: {
      variant: "default",
    },
  },
);

interface AlertContextValue {
  status?: "info" | "success" | "warning" | "error" | null;
  visual?: "outline" | "tinted" | "subtle" | null;
}

const AlertContext = React.createContext<AlertContextValue>({});

interface AlertProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof alertVariants> {}

function Alert({
  className,
  variant,
  status,
  visual,
  children,
  ...props
}: AlertProps) {
  return (
    <AlertContext.Provider value={{ status, visual }}>
      <div
        data-slot="alert"
        role="alert"
        className={cn(alertVariants({ variant, status, visual }), className)}
        {...props}
      >
        {children}
      </div>
    </AlertContext.Provider>
  );
}

// Title colors for the subtle visual variant, keyed by status
const subtleTitleColors: Record<string, string> = {
  info: "text-[var(--info-fg)] dark:text-info",
  success: "text-[var(--success-fg)] dark:text-success",
  warning: "text-warning-foreground dark:text-warning",
  error: "text-[var(--destructive-fg)] dark:text-destructive",
};

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  const { status, visual } = React.useContext(AlertContext);
  const colorClass =
    visual === "subtle" && status ? (subtleTitleColors[status] ?? "") : "";
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        colorClass,
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
