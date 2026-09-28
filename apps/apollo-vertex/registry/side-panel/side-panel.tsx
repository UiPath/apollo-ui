"use client";

import { cva } from "class-variance-authority";
import * as React from "react";

import type { SurfacePadding } from "@/lib/composition";
import { cn } from "@/lib/utils";

const sidePanelVariants = cva(
  "flex h-full w-(--side-panel-width) min-h-0 shrink-0 flex-col [--side-panel-width:280px]",
);

const sidePanelBodyVariants = cva(
  "flex min-h-0 flex-1 flex-col overflow-y-auto",
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
  /** Set from the occupant's spec. Applies to the body, not the toolbar. */
  padding?: SurfacePadding;
  /** Overrides the open state a template provides. Defaults to open. */
  open?: boolean;
  /**
   * An optional top row for panel controls, the same height as the page
   * header's minimum (92px). Surface chrome, so occupant padding does not
   * apply to it.
   */
  toolbar?: React.ReactNode;
  /** Names the landmark for assistive tech. */
  "aria-label": string;
}

function SidePanel({
  side,
  padding = "padded",
  open: openProp,
  toolbar,
  className,
  children,
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
      className={cn(sidePanelVariants(), className)}
      {...props}
    >
      {toolbar && (
        <div
          data-slot="side-panel-toolbar"
          className="flex min-h-[92px] shrink-0 items-center gap-2 border-b border-border px-6"
        >
          {toolbar}
        </div>
      )}
      <div
        data-slot="side-panel-body"
        className={sidePanelBodyVariants({ padding })}
      >
        {children}
      </div>
    </aside>
  );
}

export {
  SidePanel,
  SidePanelOpenContext,
  sidePanelBodyVariants,
  sidePanelVariants,
};
export type { SidePanelProps };
