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
          "border-transparent bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
      status: {
        info: "",
        warning: "",
        success: "",
        error: "",
      },
    },
    compoundVariants: [
      // info status
      { status: "info", variant: "default", class: "border-transparent bg-info text-info-foreground" },
      { status: "info", variant: "secondary", class: "border-transparent bg-info/15 text-info dark:text-white" },
      { status: "info", variant: "outline", class: "border-info text-info bg-transparent" },

      // warning status
      { status: "warning", variant: "default", class: "border-transparent bg-warning text-warning-foreground" },
      { status: "warning", variant: "secondary", class: "border-transparent bg-warning/15 text-warning-foreground dark:text-white" },
      { status: "warning", variant: "outline", class: "border-warning text-warning-foreground dark:text-warning bg-transparent" },

      // success status
      { status: "success", variant: "default", class: "border-transparent bg-success text-success-foreground" },
      { status: "success", variant: "secondary", class: "border-transparent bg-success/10 dark:bg-success/15 text-success dark:text-white" },
      { status: "success", variant: "outline", class: "border-success text-success bg-transparent" },

      // error status
      { status: "error", variant: "default", class: "border-transparent bg-destructive text-destructive-foreground" },
      { status: "error", variant: "secondary", class: "border-transparent bg-destructive/10 dark:bg-destructive/15 text-destructive dark:text-white" },
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
