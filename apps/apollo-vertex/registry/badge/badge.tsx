import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
      status: {
        default: "",
        info: "",
        warning: "",
        success: "",
        error: "",
      },
    },
    compoundVariants: [
      // default status + primary (variant="default")
      { status: "default", variant: "default", class: "border-transparent bg-muted text-foreground" },
      // default status + secondary
      { status: "default", variant: "secondary", class: "border-transparent bg-muted/50 text-muted-foreground" },
      // default status + outline
      { status: "default", variant: "outline", class: "border-border text-muted-foreground bg-transparent" },

      // info status + primary
      { status: "info", variant: "default", class: "border-transparent bg-info text-info-foreground" },
      // info status + secondary
      { status: "info", variant: "secondary", class: "border-transparent bg-info/15 text-info" },
      // info status + outline
      { status: "info", variant: "outline", class: "border-info text-info bg-transparent" },

      // warning status + primary
      { status: "warning", variant: "default", class: "border-transparent bg-warning text-warning-foreground" },
      // warning status + secondary
      { status: "warning", variant: "secondary", class: "border-transparent bg-warning/15 text-warning" },
      // warning status + outline
      { status: "warning", variant: "outline", class: "border-warning text-warning bg-transparent" },

      // success status + primary
      { status: "success", variant: "default", class: "border-transparent bg-success text-success-foreground" },
      // success status + secondary
      { status: "success", variant: "secondary", class: "border-transparent bg-success/15 text-success" },
      // success status + outline
      { status: "success", variant: "outline", class: "border-success text-success bg-transparent" },

      // error status + primary
      { status: "error", variant: "default", class: "border-transparent bg-destructive text-destructive-foreground" },
      // error status + secondary
      { status: "error", variant: "secondary", class: "border-transparent bg-destructive/15 text-destructive" },
      // error status + outline
      { status: "error", variant: "outline", class: "border-destructive text-destructive bg-transparent" },
    ],
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeVariantProps = VariantProps<typeof badgeVariants>;

function Badge({
  className,
  variant,
  status,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  BadgeVariantProps & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      data-status={status}
      className={cn(badgeVariants({ variant, status }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
