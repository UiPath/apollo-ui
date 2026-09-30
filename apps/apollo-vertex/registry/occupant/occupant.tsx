import type * as React from "react";
import type { OccupantSpec } from "@/lib/composition";
import { cn } from "@/lib/utils";

interface OccupantProps extends React.ComponentProps<"div"> {
  spec: OccupantSpec;
  /**
   * "fill" (default): a box that fills the surface's inner area.
   * "contents": no box of its own, for an occupant whose parts must be
   * direct children of the surface's layout (like PageHeader's grid).
   */
  layout?: "fill" | "contents";
}

/**
 * An occupant's root. It renders data-occupant from the spec and fills the
 * surface's inner area. It adds no padding; the surface owns that.
 */
function Occupant({
  spec,
  layout = "fill",
  className,
  ...props
}: OccupantProps) {
  return (
    <div
      data-slot="occupant"
      data-occupant={spec.name}
      className={cn(
        layout === "contents" ? "contents" : "flex min-h-0 flex-1 flex-col",
        className,
      )}
      {...props}
    />
  );
}

export { Occupant };
export type { OccupantProps };
// Re-exported so one import brings the whole kit (see AGENTS.md on barrels).
export { OccupantStateView } from "./occupant-state-view";
export type { OccupantStateViewProps } from "./occupant-state-view";
export { OCCUPANT_STATES } from "./occupant-states";
export type {
  OccupantSelectionProps,
  OccupantState,
  OccupantViewProps,
} from "./occupant-states";
export { OccupantStatus } from "./occupant-status";
export { OccupantTruncatedText } from "./occupant-truncated-text";
export type { OccupantTruncatedTextProps } from "./occupant-truncated-text";
export type {
  OccupantStatusProps,
  OccupantStatusValue,
  OccupantTone,
} from "./occupant-status";
