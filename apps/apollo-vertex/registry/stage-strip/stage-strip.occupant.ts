import { Waypoints } from "lucide-react";
import type { OccupantSpec } from "@/lib/composition";

/**
 * The stage strip's spec. It describes the space it needs from a surface,
 * never a template.
 */
export const stageStripOccupant = {
  name: "stage-strip",
  label: "Stage strip",
  icon: Waypoints,
  // A one-band summary: horizontal surfaces only.
  orientations: ["horizontal"],
  // Measured: the row of stage markers. The text wraps under it.
  requires: { minWidth: 128, padding: "padded", scroll: "either" },
} as const satisfies OccupantSpec;
