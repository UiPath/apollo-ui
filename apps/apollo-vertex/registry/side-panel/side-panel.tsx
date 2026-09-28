"use client";

import { cva } from "class-variance-authority";
import * as React from "react";

import type { SurfacePadding } from "@/lib/composition";
import { cn } from "@/lib/utils";

const sidePanelVariants = cva(
  "flex h-full w-(--side-panel-width) min-h-0 shrink-0 flex-col overflow-y-auto [--side-panel-width:280px]",
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

/**
 * Lets a template tell the panel in its slot whether it is open, so the
 * panel's data-state always matches the template's layout.
 */
const SidePanelOpenContext = React.createContext<boolean | null>(null);

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
  const templateOpen = React.useContext(SidePanelOpenContext);
  const open = openProp ?? templateOpen ?? true;
  return (
    <aside
      data-surface="side-panel"
      data-side={side}
      data-padding={padding}
      data-state={open ? "open" : "closed"}
      className={cn(sidePanelVariants({ padding }), className)}
      {...props}
    />
  );
}

export { SidePanel, SidePanelOpenContext, sidePanelVariants };
export type { SidePanelProps };
