import { cva } from "class-variance-authority";
import type * as React from "react";

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

interface SidePanelProps extends React.ComponentProps<"aside"> {
  /** Which edge of the template the panel sits on. Logical, so it flips in RTL. */
  side: "start" | "end";
  /** Set from the occupant's spec. Defaults to "padded". */
  padding?: SurfacePadding;
  /** Names the landmark for assistive tech. */
  "aria-label": string;
}

function SidePanel({
  side,
  padding = "padded",
  className,
  ...props
}: SidePanelProps) {
  return (
    <aside
      data-surface="side-panel"
      data-side={side}
      data-padding={padding}
      className={cn(sidePanelVariants({ padding }), className)}
      {...props}
    />
  );
}

export { SidePanel, sidePanelVariants };
export type { SidePanelProps };
