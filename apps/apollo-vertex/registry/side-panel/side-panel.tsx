"use client";

import { cva } from "class-variance-authority";
import * as React from "react";

import type { SurfacePadding } from "@/lib/composition";
import { cn } from "@/lib/utils";

// The background follows placement only, so the rules are !important:
// neither a className nor an inline style can set it. Beside-header panels
// get the translucent --side-panel-tint over the Shell's ambient layer;
// every other panel stays transparent.
const sidePanelVariants = cva(
  [
    "flex h-full w-(--side-panel-width) min-h-0 shrink-0 flex-col overflow-y-auto [--side-panel-width:280px]",
    "bg-transparent! bg-none! data-[placement=beside-header]:bg-side-panel-tint!",
  ].join(" "),
  {
    variants: {
      padding: {
        padded: "p-6",
        flush: "p-0",
      },
    },
    defaultVariants: {
      padding: "padded",
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
  /** Overrides the open state a template provides. Defaults to open. */
  open?: boolean;
  /** Names the landmark for assistive tech. */
  "aria-label": string;
}

function SidePanel({
  side,
  padding = "padded",
  open: openProp,
  className,
  ...props
}: SidePanelProps) {
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
      className={cn(sidePanelVariants({ padding }), className)}
      {...props}
    />
  );
}

export { SidePanel, SidePanelSlotContext, sidePanelVariants };
export type { SidePanelPlacement, SidePanelProps, SidePanelSlotState };
