import { History } from "lucide-react";
import type { OccupantSpec } from "@/lib/composition";

/**
 * The activity timeline's spec. It describes the space it needs from a
 * surface, never a template.
 */
export const activityTimelineOccupant = {
  name: "activity-timeline",
  label: "Activity timeline",
  icon: History,
  // The full event list grows downward: vertical surfaces only.
  orientations: ["vertical"],
  // Declared above the measured floor (100px across every example) so event
  // titles and details stay readable, not one word per line.
  requires: { minWidth: 240, padding: "padded", scroll: "surface" },
} as const satisfies OccupantSpec;
