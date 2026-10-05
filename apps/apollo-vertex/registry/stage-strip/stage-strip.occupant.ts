import { Waypoints } from "lucide-react";
import type { OccupantSpec } from "@/lib/composition";

/**
 * The stage strip's spec. It describes the space it needs from a surface,
 * never a template.
 */
export const stageStripOccupant = {
  name: "stage-strip",
  label: "Stage strip",
  titleKey: "stage_strip_title",
  icon: Waypoints,
  // A one-band summary: horizontal surfaces only.
  orientations: ["horizontal"],
  // Declared above its measured floor (pnpm measure:occupant): the markers
  // and text wrap narrower, but below this the current stage is hard to read.
  requires: { minWidth: 128, padding: "padded", scroll: "either" },
} as const satisfies OccupantSpec;
