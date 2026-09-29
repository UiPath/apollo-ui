"use client";

import { cva } from "class-variance-authority";
import type * as React from "react";

import { SCROLL_FADE_MASK, useScrollFade } from "@/hooks/use-scroll-fade";
import type { ScrollOwner, SurfacePadding } from "@/lib/composition";
import { SurfaceProvider, useSurfaceFrame } from "@/lib/surface-context";
import { cn } from "@/lib/utils";
import { contentAreaSurface } from "./content-area.surface";

// The root is also the inner area: an inline-size container, and what
// useSurface() measures.
const contentAreaVariants = cva(
  "@container flex h-full min-h-0 min-w-0 flex-1 flex-col",
  {
    variants: {
      padding: {
        padded: "p-(--surface-inset)",
        flush: "p-0",
      },
      // Content-area has no background, so the mask sits on it directly.
      scroll: {
        surface: ["overflow-y-auto", SCROLL_FADE_MASK].join(" "),
        occupant: "overflow-hidden",
      },
    },
    defaultVariants: {
      padding: "padded",
      scroll: "surface",
    },
  },
);

interface ContentAreaProps extends React.ComponentProps<"div"> {
  /** Set from the occupant's spec. Defaults to "padded". */
  padding?: SurfacePadding;
  /**
   * Who scrolls, from the occupant's spec. "surface" (default): main
   * scrolls and fades. "occupant": it neither scrolls nor fades, and gives
   * the occupant its full height to scroll itself.
   */
  scroll?: ScrollOwner;
}

function ContentArea({
  padding = "padded",
  scroll = "surface",
  className,
  ref,
  children,
  ...props
}: ContentAreaProps) {
  const frame = useSurfaceFrame<HTMLDivElement>(
    contentAreaSurface.provides.orientation,
    ref,
  );
  const rootRef = useScrollFade<HTMLDivElement>(
    scroll === "surface",
    frame.ref,
  );
  return (
    <div
      ref={rootRef}
      data-surface="content-area"
      data-padding={padding}
      data-scroll={scroll}
      className={cn(contentAreaVariants({ padding, scroll }), className)}
      {...props}
    >
      <SurfaceProvider value={frame.value}>{children}</SurfaceProvider>
    </div>
  );
}

export { ContentArea, contentAreaVariants };
export type { ContentAreaProps };
