import { ListTodo } from "lucide-react";
import { LAYOUT_TOKENS, type OccupantSpec } from "@/lib/composition";

/**
 * The queue spec. It describes the space it needs from a
 * surface, never a template.
 */
export const queueOccupant = {
  name: "queue",
  label: "Queue",
  icon: ListTodo,
  orientations: ["vertical"],
  // Follows the side panel's minimum width, so it fits any
  // side panel. pnpm measure:occupant checks nothing clips there.
  requires: {
    minWidth: LAYOUT_TOKENS.sidePanelWidthMin,
    padding: "flush",
    scroll: "occupant",
  },
} as const satisfies OccupantSpec;
