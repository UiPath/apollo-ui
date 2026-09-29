"use client";

import { cva } from "class-variance-authority";
import * as React from "react";

import { SCROLL_FADE_MASK, useScrollFade } from "@/hooks/use-scroll-fade";
import type { ScrollOwner, SurfacePadding } from "@/lib/composition";
import { SurfaceProvider, useSurfaceFrame } from "@/lib/surface-context";
import { cn } from "@/lib/utils";
import { sidePanelSurface } from "./side-panel.surface";

// The background follows placement only, so the rules are !important:
// neither a className nor an inline style can set it. Beside-header panels
// get the translucent --side-panel-tint over the Shell's ambient layer;
// every other panel stays transparent.
const sidePanelVariants = cva(
  [
    "flex h-full w-(--side-panel-width) min-h-0 shrink-0 flex-col [--side-panel-width:var(--side-panel-width-min)]",
    "bg-transparent! bg-none! data-[placement=beside-header]:bg-side-panel-tint!",
    // The body's mask would hide its own focus ring, so the panel draws it.
    "has-[>[data-slot=side-panel-body]:focus-visible]:ring-2 has-[>[data-slot=side-panel-body]:focus-visible]:ring-inset has-[>[data-slot=side-panel-body]:focus-visible]:ring-ring",
  ].join(" "),
);

// The body holds the padding and, when the surface owns scrolling, is the
// scroll container with the fade mask. It is separate from the panel so the
// mask fades the content, never the panel's tint. It is the inner area: an
// inline-size container, and what useSurface() measures.
const sidePanelBodyVariants = cva(
  "@container flex min-h-0 flex-1 flex-col outline-none",
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

type SidePanelPlacement = "below-header" | "beside-header";

interface SidePanelSlotState {
  open: boolean;
  placement: SidePanelPlacement;
}

/**
 * Lets a template tell the panel in its slot whether it is open and where
 * it sits, so data-state and data-placement always match the layout.
 */
const SidePanelSlotContext = React.createContext<SidePanelSlotState | null>(
  null,
);

interface SidePanelProps extends React.ComponentProps<"aside"> {
  /** Which edge of the template the panel sits on. Logical, so it flips in RTL. */
  side: "start" | "end";
  /** Set from the occupant's spec. Defaults to "padded". */
  padding?: SurfacePadding;
  /**
   * Who scrolls, from the occupant's spec. "surface" (default): the panel
   * body scrolls and fades. "occupant": the panel neither scrolls nor
   * fades, and gives the occupant its full height to scroll itself.
   */
  scroll?: ScrollOwner;
  /** Overrides the open state a template provides. Defaults to open. */
  open?: boolean;
  /** Names the landmark for assistive tech. */
  "aria-label": string;
}

function SidePanel({
  side,
  padding = "padded",
  scroll = "surface",
  open: openProp,
  className,
  children,
  ...props
}: SidePanelProps) {
  const frame = useSurfaceFrame<HTMLDivElement>(
    sidePanelSurface.provides.orientation,
  );
  // While it scrolls, the body takes keyboard focus so it can be scrolled.
  const bodyRef = useScrollFade<HTMLDivElement>(
    scroll === "surface",
    frame.ref,
    {
      focusable: true,
    },
  );
  const slot = React.useContext(SidePanelSlotContext);
  const open = openProp ?? slot?.open ?? true;
  const placement = slot?.placement ?? "below-header";
  return (
    <aside
      data-surface="side-panel"
      data-side={side}
      data-padding={padding}
      data-state={open ? "open" : "closed"}
      data-placement={placement}
      data-scroll={scroll}
      className={cn(sidePanelVariants(), className)}
      {...props}
    >
      <div
        ref={bodyRef}
        data-slot="side-panel-body"
        className={sidePanelBodyVariants({ padding, scroll })}
      >
        <SurfaceProvider value={frame.value}>{children}</SurfaceProvider>
      </div>
    </aside>
  );
}

export {
  SidePanel,
  SidePanelSlotContext,
  sidePanelBodyVariants,
  sidePanelVariants,
};
export type { SidePanelPlacement, SidePanelProps, SidePanelSlotState };
