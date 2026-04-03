import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

export const GLASS_CLASSES = [
  "bg-white/55 border border-white/80 rounded-2xl backdrop-blur-sm",
  "shadow-[0_2px_16px_2px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.6)]",
  "dark:bg-white/[0.055] dark:border-white/[0.03]",
  "dark:shadow-[0_2px_24px_2px_rgba(0,0,0,0.12),inset_0_1px_0_0_color-mix(in_srgb,var(--sidebar)_5%,transparent)]",
] as const;

const cardVariants = cva("flex flex-col gap-6 py-6 text-card-foreground", {
  variants: {
    variant: {
      default: GLASS_CLASSES,
      solid: "bg-card rounded-xl border",
      glass: GLASS_CLASSES,
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface CardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof cardVariants> {
  selectable?: "standard" | "ai";
  selected?: boolean;
}

function Card({
  className,
  variant,
  selectable,
  selected = false,
  children,
  ...props
}: CardProps) {
  if (selectable) {
    const isAi = selectable === "ai";

    return (
      <div
        className="relative group h-full"
        data-slot="card"
        data-variant={variant}
        data-selectable={selectable}
      >
        {/* Selected glow: gradient for ai, primary for standard */}
        {isAi ? (
          <div
            className={cn(
              "absolute inset-0 rounded-2xl pointer-events-none blur-xl",
              "transition-opacity duration-150",
              selected ? "opacity-100" : "opacity-0",
            )}
            style={{ background: "var(--ai-gradient)" }}
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 rounded-2xl pointer-events-none blur-xl bg-primary-400/15 dark:bg-primary-400/30",
              "transition-opacity duration-150",
              selected ? "opacity-100" : "opacity-0",
            )}
          />
        )}

        {/* Hover glow: always primary */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl pointer-events-none blur-xl bg-primary-400/15 dark:bg-primary-400/50",
            "opacity-0 transition-opacity duration-150",
            !selected && "group-hover:opacity-100",
          )}
        />

        <button
          {...(props as React.ComponentProps<"button">)}
          type="button"
          aria-pressed={selected}
          className={cn(
            "relative w-full h-full flex flex-col text-left p-5 text-card-foreground",
            GLASS_CLASSES,
            "transition-all duration-150 cursor-pointer",
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
            selected
              ? "border-primary dark:border-primary bg-card dark:bg-card"
              : "hover:bg-card dark:hover:bg-card",
            className,
          )}
        >
          {children}
        </button>
      </div>
    );
  }

  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  cardVariants,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};

export type { CardProps };
