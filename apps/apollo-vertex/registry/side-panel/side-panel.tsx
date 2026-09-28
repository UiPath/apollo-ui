import type * as React from "react";

import { cn } from "@/lib/utils";

interface SidePanelProps extends React.ComponentProps<"aside"> {
  /** Which edge of the template the panel sits on. Logical, so it flips in RTL. */
  side: "start" | "end";
  /** Names the landmark for assistive tech. */
  "aria-label": string;
}

function SidePanel({ side, className, ...props }: SidePanelProps) {
  return (
    <aside
      data-surface="side-panel"
      data-side={side}
      className={cn(
        "flex h-full w-(--side-panel-width) min-h-0 shrink-0 flex-col overflow-y-auto border-border [--side-panel-width:280px]",
        side === "start" ? "border-e" : "border-s",
        className,
      )}
      {...props}
    />
  );
}

export { SidePanel };
export type { SidePanelProps };
