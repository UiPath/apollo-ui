import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Experimental: option C ("Rail"). A 44px strip at the template's start
 * edge. The top zone matches the page header's minimum height and holds
 * back; its bottom border is the divider before the occupant icons.
 */
interface PageRailProps extends ComponentProps<"div"> {
  /** Shown in the top zone, e.g. a back button. */
  top?: React.ReactNode;
}

export function PageRail({
  top,
  className,
  children,
  ...props
}: PageRailProps) {
  return (
    <div
      data-surface="page-rail"
      className={cn(
        "flex h-full w-11 min-h-0 flex-col items-center",
        className,
      )}
      {...props}
    >
      <div
        data-slot="page-rail-top"
        className="flex min-h-[92px] w-full shrink-0 items-center justify-center border-b border-border"
      >
        {top}
      </div>
      <div
        data-slot="page-rail-items"
        className="flex flex-col items-center gap-2 pt-3"
      >
        {children}
      </div>
    </div>
  );
}
