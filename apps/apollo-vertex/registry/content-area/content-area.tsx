"use client";

import { cva } from "class-variance-authority";
import type * as React from "react";

import { SCROLL_FADE_MASK, useScrollFade } from "@/hooks/use-scroll-fade";
import type { ScrollOwner, SurfacePadding } from "@/lib/composition";
import { SurfaceProvider, useSurfaceFrame } from "@/lib/surface-context";
import { cn } from "@/lib/utils";
import { contentAreaSurface } from "./content-area.surface";

// The root draws the focus ring: the body's mask would hide its own.
const contentAreaVariants = cva(
  [
    "flex h-full min-h-0 min-w-0 flex-1 flex-col",
    "has-[>[data-slot=content-area-body]:focus-visible]:ring-2 has-[>[data-slot=content-area-body]:focus-visible]:ring-inset has-[>[data-slot=content-area-body]:focus-visible]:ring-ring",
  ].join(" "),
);

// The body is the inner area: it holds the padding, is the inline-size
// container and what useSurface() measures, and, when the surface owns
// scrolling, is the scroll container with the fade mask. Content-area has no
// background, so masking the body fades only content.
const contentAreaBodyVariants = cva(
  "@container flex min-h-0 min-w-0 flex-1 flex-col outline-none",
  {
    variants: {
      padding: {
        padded: "p-(--surface-inset)",
        flush: "p-0",
      },
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
  );
  // While it scrolls, the body takes keyboard focus so it can be scrolled.
  const bodyRef = useScrollFade<HTMLDivElement>(
    scroll === "surface",
    frame.ref,
    {
      focusable: true,
    },
  );
  return (
    <div
      ref={ref}
      data-surface="content-area"
      data-padding={padding}
      data-scroll={scroll}
      className={cn(contentAreaVariants(), className)}
      {...props}
    >
      <div
        ref={bodyRef}
        data-slot="content-area-body"
        className={contentAreaBodyVariants({ padding, scroll })}
      >
        <SurfaceProvider value={frame.value}>{children}</SurfaceProvider>
      </div>
    </div>
  );
}

export { ContentArea };
export type { ContentAreaProps };
