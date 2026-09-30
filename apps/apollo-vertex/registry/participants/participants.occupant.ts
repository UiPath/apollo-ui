import { Users } from "lucide-react";
import type { OccupantSpec } from "@/lib/composition";

/**
 * The participants spec. It describes the space it needs from a
 * surface, never a template.
 */
export const participantsOccupant = {
  name: "participants",
  label: "Participants",
  icon: Users,
  orientations: ["vertical"],
  // Everything wraps, so the measured floor is under 40px. 200px keeps a name
  // and role readable on a line or two, not one word per line.
  requires: { minWidth: 200, padding: "padded", scroll: "surface" },
} as const satisfies OccupantSpec;
